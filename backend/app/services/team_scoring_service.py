import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.user_intelligence import (
    UserProfile, Skill, UserSkill, UserDomain, UserProjectExperience
)
from app.models.issue_intelligence import IssueIntelligence


class TeamScoringService:
    # 8-Component Configurable Weights (Phase 3)
    WEIGHTS = {
        "skill": 0.30,
        "experience": 0.15,
        "project": 0.15,
        "domain": 0.10,
        "workload": 0.15,
        "availability": 0.05,
        "historical": 0.05,
        "severity": 0.05
    }

    @classmethod
    def calculate_workload_score(cls, active_issue_count: int) -> float:
        """
        Phase 5 Workload Thresholds:
        0-3 active issues = 100
        4-6 = 85
        7-9 = 65
        10-12 = 40
        13+ = 20
        """
        if active_issue_count <= 3:
            return 100.0
        elif active_issue_count <= 6:
            return 85.0
        elif active_issue_count <= 9:
            return 65.0
        elif active_issue_count <= 12:
            return 40.0
        else:
            return 20.0

    @classmethod
    def evaluate_candidate(
        cls,
        issue: Issue,
        intelligence: Optional[IssueIntelligence],
        developer: User,
        db: Session
    ) -> Dict[str, Any]:
        """
        Calculates 8 component scores, overall 0-100 score, explainable reasons, concerns, and confidence rating.
        """
        positive_reasons = []
        concerns = []

        # Get or auto-create UserProfile
        profile = db.query(UserProfile).filter(UserProfile.user_id == developer.id).first()
        if not profile:
            profile = UserProfile(
                user_id=developer.id,
                department="Engineering",
                years_experience=4.0 if developer.role == UserRole.DEVELOPER else 2.0,
                experience_level="Senior" if developer.role == UserRole.DEVELOPER else "Mid-level",
                availability_status="Available"
            )

        # 1. Skill Match (30%)
        req_skills = [s.strip().lower() for s in intelligence.required_skills.split(",")] if intelligence and intelligence.required_skills else ["python", "fastapi"]
        user_skills = db.query(UserSkill).filter(UserSkill.user_id == developer.id).all()
        dev_skills_dict = {us.skill.name.lower(): us.proficiency_level for us in user_skills if us.skill}

        if req_skills and dev_skills_dict:
            matched_count = 0
            prof_sum = 0
            for r_s in req_skills:
                for d_s, level in dev_skills_dict.items():
                    if r_s in d_s or d_s in r_s:
                        matched_count += 1
                        prof_sum += level
                        break
            if matched_count > 0:
                avg_prof = prof_sum / matched_count
                skill_score = min(100.0, (matched_count / len(req_skills)) * (avg_prof / 5.0) * 100.0)
                positive_reasons.append(f"Strong match for required skills ({matched_count}/{len(req_skills)} required skills)")
            else:
                skill_score = 40.0
                concerns.append("Limited direct match for issue skill requirements")
        else:
            skill_score = 70.0

        # 2. Experience Match (15%)
        years_exp = profile.years_experience or 3.5
        req_level = intelligence.required_experience_level if intelligence else "Mid-level"
        
        target_years = 2.0
        if req_level in ["Senior", "Expert"]:
            target_years = 5.0
        elif req_level == "Junior":
            target_years = 1.0

        if years_exp >= target_years:
            experience_score = 100.0
            positive_reasons.append(f"{years_exp} years experience satisfies {req_level} level requirement")
        else:
            experience_score = max(30.0, (years_exp / target_years) * 100.0)
            concerns.append(f"{years_exp} yrs experience is below target {target_years} yrs for {req_level} issues")

        # 3. Project Familiarity (15%)
        proj_exp = db.query(UserProjectExperience).filter(
            UserProjectExperience.user_id == developer.id,
            UserProjectExperience.project_id == issue.project_id
        ).first()

        if proj_exp:
            project_score = 100.0
            positive_reasons.append(f"Previously worked on this project codebase ({proj_exp.role})")
        else:
            # Check if developer has resolved any bugs in this project
            resolved_in_proj = db.query(func.count(Issue.id)).filter(
                Issue.assigned_to == developer.id,
                Issue.project_id == issue.project_id,
                Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
            ).scalar() or 0

            if resolved_in_proj > 0:
                project_score = 85.0
                positive_reasons.append(f"Resolved {resolved_in_proj} previous issues in this project")
            else:
                project_score = 50.0

        # 4. Domain Expertise (10%)
        issue_domain = (intelligence.domain if intelligence else "Authentication").lower()
        user_domains = db.query(UserDomain).filter(UserDomain.user_id == developer.id).all()
        dev_domains = [ud.domain.lower() for ud in user_domains]

        if any(issue_domain in ud or ud in issue_domain for ud in dev_domains):
            domain_score = 100.0
            positive_reasons.append(f"Specialized domain expertise in {intelligence.domain}")
        else:
            domain_score = 65.0

        # 5. Workload / Capacity (15%)
        active_issues = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == developer.id,
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
        ).scalar() or 0

        workload_score = cls.calculate_workload_score(active_issues)
        if active_issues <= 3:
            positive_reasons.append(f"Low active workload ({active_issues} active issues)")
        elif active_issues >= 7:
            concerns.append(f"Currently handling {active_issues} active issues")

        # 6. Availability (5%)
        avail = profile.availability_status or "Available"
        if avail == "Available":
            availability_score = 100.0
        elif avail == "Partially Available":
            availability_score = 70.0
            concerns.append("Developer status is set to Partially Available")
        elif avail == "Busy":
            availability_score = 40.0
            concerns.append("Developer status is set to Busy")
        else: # On Leave
            availability_score = 0.0
            concerns.append("Developer is currently On Leave")

        # 7. Historical Performance (5%)
        total_resolved = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == developer.id,
            Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
        ).scalar() or 0

        if total_resolved >= 5:
            historical_score = 100.0
            positive_reasons.append(f"Strong track record ({total_resolved}+ issues successfully resolved)")
        elif total_resolved >= 1:
            historical_score = 75.0
            positive_reasons.append(f"Proven history of {total_resolved} resolved defects")
        else:
            historical_score = 50.0
            positive_reasons.append("Insufficient historical resolution data")

        # 8. Severity & Complexity Fit (5%)
        critical_resolved = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == developer.id,
            Issue.severity == IssueSeverity.CRITICAL,
            Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
        ).scalar() or 0

        if issue.severity == IssueSeverity.CRITICAL:
            if critical_resolved >= 2:
                severity_fit_score = 100.0
                positive_reasons.append("Proven experience fixing Critical severity incidents")
            elif years_exp >= 4.0:
                severity_fit_score = 85.0
            else:
                severity_fit_score = 50.0
                concerns.append("Limited historical experience with Critical severity defects")
        else:
            severity_fit_score = 90.0

        # Calculate Final 100-Point Weighted Score
        overall_score = round(
            (skill_score * cls.WEIGHTS["skill"]) +
            (experience_score * cls.WEIGHTS["experience"]) +
            (project_score * cls.WEIGHTS["project"]) +
            (domain_score * cls.WEIGHTS["domain"]) +
            (workload_score * cls.WEIGHTS["workload"]) +
            (availability_score * cls.WEIGHTS["availability"]) +
            (historical_score * cls.WEIGHTS["historical"]) +
            (severity_fit_score * cls.WEIGHTS["severity"])
        , 1)

        # Confidence Rating (Phase 16)
        if len(user_skills) >= 3 and total_resolved >= 2:
            confidence = "High"
        elif len(user_skills) >= 1:
            confidence = "Medium"
        else:
            confidence = "Low"

        return {
            "user_id": developer.id,
            "name": developer.name,
            "email": developer.email,
            "role": developer.role.value,
            "overall_score": overall_score,
            "confidence": confidence,
            "scores": {
                "skill_score": round(skill_score, 1),
                "experience_score": round(experience_score, 1),
                "project_score": round(project_score, 1),
                "domain_score": round(domain_score, 1),
                "workload_score": round(workload_score, 1),
                "availability_score": round(availability_score, 1),
                "historical_score": round(historical_score, 1),
                "severity_fit_score": round(severity_fit_score, 1)
            },
            "reasons": positive_reasons,
            "concerns": concerns,
            "active_issues_count": active_issues,
            "total_resolved_count": total_resolved,
            "availability_status": avail
        }

    @classmethod
    def get_top_recommendations(
        cls,
        issue: Issue,
        intelligence: Optional[IssueIntelligence],
        db: Session,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Ranks all candidate developers and returns Top N (e.g. Top 3).
        """
        candidates = db.query(User).filter(User.role.in_([UserRole.DEVELOPER, UserRole.ADMIN])).all()
        evaluations = []

        for dev in candidates:
            eval_data = cls.evaluate_candidate(issue, intelligence, dev, db)
            evaluations.append(eval_data)

        evaluations.sort(key=lambda x: x["overall_score"], reverse=True)
        return evaluations[:limit]
