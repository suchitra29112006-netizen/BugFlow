from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.issue import IssueSeverity, IssuePriority, IssueStatus
from app.schemas.user import UserResponse
from app.schemas.project import ProjectResponse
from app.schemas.label import LabelResponse


class IssueBase(BaseModel):
    title: str
    description: str
    severity: IssueSeverity = IssueSeverity.MEDIUM
    status: IssueStatus = IssueStatus.REPORTED
    priority: IssuePriority = IssuePriority.MEDIUM
    project_id: int
    assigned_to: Optional[int] = None
    sprint_id: Optional[int] = None
    milestone_id: Optional[int] = None
    due_date: Optional[datetime] = None
    pr_url: Optional[str] = None
    verification_checklist: Optional[str] = None


class IssueCreate(IssueBase):
    label_ids: Optional[List[int]] = []


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IssueSeverity] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assigned_to: Optional[int] = None
    sprint_id: Optional[int] = None
    milestone_id: Optional[int] = None
    due_date: Optional[datetime] = None
    pr_url: Optional[str] = None
    verification_checklist: Optional[str] = None
    reopen_reason: Optional[str] = None
    label_ids: Optional[List[int]] = None


class BulkIssueUpdate(BaseModel):
    issue_ids: List[int]
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    sprint_id: Optional[int] = None
    assigned_to: Optional[int] = None


class IssueResponse(IssueBase):
    id: int
    status: IssueStatus
    reporter_id: int
    is_regression: bool = False
    reopen_count: int = 0
    est_resolution_hours: Optional[float] = None
    sentiment_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    reporter: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None
    project: Optional[ProjectResponse] = None
    labels: List[LabelResponse] = []
    is_overdue: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)
