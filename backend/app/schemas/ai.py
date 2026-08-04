from typing import Optional, List, Any
from pydantic import BaseModel
from app.models.issue import IssueSeverity, IssuePriority


class AIBugGenerateRequest(BaseModel):
    user_prompt: str
    project_name: Optional[str] = None


class AIBugGenerateResponse(BaseModel):
    title: str
    description: str
    expected_behavior: str
    actual_behavior: str
    steps_to_reproduce: str
    environment: str
    suggested_severity: IssueSeverity
    suggested_priority: IssuePriority
    raw_ai_text: str


class AIPredictSeverityRequest(BaseModel):
    title: str
    description: str


class AIPredictSeverityResponse(BaseModel):
    severity: IssueSeverity
    confidence: float
    reasoning: str


class AIDuplicateCheckRequest(BaseModel):
    title: str
    description: str
    project_id: Optional[int] = None


class AIDuplicateCheckResponse(BaseModel):
    has_duplicate: bool
    duplicates: List[Any]
