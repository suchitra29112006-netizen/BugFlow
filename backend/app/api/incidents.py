from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.milestone4_models import Incident, FindingSeverity

router = APIRouter(prefix="/api/v1/incidents", tags=["Incident Management"])

class IncidentCreate(BaseModel):
    title: str
    affected_components: Optional[str] = "Authentication"
    severity: Optional[str] = "High"

@router.get("")
def get_incidents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incidents = db.query(Incident).all()
    if not incidents:
        inc1 = Incident(
            incident_code="INC-101",
            title="Authentication Token Rotation Outage",
            severity=FindingSeverity.CRITICAL,
            status="RESOLVED",
            affected_components="Authentication, Payment API",
            postmortem_text="## Root Cause\nRedis token pool pool_size exhausted during high load.\n\n## Mitigation\nIncreased pool limit & added failover cache.",
            resolved_at=datetime.utcnow()
        )
        db.add(inc1)
        db.commit()
        incidents = db.query(Incident).all()

    return incidents

@router.post("", status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Incident).count()
    inc = Incident(
        incident_code=f"INC-{100 + count + 1}",
        title=payload.title,
        affected_components=payload.affected_components or "General System",
        severity=FindingSeverity.HIGH,
        status="INVESTIGATING"
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc
