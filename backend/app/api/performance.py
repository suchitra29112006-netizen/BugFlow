from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User, UserRole
from app.auth.deps import get_current_user
from app.services.performance_service import query_performance_advisor

router = APIRouter(prefix="/api/performance", tags=["Query Performance Advisor"])


@router.get("/report")
def get_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 43 & 44: Query Performance Advisor & Database Optimization Report.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required for Performance Advisor.")
    return query_performance_advisor.generate_performance_report(db)


@router.get("/queries")
def get_captured_queries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rep = query_performance_advisor.generate_performance_report(db)
    return {
        "slowest_queries": rep["slowest_queries"],
        "n1_candidates": rep["n1_candidates"]
    }
