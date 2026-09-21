from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    comment: str
    is_ai_generated: Optional[bool] = False


class CommentResponse(BaseModel):
    id: int
    issue_id: int
    user_id: int
    comment: str
    is_ai_generated: bool = False
    created_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
