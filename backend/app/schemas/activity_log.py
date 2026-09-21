from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class ActivityLogResponse(BaseModel):
    id: int
    issue_id: int
    user_id: int
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
