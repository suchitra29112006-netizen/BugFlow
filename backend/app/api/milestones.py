from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.milestone import Milestone
from app.models.issue import Issue, IssueStatus
from app.models.user import User
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/milestones", tags=["Milestones"])


class MilestoneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: int
    due_date: Optional[datetime] = None


class MilestoneResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    project_id: int
    due_date: Optional[datetime] = None
    created_at: datetime
    total_issues: int = 0
    completed_issues: int = 0
    progress_percentage: int = 0


@router.get("", response_model=List[MilestoneResponse])
def get_milestones(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Milestone)
    if project_id:
        query = query.filter(Milestone.project_id == project_id)
    
    milestones = query.order_by(Milestone.created_at.desc()).all()
    res = []

    for m in milestones:
        issues = db.query(Issue).filter(Issue.milestone_id == m.id).all()
        total = len(issues)
        completed = sum(1 for i in issues if i.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED])
        pct = round((completed / total) * 100) if total > 0 else 0

        res.append(MilestoneResponse(
            id=m.id,
            name=m.name,
            description=m.description,
            status=m.status,
            project_id=m.project_id,
            due_date=m.due_date,
            created_at=m.created_at,
            total_issues=total,
            completed_issues=completed,
            progress_percentage=pct
        ))

    return res


@router.post("", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    m_in: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = Milestone(
        name=m_in.name,
        description=m_in.description,
        project_id=m_in.project_id,
        due_date=m_in.due_date
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    return MilestoneResponse(
        id=milestone.id,
        name=milestone.name,
        description=milestone.description,
        status=milestone.status,
        project_id=milestone.project_id,
        due_date=milestone.due_date,
        created_at=milestone.created_at,
        total_issues=0,
        completed_issues=0,
        progress_percentage=0
    )
