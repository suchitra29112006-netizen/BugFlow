from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, case
from pydantic import BaseModel, Field

from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus, IssueSeverity, IssuePriority
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.label import Label
from app.models.comment import Comment
from app.models.activity_log import ActivityLog
from app.models.sprint import SprintIssue
from app.models.time_entry import TimeEntry, ActiveTimer
from app.models.sla import SLAEvent
from app.models.assignment_feedback import AssignmentFeedback
from app.models.milestone4_models import (
    DefectFingerprint,
    DefectRelationship,
    InvestigationWorkspace,
    VerificationPlan
)
from app.auth.deps import get_current_user
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.services.ai_resolution_service import ai_resolution_service

router = APIRouter(prefix="/api/issues", tags=["Issues Management"])

ALLOWED_TRANSITIONS = {
    IssueStatus.REPORTED: [IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.CLOSED],
    IssueStatus.OPEN: [IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.CLOSED],
    IssueStatus.ASSIGNED: [IssueStatus.IN_PROGRESS, IssueStatus.OPEN, IssueStatus.IN_REVIEW],
    IssueStatus.IN_PROGRESS: [IssueStatus.IN_REVIEW, IssueStatus.OPEN, IssueStatus.ASSIGNED],
    IssueStatus.IN_REVIEW: [IssueStatus.RESOLVED, IssueStatus.IN_PROGRESS],
    IssueStatus.RESOLVED: [IssueStatus.CLOSED, IssueStatus.IN_PROGRESS, IssueStatus.OPEN],
    IssueStatus.CLOSED: [IssueStatus.OPEN],
}


class BulkStatusUpdateSchema(BaseModel):
    issue_ids: List[int]
    status: IssueStatus
    assigned_to: Optional[int] = None


class DefectVerificationItem(BaseModel):
    id: str
    status: str


class DefectVerifyBatchSchema(BaseModel):
    release: str
    defects: List[DefectVerificationItem]


@router.get("", response_model=List[IssueResponse])
def get_issues(
    search: Optional[str] = Query(None),
    status_filter: Optional[IssueStatus] = Query(None, alias="status"),
    severity_filter: Optional[IssueSeverity] = Query(None, alias="severity"),
    project_id: Optional[int] = Query(None),
    sprint_id: Optional[int] = Query(None),
    assigned_to: Optional[int] = Query(None),
    reporter_id: Optional[int] = Query(None),
    label_id: Optional[int] = Query(None),
    is_overdue_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Issue)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(Issue.title.ilike(search_pattern), Issue.description.ilike(search_pattern))
        )
    if status_filter:
        query = query.filter(Issue.status == status_filter)
    if severity_filter:
        query = query.filter(Issue.severity == severity_filter)
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    if sprint_id:
        query = query.filter(Issue.sprint_id == sprint_id)
    if assigned_to:
        query = query.filter(Issue.assigned_to == assigned_to)
    if reporter_id:
        query = query.filter(Issue.reporter_id == reporter_id)
    if label_id:
        query = query.filter(Issue.labels.any(id=label_id))

    return query.order_by(Issue.created_at.desc()).all()


