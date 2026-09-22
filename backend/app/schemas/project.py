from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class SquadBasic(BaseModel):
    id: int
    name: str
    department_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    name: str
    project_key: Optional[str] = None
    description: Optional[str] = None
    workspace_id: Optional[int] = None
    department_id: Optional[int] = None
    project_type: Optional[str] = "Software Development"
    status: Optional[str] = "Active"
    priority: Optional[str] = "Medium"
    repository_url: Optional[str] = None
    environment: Optional[str] = "Production"
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    visibility: Optional[str] = "Public"


class ProjectCreate(ProjectBase):
    squad_ids: Optional[List[int]] = []
    member_ids: Optional[List[int]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    project_key: Optional[str] = None
    description: Optional[str] = None
    workspace_id: Optional[int] = None
    department_id: Optional[int] = None
    owner_id: Optional[int] = None
    project_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    repository_url: Optional[str] = None
    environment: Optional[str] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    visibility: Optional[str] = None
    squad_ids: Optional[List[int]] = None
    member_ids: Optional[List[int]] = None


class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    health: Optional[str] = "Healthy"
    health_reasons_json: Optional[str] = "[]"
    owner: Optional[UserResponse] = None
    workspace_name: Optional[str] = None
    department_name: Optional[str] = None
    squads: Optional[List[SquadBasic]] = []
    issue_count: Optional[int] = 0
    open_issues_count: Optional[int] = 0
    critical_issues_count: Optional[int] = 0
    calculated_progress: Optional[float] = 0.0
    active_sprint: Optional[Any] = None
    upcoming_release: Optional[Any] = None
    health_reasons: Optional[List[str]] = []
    ai_insight: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
