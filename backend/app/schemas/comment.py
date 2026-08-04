from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    comment: str


from pydantic import ConfigDict

class CommentResponse(BaseModel):
    id: int
    issue_id: int
    user_id: int
    comment: str
    created_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