# Phase 2: Smart Triage Queue Endpoint
@router.get("/smart-triage")
def get_smart_triage_queue(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 2: Smart Triage Queue calculated from 0-100 Impact Score.
    """
    query = db.query(Issue).filter(
        Issue.status.in_([IssueStatus.REPORTED, IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS])
    )
    if project_id:
        query = query.filter(Issue.project_id == project_id)

    issues = query.all()
    results = []
    for iss in issues:
        triage = ai_resolution_service.calculate_smart_triage_score(iss, db)
        results.append({
            "issue": IssueResponse.model_validate(iss),
            "impact_score": triage["impact_score"],
            "risk_level": triage["risk_level"],
            "rank_reasons": triage["rank_reasons"],
            "why_explanation": triage["why_explanation"]
        })

    results.sort(key=lambda x: x["impact_score"], reverse=True)
    return {"total": len(results), "triage_queue": results}


@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    issue_in: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == issue_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    new_issue = Issue(
        title=issue_in.title,
        description=issue_in.description,
        severity=getattr(issue_in, 'severity', IssueSeverity.MEDIUM),
        priority=getattr(issue_in, 'priority', IssuePriority.MEDIUM),
        status=getattr(issue_in, 'status', IssueStatus.REPORTED),
        project_id=issue_in.project_id,
        sprint_id=getattr(issue_in, 'sprint_id', None),
        milestone_id=getattr(issue_in, 'milestone_id', None),
        assigned_to=getattr(issue_in, 'assigned_to', None),
        reporter_id=current_user.id,
        due_date=getattr(issue_in, 'due_date', None),
        pr_url=getattr(issue_in, 'pr_url', None),
        est_resolution_hours=getattr(issue_in, 'est_resolution_hours', 4.5)
    )

    if hasattr(issue_in, 'label_ids') and issue_in.label_ids:
        labels = db.query(Label).filter(Label.id.in_(issue_in.label_ids)).all()
        new_issue.labels = labels

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    # Log initial creation activity
    activity = ActivityLog(
        issue_id=new_issue.id,
        user_id=current_user.id,
        field_changed="issue_created",
        old_value=None,
        new_value=new_issue.title
    )
    db.add(activity)
    db.commit()

    return new_issue


@router.put("/{issue_id}", response_model=IssueResponse)
def update_issue(
    issue_id: int,
    issue_in: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    update_data = issue_in.model_dump(exclude_unset=True)
    
    # Validate status transitions
    if "status" in update_data and update_data["status"] != issue.status:
        target_status = update_data["status"]
        allowed = ALLOWED_TRANSITIONS.get(issue.status, [])
        if target_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid state transition from '{issue.status.value if hasattr(issue.status, 'value') else issue.status}' to '{target_status.value if hasattr(target_status, 'value') else target_status}'."
            )

    if "reopen_reason" in update_data and update_data["reopen_reason"]:
        issue.reopen_count = (issue.reopen_count or 0) + 1
        issue.is_regression = True
        comment = Comment(
            issue_id=issue.id,
            user_id=current_user.id,
            comment=f"🔁 Defect REOPENED by QA. Reason: {update_data['reopen_reason']}",
            is_ai_generated=False
        )
        db.add(comment)

    label_ids = update_data.pop("label_ids", None)
    if label_ids is not None:
        labels = db.query(Label).filter(Label.id.in_(label_ids)).all()
        issue.labels = labels

    for key, value in update_data.items():
        if hasattr(issue, key):
            setattr(issue, key, value)

    issue.updated_at = datetime.utcnow()
    
    # Log update activity
    activity = ActivityLog(
        issue_id=issue.id,
        user_id=current_user.id,
        field_changed="Status",
        old_value=None,
        new_value=str(issue.status.value if hasattr(issue.status, 'value') else issue.status)
    )
    db.add(activity)
    db.commit()
    db.refresh(issue)
    return issue


@router.post("/bulk-update")
def bulk_update_issues(
    bulk_in: BulkStatusUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(Issue).filter(Issue.id.in_(bulk_in.issue_ids)).all()
    updated_count = 0

    for iss in issues:
        iss.status = bulk_in.status
        if bulk_in.assigned_to is not None:
            iss.assigned_to = bulk_in.assigned_to
        iss.updated_at = datetime.utcnow()
        updated_count += 1

    db.commit()
    return {"message": f"Successfully updated {updated_count} issues", "updated_count": updated_count}


# P1-10: CI/CD Batch Defect Test Verification Endpoint
@router.post("/defects/verify-batch")
def verify_defects_batch(
    batch_in: DefectVerifyBatchSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []
    for item in batch_in.defects:
        raw_id = item.id.upper().replace("DEF-", "").replace("#", "").strip()
        if not raw_id.isdigit():
            continue
        iss_id = int(raw_id)
        issue = db.query(Issue).filter(Issue.id == iss_id).first()
        if not issue:
            results.append({"id": item.id, "status": "not_found"})
            continue

        if item.status.lower() == "passed":
            issue.status = IssueStatus.CLOSED
            comment = Comment(
                issue_id=issue.id,
                user_id=current_user.id,
                comment=f"🤖 CI Automated Verification PASSED for release {batch_in.release}. Defect status updated to CLOSED.",
                is_ai_generated=True
            )
            db.add(comment)
            results.append({"id": item.id, "new_status": "Closed", "result": "passed"})
        else:
            issue.status = IssueStatus.OPEN
            issue.reopen_count = (issue.reopen_count or 0) + 1
            issue.is_regression = True
            comment = Comment(
                issue_id=issue.id,
                user_id=current_user.id,
                comment=f"🚨 CI Automated Verification FAILED for release {batch_in.release}. Defect REOPENED as regression.",
                is_ai_generated=True
            )
            db.add(comment)
            results.append({"id": item.id, "new_status": "Open", "result": "failed"})

    db.commit()
    return {"release": batch_in.release, "processed_count": len(results), "details": results}


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    if current_user.role != UserRole.ADMIN and current_user.id != issue.reporter_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this issue."
        )

    # Delete child dependencies
    db.query(DefectFingerprint).filter(DefectFingerprint.issue_id == issue_id).delete(synchronize_session=False)
    db.query(InvestigationWorkspace).filter(InvestigationWorkspace.issue_id == issue_id).delete(synchronize_session=False)
    db.query(VerificationPlan).filter(VerificationPlan.issue_id == issue_id).delete(synchronize_session=False)
    db.query(DefectRelationship).filter(
        (DefectRelationship.source_issue_id == issue_id) | (DefectRelationship.target_issue_id == issue_id)
    ).delete(synchronize_session=False)
    db.query(SprintIssue).filter(SprintIssue.issue_id == issue_id).delete(synchronize_session=False)
    db.query(TimeEntry).filter(TimeEntry.issue_id == issue_id).delete(synchronize_session=False)
    db.query(ActiveTimer).filter(ActiveTimer.issue_id == issue_id).delete(synchronize_session=False)
    db.query(SLAEvent).filter(SLAEvent.issue_id == issue_id).delete(synchronize_session=False)
    db.query(AssignmentFeedback).filter(AssignmentFeedback.issue_id == issue_id).delete(synchronize_session=False)

    db.delete(issue)
    db.commit()
    return None

