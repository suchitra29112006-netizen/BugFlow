from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.issue import IssueSeverity, IssuePriority, IssueStatus
from app.schemas.user import UserResponse
from app.schemas.project import ProjectResponse


class IssueBase(BaseModel):
    title: str
    description: str
    severity: IssueSeverity = IssueSeverity.MEDIUM
    priority: IssuePriority = IssuePriority.MEDIUM
    project_id: int
    assigned_to: Optional[int] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IssueSeverity] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assigned_to: Optional[int] = None


from pydantic import ConfigDict

class IssueResponse(IssueBase):
    id: int
    status: IssueStatus
    reporter_id: int
    created_at: datetime
    updated_at: datetime
    reporter: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None
    project: Optional[ProjectResponse] = None

    model_config = ConfigDict(from_attributes=True)

