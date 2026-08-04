from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


from pydantic import ConfigDict

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    owner: Optional[UserResponse] = None
    issue_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

