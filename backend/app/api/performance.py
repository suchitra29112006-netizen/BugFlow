from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User, UserRole
from app.auth.deps import get_current_user
from app.services.performance_service import query_performance_advisor

router = APIRouter(prefix="/api/performance", tags=["Database Performance & Observability Center"])


@router.get("/report")
def get_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve complete Database Performance & Observability Report."""
    return query_performance_advisor.generate_performance_report(db)


@router.get("/health")
def get_database_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve transparent Database Health Score breakdown."""
    return query_performance_advisor.calculate_health_score(db)


@router.get("/queries")
def get_captured_queries(
    search: Optional[str] = Query(None, description="Search query string"),
    endpoint: Optional[str] = Query(None, description="Filter by endpoint"),
    method: Optional[str] = Query(None, description="Filter by HTTP method"),
    slow_only: bool = Query(False, description="Filter slow queries only"),
    error_only: bool = Query(False, description="Filter error queries only"),
    n1_only: bool = Query(False, description="Filter N+1 pattern queries only"),
    sort_by: str = Query("id", description="Sort by id, executions, latency, p95"),
    slow_threshold_ms: float = Query(100.0, description="Slow query threshold in ms"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Query Explorer: Retrieve normalized query fingerprints with execution statistics and percentiles."""
    queries = query_performance_advisor.get_captured_queries(
        search=search,
        endpoint=endpoint,
        method=method,
        slow_only=slow_only,
        error_only=error_only,
        n1_only=n1_only,
        sort_by=sort_by,
        slow_threshold_ms=slow_threshold_ms
    )
    return {"queries": queries, "total": len(queries)}


@router.get("/slow-queries")
def get_slow_queries(
    threshold_ms: float = Query(100.0, description="Slow query threshold in ms"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve slow queries exceeding specified threshold in ms."""
    slow_queries = query_performance_advisor.get_slow_queries(threshold_ms=threshold_ms)
    return {"slow_queries": slow_queries, "threshold_ms": threshold_ms, "total": len(slow_queries)}


@router.get("/n-plus-one")
def get_n_plus_one_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detected N+1 query patterns and SQLAlchemy eager loading recommendations."""
    cands = query_performance_advisor.get_n1_candidates()
    return {"n1_candidates": cands, "total": len(cands)}


@router.get("/index-recommendations")
def get_index_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve DDL foreign key index recommendations."""
    recs = query_performance_advisor.get_index_recommendations(db)
    return {"index_recommendations": recs, "total": len(recs)}


@router.get("/endpoints")
def get_endpoint_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve endpoint-to-database performance matrix and queries per request."""
    endpoints = query_performance_advisor.get_endpoint_performance()
    return {"endpoints": endpoints, "total": len(endpoints)}


@router.get("/pool")
def get_connection_pool_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve connection pool metrics and database engine dialect info."""
    return query_performance_advisor.get_connection_pool_metrics(db)


@router.post("/clear-telemetry")
def clear_telemetry(
    current_user: User = Depends(get_current_user)
):
    """Reset captured performance telemetry."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required.")
    query_performance_advisor._captured_queries.clear()
    query_performance_advisor._init_baseline_telemetry()
    return {"message": "Captured telemetry cleared and reset to baseline."}
