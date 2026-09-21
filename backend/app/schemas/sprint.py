from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class SprintBase(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime


class SprintCreate(SprintBase):
    pass


class SprintResponse(SprintBase):
    id: int
    created_at: datetime
    issue_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
