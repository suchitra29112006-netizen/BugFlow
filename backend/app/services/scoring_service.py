from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.issue import Issue, IssueStatus
from app.models.user import User, UserRole
from app.models.developer_profile import DeveloperProfile, DeveloperSkill, DeveloperTechnology
from app.models.issue_intelligence import IssueIntelligence


class AssignmentScoringService:
    # Configurable Weights (Phase 3)
    WEIGHTS = {
        "skill": 0.35,
        "technology": 0.20,
        "experience": 0.15,
        "workload": 0.15,
        "past_similar": 0.10,
        "availability": 0.05
    }

    @classmethod
    def calculate_candidate_score(
        cls,
        issue: Issue,
        intelligence: Optional[IssueIntelligence],
        developer: User,
        profile: Optional[DeveloperProfile],
        db: Session
    ) -> Dict[str, Any]:
        """
        Calculates normalized assignment score (0-100) and explainable reasons for a candidate developer.
        """
        positive_reasons = []
        concerns = []

        # 1. Skill Match Score (35%)
        required_skills = [s.strip().lower() for s in intelligence.required_skills.split(",")] if intelligence and intelligence.required_skills else []
        dev_skills_map = {s.skill_name.lower(): s.proficiency_level for s in profile.skills} if profile and profile.skills else {}

        if required_skills and dev_skills_map:
            matched_count = 0
            proficiency_sum = 0
            for req_skill in required_skills:
                for dev_skill_name, level in dev_skills_map.items():
                    if req_skill in dev_skill_name or dev_skill_name in req_skill:
                        matched_count += 1
                        proficiency_sum += level
                        break
            
            if matched_count > 0:
                avg_prof = proficiency_sum / matched_count
                skill_score = min(100.0, (matched_count / len(required_skills)) * (avg_prof / 5.0) * 100.0)
                matched_skill_names = [s.title() for s in required_skills if any(dev_s in s or s in dev_s for dev_s in dev_skills_map.keys())]
                positive_reasons.append(f"Strong match for required skills: {', '.join(matched_skill_names[:3])}")
            else:
                skill_score = 30.0
                concerns.append("No direct match for required issue skills")
        else:
            skill_score = 50.0

        # 2. Technology Match Score (20%)
        relevant_techs = [t.strip().lower() for t in intelligence.relevant_technologies.split(",")] if intelligence and intelligence.relevant_technologies else []
        dev_techs = [t.tech_name.lower() for t in profile.technologies] if profile and profile.technologies else []

        if relevant_techs and dev_techs:
            tech_matches = sum(1 for req_t in relevant_techs if any(dev_t in req_t or req_t in dev_t for dev_t in dev_techs))
            tech_score = min(100.0, (tech_matches / len(relevant_techs)) * 100.0)
            if tech_matches > 0:
                positive_reasons.append("Experienced with target tech stack")
            else:
                concerns.append("Limited experience with target component technologies")
        else:
            tech_score = 60.0

        # 3. Experience Match Score (15%)
        dev_exp = profile.years_experience if profile else 1.0
        req_exp_level = intelligence.required_experience_level if intelligence else "Intermediate"

        target_min_years = 1.0
        if req_exp_level == "Senior":
            target_min_years = 4.0
        elif req_exp_level == "Lead":
            target_min_years = 6.0
        elif req_exp_level == "Intermediate":
            target_min_years = 2.0

        if dev_exp >= target_min_years:
            experience_score = 100.0
            positive_reasons.append(f"{dev_exp} years experience satisfies {req_exp_level} level requirement")
        else:
            experience_score = max(40.0, (dev_exp / target_min_years) * 100.0)
            concerns.append(f"Experience ({dev_exp} yrs) is below recommended {req_exp_level} level ({target_min_years} yrs)")

        # 4. Workload / Capacity Score (15%)
        active_assigned_count = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == developer.id,
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
        ).scalar() or 0

        max_cap = profile.max_capacity if profile else 5
        workload_ratio = active_assigned_count / max_cap

        if workload_ratio == 0:
            workload_score = 100.0
            positive_reasons.append("Zero active workload — fully available for assignment")
        elif workload_ratio <= 0.6:
            workload_score = 85.0
            positive_reasons.append(f"Optimal workload ({active_assigned_count}/{max_cap} active bugs)")
        elif workload_ratio < 1.0:
            workload_score = 50.0
            concerns.append(f"Currently handling {active_assigned_count} active issues")
        else:
            workload_score = 10.0
            concerns.append(f"At or above maximum capacity ({active_assigned_count}/{max_cap} active issues)")

        # 5. Past Similar Issue Experience Score (10%)
        past_resolved = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == developer.id,
            Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
        ).scalar() or 0

        if past_resolved >= 5:
            past_issue_score = 100.0
            positive_reasons.append(f"Resolved {past_resolved}+ similar software defects")
        elif past_resolved >= 1:
            past_issue_score = 70.0
            positive_reasons.append(f"Previously resolved {past_resolved} defects")
        else:
            past_issue_score = 30.0

        # 6. Availability Score (5%)
        avail = profile.availability_status if profile else "AVAILABLE"
        if avail == "AVAILABLE":
            availability_score = 100.0
        elif avail == "BUSY":
            availability_score = 40.0
            concerns.append("Developer status is currently set to BUSY")
        else: # ON_LEAVE
            availability_score = 0.0
            concerns.append("Developer is currently ON LEAVE")

        # Weighted Total Score Calculation
        overall_score = round(
            (skill_score * cls.WEIGHTS["skill"]) +
            (tech_score * cls.WEIGHTS["technology"]) +
            (experience_score * cls.WEIGHTS["experience"]) +
            (workload_score * cls.WEIGHTS["workload"]) +
            (past_issue_score * cls.WEIGHTS["past_similar"]) +
            (availability_score * cls.WEIGHTS["availability"])
        , 1)

        # Recommendation Level Category (Phase 4)
        if overall_score >= 90.0:
            rec_level = "Excellent Match"
        elif overall_score >= 75.0:
            rec_level = "Strong Match"
        elif overall_score >= 60.0:
            rec_level = "Moderate Match"
        else:
            rec_level = "Weak Match"

        if not positive_reasons:
            positive_reasons.append("Eligible developer in organization workspace")

        return {
            "candidate_id": developer.id,
            "candidate_name": developer.name,
            "candidate_email": developer.email,
            "overall_score": overall_score,
            "recommendation_level": rec_level,
            "component_scores": {
                "skill_score": round(skill_score, 1),
                "technology_score": round(tech_score, 1),
                "experience_score": round(experience_score, 1),
                "workload_score": round(workload_score, 1),
                "past_issue_score": round(past_issue_score, 1),
                "availability_score": round(availability_score, 1)
            },
            "positive_reasons": positive_reasons,
            "concerns": concerns,
            "active_workload": active_assigned_count,
            "resolved_count": past_resolved
        }

    @classmethod
    def rank_candidates_for_issue(
        cls,
        issue: Issue,
        intelligence: Optional[IssueIntelligence],
        db: Session,
        limit: int = 5,
        minimum_score: float = 0.0,
        include_unavailable: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Ranks all eligible candidate developers for an issue using deterministic weighted scoring.
        """
        candidates = db.query(User).filter(User.role.in_([UserRole.DEVELOPER, UserRole.ADMIN])).all()
        ranked = []

        for dev in candidates:
            profile = dev.developer_profile
            if not include_unavailable and profile and profile.availability_status == "ON_LEAVE":
                continue

            score_data = cls.calculate_candidate_score(issue, intelligence, dev, profile, db)
            if score_data["overall_score"] >= minimum_score:
                ranked.append(score_data)

        ranked.sort(key=lambda x: x["overall_score"], reverse=True)
        return ranked[:limit]
