from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.ai import (
    AIBugGenerateRequest,
    AIBugGenerateResponse,
    AIPredictSeverityRequest,
    AIPredictSeverityResponse,
    AIDuplicateCheckRequest,
    AIDuplicateCheckResponse
)
from app.services.ai_service import ai_service
from app.auth.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/ai", tags=["AI Features"])


@router.post("/generate-report", response_model=AIBugGenerateResponse)
def generate_bug_report(
    req: AIBugGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    if not req.user_prompt or not req.user_prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User prompt cannot be empty."
        )
    return ai_service.generate_bug_report(req.user_prompt, req.project_name)


@router.post("/predict-severity", response_model=AIPredictSeverityResponse)
def predict_severity(
    req: AIPredictSeverityRequest,
    current_user: User = Depends(get_current_user)
):
    return ai_service.predict_severity(req.title, req.description)


@router.post("/check-duplicates", response_model=AIDuplicateCheckResponse)
def check_duplicates(
    req: AIDuplicateCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ai_service.check_duplicates(req.title, req.description, req.project_id, db)


@router.post("/suggest-fix")
def suggest_code_fix(
    req: AIPredictSeverityRequest,
    current_user: User = Depends(get_current_user)
):
    return ai_service.suggest_code_fix(req.title, req.description)
