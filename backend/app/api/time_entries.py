from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.time_entry import TimeEntry, ActiveTimer
from app.models.issue import Issue
from app.models.user import User
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/time", tags=["Timesheets & Timers"])


class TimeLogCreate(BaseModel):
    issue_id: int
    hours_logged: float
    note: Optional[str] = None


@router.get("/entries")
def get_time_entries(
    issue_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TimeEntry)
    if issue_id:
        query = query.filter(TimeEntry.issue_id == issue_id)
    
    entries = query.order_by(TimeEntry.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "issue_id": e.issue_id,
            "issue_title": e.issue.title if e.issue else "",
            "user_name": e.user.name if e.user else "",
            "hours_logged": e.hours_logged,
            "note": e.note,
            "created_at": e.created_at
        }
        for e in entries
    ]


@router.post("/start/{issue_id}")
def start_timer(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(ActiveTimer).filter(ActiveTimer.issue_id == issue_id, ActiveTimer.user_id == current_user.id).first()
    if existing:
        existing.status = "RUNNING"
        existing.started_at = datetime.utcnow()
    else:
        timer = ActiveTimer(
            issue_id=issue_id,
            user_id=current_user.id,
            started_at=datetime.utcnow(),
            status="RUNNING"
        )
        db.add(timer)
    
    db.commit()
    return {"message": "Timer started"}


@router.post("/pause/{issue_id}")
def pause_timer(
    issue_id: int,
    note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timer = db.query(ActiveTimer).filter(ActiveTimer.issue_id == issue_id, ActiveTimer.user_id == current_user.id).first()
    if not timer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active timer found.")
    
    # Calculate elapsed hours
    now = datetime.utcnow()
    elapsed_seconds = (now - timer.started_at).total_seconds()
    hours = round(max(elapsed_seconds / 3600.0, 0.1), 2)

    log = TimeEntry(
        issue_id=issue_id,
        user_id=current_user.id,
        hours_logged=hours,
        note=note or "Paused timer session"
    )
    db.add(log)
    db.delete(timer)
    db.commit()

    return {"message": f"Timer paused and {hours} hours logged.", "hours_logged": hours}


@router.post("/stop/{issue_id}")
def stop_timer(
    issue_id: int,
    note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return pause_timer(issue_id, note or "Stopped timer session", db, current_user)
