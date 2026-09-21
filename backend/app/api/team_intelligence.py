import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.user import User, UserRole
from app.models.user_intelligence import (
    UserProfile, Skill, UserSkill, UserDomain, UserProjectExperience,
    AssignmentRecommendation, AssignmentHistory
)
from app.models.developer_profile import DeveloperProfile, DeveloperSkill, DeveloperTechnology
from app.models.issue_intelligence import IssueIntelligence
from app.models.activity_log import ActivityLog
from app.services.ai_service import ai_service
from app.services.team_scoring_service import TeamScoringService
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["Team Intelligence & AI Assignment"])


class ProfileUpdateSchema(BaseModel):
    department: Optional[str] = None
    highest_qualification: Optional[str] = None
    specialization: Optional[str] = None
    primary_specialization: Optional[str] = None
    qualification: Optional[str] = None
    graduation_year: Optional[int] = None
    years_experience: Optional[float] = None
    experience_level: Optional[str] = None
    availability_status: Optional[str] = None
    max_capacity: Optional[int] = None


class SkillCreateSchema(BaseModel):
    name: str
    category: str = "Backend"


class UserSkillCreateSchema(BaseModel):
    skill_id: int
    proficiency_level: int = 3 # 1-5
    years_experience: float = 1.0
    certification: Optional[str] = None


class AssignBodySchema(BaseModel):
    user_id: int
    source: str = "ai_recommendation" # ai_recommendation, manual_assignment, auto_assignment
    recommendation_score: Optional[float] = None
    override_reason: Optional[str] = None


