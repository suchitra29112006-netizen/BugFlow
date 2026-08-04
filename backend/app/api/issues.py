from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus, IssueSeverity, IssuePriority, ALLOWED_TRANSITIONS
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.issue import IssueCreate, IssueResponse, IssueUpdate
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/issues", tags=["Issues"])


@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    issue_in: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == issue_in.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {issue_in.project_id} does not exist."
        )
    
    if issue_in.assigned_to:
        assignee = db.query(User).filter(User.id == issue_in.assigned_to).first()
        if not assignee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")

    initial_status = IssueStatus.ASSIGNED if issue_in.assigned_to else IssueStatus.REPORTED

    issue = Issue(
        title=issue_in.title,
        description=issue_in.description,
        severity=issue_in.severity,
        priority=issue_in.priority,
        status=initial_status,
        project_id=issue_in.project_id,
        reporter_id=current_user.id,
        assigned_to=issue_in.assigned_to
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.get("", response_model=List[IssueResponse])
def list_issues(
    search: Optional[str] = None,
    status: Optional[IssueStatus] = None,
    severity: Optional[IssueSeverity] = None,
    project_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Issue)
    
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    if status:
        query = query.filter(Issue.status == status)
    if severity:
        query = query.filter(Issue.severity == severity)
    if assigned_to:
        query = query.filter(Issue.assigned_to == assigned_to)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Issue.title.ilike(search_pattern),
                Issue.description.ilike(search_pattern)
            )
        )
    
    return query.order_by(Issue.created_at.desc()).all()


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

    # Validate status transition workflow
    if issue_in.status and issue_in.status != issue.status:
        current_status = issue.status
        target_status = issue_in.status
        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        
        if target_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid state transition from '{current_status.value}' to '{target_status.value}'. Allowed next states: {[s.value for s in allowed]}"
            )
        issue.status = target_status

    if issue_in.title is not None:
        issue.title = issue_in.title
    if issue_in.description is not None:
        issue.description = issue_in.description
    if issue_in.severity is not None:
        issue.severity = issue_in.severity
    if issue_in.priority is not None:
        issue.priority = issue_in.priority
    if issue_in.assigned_to is not None:
        if issue_in.assigned_to > 0:
            assignee = db.query(User).filter(User.id == issue_in.assigned_to).first()
            if not assignee:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")
            issue.assigned_to = issue_in.assigned_to
        else:
            issue.assigned_to = None

    issue.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(issue)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    # Check permission: Admin, Reporter of issue, or Project owner
    if current_user.role != UserRole.ADMIN and current_user.id != issue.reporter_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this issue."
        )

    db.delete(issue)
    db.commit()
    return None
