from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus
from app.models.issue_intelligence import IssueIntelligence
from app.models.assignment_feedback import AssignmentFeedback
from app.models.activity_log import ActivityLog
from app.models.user import User, UserRole
from app.services.ai_service import ai_service
from app.services.scoring_service import AssignmentScoringService
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["AI Developer Assignment Engine"])


class FeedbackInput(BaseModel):
    is_good_recommendation: bool
    reason_category: Optional[str] = None
    comments: Optional[str] = None


class AssignInput(BaseModel):
    assigned_user_id: int
    override_reason: Optional[str] = None


@router.get("/issues/{issue_id}/assignment-recommendations")
def get_assignment_recommendations(
    issue_id: int,
    limit: int = Query(5, ge=1, le=10),
    minimum_score: float = Query(0.0, ge=0.0, le=100.0),
    include_unavailable: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 5: Returns ranked explainable candidate developer recommendations for an issue.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    # Phase 2: Get or Extract Issue Intelligence Requirements
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

    # Phase 3 & 4: Calculate Ranked Explainable Candidates
    ranked_candidates = AssignmentScoringService.rank_candidates_for_issue(
        issue=issue,
        intelligence=intelligence,
        db=db,
        limit=limit,
        minimum_score=minimum_score,
        include_unavailable=include_unavailable
    )

    if not ranked_candidates:
        return {
            "issue_id": issue_id,
            "status": "INSUFFICIENT_DATA",
            "message": "Insufficient information for a reliable recommendation.",
            "intelligence": {
                "category": intelligence.category,
                "complexity": intelligence.complexity,
                "domain": intelligence.domain,
                "required_skills": intelligence.required_skills.split(", "),
                "relevant_technologies": intelligence.relevant_technologies.split(", ")
            },
            "recommendations": []
        }

    return {
        "issue_id": issue_id,
        "status": "SUCCESS",
        "intelligence": {
            "category": intelligence.category,
            "complexity": intelligence.complexity,
            "domain": intelligence.domain,
            "required_skills": intelligence.required_skills.split(", "),
            "relevant_technologies": intelligence.relevant_technologies.split(", ")
        },
        "recommendations": ranked_candidates
    }


@router.post("/issues/{issue_id}/assign-developer")
def assign_developer_with_audit(
    issue_id: int,
    assign_in: AssignInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 8 & 9: Human-confirmed assignment with audit logging and override tracking.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    target_user = db.query(User).filter(User.id == assign_in.assigned_user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found.")

    old_assignee = issue.assignee.name if issue.assignee else "Unassigned"
    issue.assigned_to = target_user.id
    if issue.status == IssueStatus.REPORTED:
        issue.status = IssueStatus.ASSIGNED

    # Audit Trail Entry (Phase 9)
    field_text = "AI Recommended Assignment" if not assign_in.override_reason else "Manual Override Assignment"
    log = ActivityLog(
        issue_id=issue.id,
        user_id=current_user.id,
        field_changed=field_text,
        old_value=old_assignee,
        new_value=f"Assigned to {target_user.name}" + (f" (Override: {assign_in.override_reason})" if assign_in.override_reason else "")
    )
    db.add(log)
    db.commit()

    return {"message": f"Successfully assigned Issue #{issue.id} to {target_user.name}."}


@router.post("/issues/{issue_id}/assignment-feedback")
def submit_assignment_feedback(
    issue_id: int,
    fb_in: FeedbackInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 10: Record user feedback on assignment recommendation quality.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    fb = AssignmentFeedback(
        issue_id=issue.id,
        assigned_user_id=issue.assigned_to or current_user.id,
        evaluator_id=current_user.id,
        is_good_recommendation=fb_in.is_good_recommendation,
        reason_category=fb_in.reason_category,
        comments=fb_in.comments
    )
    db.add(fb)
    db.commit()

    return {"message": "Thank you! Assignment feedback recorded successfully."}


@router.get("/assignment/analytics")
def get_assignment_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 10: Returns recommendation acceptance, override, and feedback metrics.
    """
    total_fb = db.query(func.count(AssignmentFeedback.id)).scalar() or 0
    good_fb = db.query(func.count(AssignmentFeedback.id)).filter(AssignmentFeedback.is_good_recommendation == True).scalar() or 0
    poor_fb = db.query(func.count(AssignmentFeedback.id)).filter(AssignmentFeedback.is_good_recommendation == False).scalar() or 0

    reasons = db.query(AssignmentFeedback.reason_category, func.count(AssignmentFeedback.id)).group_by(AssignmentFeedback.reason_category).all()

    return {
        "total_feedback": total_fb,
        "positive_feedback_count": good_fb,
        "negative_feedback_count": poor_fb,
        "acceptance_rate_percentage": round((good_fb / total_fb) * 100, 1) if total_fb > 0 else 100.0,
        "failure_reasons_breakdown": {r: c for r, c in reasons if r}
    }