# Static route MUST come before dynamic /users/{user_id}/profile route
@router.get("/users/workload")
def get_team_workload_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Phase 12: Returns smart team workload overview for all developers & QA members.
    """
    users = db.query(User).filter(User.role.in_([UserRole.DEVELOPER, UserRole.ADMIN, UserRole.QA])).all()
    workloads = []

    for u in users:
        active_issues = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == u.id,
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
        ).scalar() or 0

        critical_issues = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == u.id,
            Issue.severity == IssueSeverity.CRITICAL,
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
        ).scalar() or 0

        high_issues = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == u.id,
            Issue.severity == IssueSeverity.HIGH,
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
        ).scalar() or 0

        in_progress_issues = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == u.id,
            Issue.status == IssueStatus.IN_PROGRESS
        ).scalar() or 0

        profile = db.query(UserProfile).filter(UserProfile.user_id == u.id).first()
        avail = profile.availability_status if profile else "Available"
        cap_pct = TeamScoringService.calculate_workload_score(active_issues)

        if cap_pct >= 80.0:
            status_indicator = "GREEN" # 🟢
        elif cap_pct >= 40.0:
            status_indicator = "YELLOW" # 🟡
        else:
            status_indicator = "RED" # 🔴

        workloads.append({
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "active_issues": active_issues,
            "critical_issues": critical_issues,
            "high_issues": high_issues,
            "in_progress_issues": in_progress_issues,
            "capacity_percentage": cap_pct,
            "status_indicator": status_indicator,
            "availability_status": avail
        })

    return workloads


@router.get("/users/{user_id}/profile")
def get_user_professional_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 17: Retrieve complete professional profile, skills, domains, workload, and performance stats.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            department="Engineering",
            years_experience=3.5 if target_user.role == UserRole.DEVELOPER else 1.5,
            experience_level="Senior" if target_user.role == UserRole.DEVELOPER else "Mid-level",
            availability_status="Available"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    user_domains = db.query(UserDomain).filter(UserDomain.user_id == user_id).all()
    user_proj_exp = db.query(UserProjectExperience).filter(UserProjectExperience.user_id == user_id).all()

    # Calculate Workload & Performance
    active_issues = db.query(func.count(Issue.id)).filter(
        Issue.assigned_to == user_id,
        Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
    ).scalar() or 0

    resolved_issues = db.query(func.count(Issue.id)).filter(
        Issue.assigned_to == user_id,
        Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
    ).scalar() or 0

    critical_issues = db.query(func.count(Issue.id)).filter(
        Issue.assigned_to == user_id,
        Issue.severity == IssueSeverity.CRITICAL,
        Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
    ).scalar() or 0

    reopened_issues = db.query(func.count(Issue.id)).filter(
        Issue.assigned_to == user_id,
        Issue.reopen_count > 0
    ).scalar() or 0

    capacity_pct = round(TeamScoringService.calculate_workload_score(active_issues), 1)

    formatted_skills = [
        {
            "id": us.id,
            "skill_id": us.skill_id,
            "skill_name": us.skill.name if us.skill else "Skill",
            "name": us.skill.name if us.skill else "Skill",
            "category": us.skill.category if us.skill else "General",
            "proficiency_level": us.proficiency_level,
            "years_experience": us.years_experience,
            "certification": us.certification
        }
        for us in user_skills
    ]

    return {
        "user_id": target_user.id,
        "name": target_user.name,
        "email": target_user.email,
        "role": target_user.role.value,
        "years_experience": profile.years_experience,
        "primary_specialization": profile.specialization,
        "qualification": profile.highest_qualification,
        "availability_status": profile.availability_status,
        "max_capacity": 5,
        "profile": {
            "department": profile.department,
            "highest_qualification": profile.highest_qualification,
            "specialization": profile.specialization,
            "graduation_year": profile.graduation_year,
            "years_experience": profile.years_experience,
            "experience_level": profile.experience_level,
            "availability_status": profile.availability_status
        },
        "skills": formatted_skills,
        "technologies": ["FastAPI", "Python", "React", "PostgreSQL"],
        "certifications": ["AWS Developer"],
        "domains": [{"id": ud.id, "domain": ud.domain, "experience_level": ud.experience_level} for ud in user_domains],
        "project_experience": [{"project_id": pe.project_id, "project_name": pe.project.name if pe.project else "Project", "role": pe.role} for pe in user_proj_exp],
        "metrics": {
            "active_issues": active_issues,
            "resolved_issues": resolved_issues,
            "critical_issues": critical_issues,
            "reopened_issues": reopened_issues,
            "capacity_percentage": capacity_pct,
            "avg_resolution_days": 2.4
        }
    }


@router.put("/users/{user_id}/profile")
def update_user_profile(
    user_id: int,
    p_in: ProfileUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    spec = p_in.specialization or p_in.primary_specialization
    qual = p_in.highest_qualification or p_in.qualification

    if p_in.department is not None: profile.department = p_in.department
    if qual is not None: profile.highest_qualification = qual
    if spec is not None: profile.specialization = spec
    if p_in.graduation_year is not None: profile.graduation_year = p_in.graduation_year
    if p_in.years_experience is not None: profile.years_experience = p_in.years_experience
    if p_in.experience_level is not None: profile.experience_level = p_in.experience_level
    if p_in.availability_status is not None: profile.availability_status = p_in.availability_status

    db.commit()
    return get_user_professional_profile(user_id, db, current_user)


@router.get("/skills")
def list_skills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skills = db.query(Skill).all()
    if not skills:
        default_skills = [
            Skill(name="Python", category="Backend"),
            Skill(name="FastAPI", category="Backend"),
            Skill(name="JavaScript", category="Frontend"),
            Skill(name="React", category="Frontend"),
            Skill(name="PostgreSQL", category="Database"),
            Skill(name="REST API", category="Backend"),
            Skill(name="Docker", category="DevOps"),
            Skill(name="AWS", category="DevOps"),
            Skill(name="Security", category="Security"),
            Skill(name="Testing", category="Testing")
        ]
        db.add_all(default_skills)
        db.commit()
        skills = db.query(Skill).all()
    return skills


@router.post("/skills")
def create_skill(s_in: SkillCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Skill).filter(Skill.name.ilike(s_in.name.strip())).first()
    if existing:
        return existing
    skill = Skill(name=s_in.name.strip(), category=s_in.category)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.post("/users/{user_id}/skills")
def add_skill_to_user(user_id: int, us_in: UserSkillCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(UserSkill).filter(UserSkill.user_id == user_id, UserSkill.skill_id == us_in.skill_id).first()
    if existing:
        existing.proficiency_level = us_in.proficiency_level
        existing.years_experience = us_in.years_experience
        if us_in.certification: existing.certification = us_in.certification
        db.commit()
        return existing

    us = UserSkill(
        user_id=user_id,
        skill_id=us_in.skill_id,
        proficiency_level=us_in.proficiency_level,
        years_experience=us_in.years_experience,
        certification=us_in.certification
    )
    db.add(us)
    db.commit()
    db.refresh(us)
    return us


@router.delete("/users/{user_id}/skills/{skill_id}")
def remove_skill_from_user(user_id: int, skill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(UserSkill).filter(UserSkill.user_id == user_id, UserSkill.skill_id == skill_id).delete()
    db.commit()
    return {"message": "Skill removed successfully."}


@router.post("/issues/{issue_id}/assignment/analyze")
def analyze_issue_and_get_top3_recommendations(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    intelligence = db.query(IssueIntelligence).filter(IssueIntelligence.issue_id == issue_id).first()
    if not intelligence:
        extracted = ai_service.extract_issue_intelligence(issue.title, issue.description)
        intelligence = IssueIntelligence(
            issue_id=issue_id,
            required_skills=extracted["required_skills"],
            relevant_technologies=extracted["relevant_technologies"],
            category=extracted["category"],
            complexity=extracted["complexity"],
            domain=extracted["domain"],
            estimated_effort_hours=extracted["estimated_effort_hours"],
            required_experience_level=extracted["required_experience_level"]
        )
        db.add(intelligence)
        db.commit()
        db.refresh(intelligence)

    top3 = TeamScoringService.get_top_recommendations(issue, intelligence, db, limit=3)

    for rec in top3:
        db.add(AssignmentRecommendation(
            issue_id=issue_id,
            recommended_user_id=rec["user_id"],
            score=rec["overall_score"],
            skill_score=rec["scores"]["skill_score"],
            experience_score=rec["scores"]["experience_score"],
            project_score=rec["scores"]["project_score"],
            domain_score=rec["scores"]["domain_score"],
            workload_score=rec["scores"]["workload_score"],
            availability_score=rec["scores"]["availability_score"],
            historical_score=rec["scores"]["historical_score"],
            severity_fit_score=rec["scores"]["severity_fit_score"],
            reasoning=json.dumps({"reasons": rec["reasons"], "concerns": rec["concerns"]}),
            confidence=rec["confidence"]
        ))
    db.commit()

    return {
        "issue_id": issue_id,
        "issue_title": issue.title,
        "domain": intelligence.domain,
        "category": intelligence.category,
        "complexity": intelligence.complexity,
        "required_skills": [s.strip() for s in intelligence.required_skills.split(",")],
        "relevant_technologies": [t.strip() for t in intelligence.relevant_technologies.split(",")],
        "recommendations": top3
    }


@router.post("/issues/{issue_id}/assign")
def assign_issue(
    issue_id: int,
    assign_in: AssignBodySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    target_user = db.query(User).filter(User.id == assign_in.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

    old_assignee = issue.assignee.name if issue.assignee else "Unassigned"
    issue.assigned_to = target_user.id
    if issue.status == IssueStatus.REPORTED:
        issue.status = IssueStatus.ASSIGNED

    history_entry = AssignmentHistory(
        issue_id=issue.id,
        assigned_user_id=target_user.id,
        recommended_user_id=target_user.id if assign_in.source == "ai_recommendation" else None,
        recommendation_score=assign_in.recommendation_score,
        assignment_source=assign_in.source,
        assigned_by=current_user.id
    )
    db.add(history_entry)

    source_label = "AI Recommendation" if assign_in.source == "ai_recommendation" else "Manual Selection"
    log = ActivityLog(
        issue_id=issue.id,
        user_id=current_user.id,
        field_changed=f"Assignment ({source_label})",
        old_value=old_assignee,
        new_value=f"Assigned to {target_user.name}"
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Successfully assigned Issue #{issue.id} to {target_user.name}.",
        "issue_id": issue.id,
        "assigned_to": target_user.name,
        "source": assign_in.source
    }


@router.get("/issues/{issue_id}/assignment-history")
def get_issue_assignment_history(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(AssignmentHistory).filter(AssignmentHistory.issue_id == issue_id).order_by(AssignmentHistory.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "assigned_user_name": r.assigned_user.name if r.assigned_user else "Unknown",
            "assignment_source": r.assignment_source,
            "recommendation_score": r.recommendation_score,
            "assigned_by_name": r.assigner.name if r.assigner else "System",
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]


@router.get("/team/assignment-insights")
def get_team_assignment_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_assignments = db.query(func.count(AssignmentHistory.id)).scalar() or 0
    ai_assignments = db.query(func.count(AssignmentHistory.id)).filter(AssignmentHistory.assignment_source == "ai_recommendation").scalar() or 0
    manual_assignments = db.query(func.count(AssignmentHistory.id)).filter(AssignmentHistory.assignment_source == "manual_assignment").scalar() or 0

    return {
        "total_assignments": total_assignments,
        "ai_recommended_count": ai_assignments,
        "manual_selection_count": manual_assignments,
        "ai_acceptance_rate_pct": round((ai_assignments / total_assignments * 100), 1) if total_assignments > 0 else 100.0
    }
