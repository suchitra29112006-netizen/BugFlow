from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.time_entry import TimeEntry, ActiveTimer
from app.models.issue import Issue
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.team import Team
from app.models.sprint import Sprint
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/time", tags=["Timesheets & Work Logs"])


def format_duration(seconds: int) -> str:
    """Format duration in seconds into clean '1h 20m' or '45m' string."""
    if not seconds or seconds <= 0:
        return "0m"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0 and minutes > 0:
        return f"{hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h"
    else:
        return f"{minutes}m"


class TimeLogCreate(BaseModel):
    issue_id: int
    user_id: Optional[int] = None
    duration_seconds: Optional[int] = None
    hours: Optional[float] = None
    minutes: Optional[int] = None
    work_type: Optional[str] = "Development"
    note: str
    logged_date: Optional[datetime] = None
    project_id: Optional[int] = None
    squad_id: Optional[int] = None
    sprint_id: Optional[int] = None
    billable: Optional[bool] = True


class TimeLogUpdate(BaseModel):
    duration_seconds: Optional[int] = None
    hours: Optional[float] = None
    minutes: Optional[int] = None
    work_type: Optional[str] = None
    note: Optional[str] = None
    logged_date: Optional[datetime] = None
    project_id: Optional[int] = None
    squad_id: Optional[int] = None
    sprint_id: Optional[int] = None
    billable: Optional[bool] = None


class TimerStartRequest(BaseModel):
    issue_id: int
    work_type: Optional[str] = "Debugging"
    work_notes: Optional[str] = None


class TimerStopRequest(BaseModel):
    note: Optional[str] = None
    work_type: Optional[str] = None
    billable: Optional[bool] = True


class AISummaryRequest(BaseModel):
    raw_notes: str
    issue_title: Optional[str] = None


@router.get("/entries")
def get_time_entries(
    issue_id: Optional[int] = None,
    user_id: Optional[int] = Query(default=None, alias="developer_id"),
    project_id: Optional[int] = None,
    squad_id: Optional[int] = Query(default=None, alias="team_id"),
    sprint_id: Optional[int] = None,
    work_type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TimeEntry)

    if issue_id:
        query = query.filter(TimeEntry.issue_id == issue_id)
    if user_id:
        query = query.filter(TimeEntry.user_id == user_id)
    if project_id:
        query = query.filter(TimeEntry.project_id == project_id)
    if squad_id:
        query = query.filter(TimeEntry.squad_id == squad_id)
    if sprint_id:
        query = query.filter(TimeEntry.sprint_id == sprint_id)
    if work_type and work_type.upper() != "ALL":
        query = query.filter(TimeEntry.work_type == work_type)

    if start_date:
        try:
            st = datetime.fromisoformat(start_date.replace("Z", ""))
            query = query.filter(TimeEntry.logged_date >= st)
        except Exception:
            pass

    if end_date:
        try:
            et = datetime.fromisoformat(end_date.replace("Z", ""))
            query = query.filter(TimeEntry.logged_date <= et)
        except Exception:
            pass

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.join(Issue).filter(
            (TimeEntry.note.ilike(term)) | 
            (Issue.title.ilike(term)) |
            (TimeEntry.work_type.ilike(term))
        )

    entries = query.order_by(TimeEntry.logged_date.desc(), TimeEntry.id.desc()).all()

    return [
        {
            "id": e.id,
            "issue_id": e.issue_id,
            "issue_title": e.issue.title if e.issue else f"Issue #{e.issue_id}",
            "issue_severity": str(e.issue.severity.value) if (e.issue and hasattr(e.issue.severity, 'value')) else (str(e.issue.severity) if e.issue else "Medium"),
            "user_id": e.user_id,
            "user_name": e.user.name if e.user else "System Developer",
            "user_role": str(e.user.role.value) if (e.user and hasattr(e.user.role, 'value')) else "Developer",
            "user_email": e.user.email if e.user else "",
            "duration_seconds": e.duration_seconds or int((e.hours_logged or 0) * 3600),
            "hours_logged": round((e.duration_seconds or int((e.hours_logged or 0) * 3600)) / 3600.0, 2),
            "duration_formatted": format_duration(e.duration_seconds or int((e.hours_logged or 0) * 3600)),
            "work_type": e.work_type or "Development",
            "note": e.note or "Engineering work log",
            "logged_date": e.logged_date.isoformat() if e.logged_date else e.created_at.isoformat(),
            "project_id": e.project_id or (e.issue.project_id if e.issue else None),
            "project_name": e.project.name if e.project else (e.issue.project.name if (e.issue and e.issue.project) else "General Project"),
            "squad_id": e.squad_id or (e.issue.team_id if e.issue else None),
            "squad_name": e.squad.name if e.squad else "Engineering Squad",
            "sprint_id": e.sprint_id or (e.issue.sprint_id if e.issue else None),
            "sprint_name": e.sprint.name if e.sprint else (e.issue.sprint.name if (e.issue and e.issue.sprint) else "Active Sprint"),
            "billable": e.billable,
            "created_at": e.created_at.isoformat() if e.created_at else datetime.utcnow().isoformat()
        }
        for e in entries
    ]


@router.get("/summary")
def get_time_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=now.weekday())

    all_entries = db.query(TimeEntry).all()

    total_seconds = sum([e.duration_seconds or int((e.hours_logged or 0) * 3600) for e in all_entries])
    today_seconds = sum([e.duration_seconds or int((e.hours_logged or 0) * 3600) for e in all_entries if e.logged_date and e.logged_date >= today_start])
    week_seconds = sum([e.duration_seconds or int((e.hours_logged or 0) * 3600) for e in all_entries if e.logged_date and e.logged_date >= week_start])

    # Check active timer for current user
    active_timer_record = db.query(ActiveTimer).filter(ActiveTimer.user_id == current_user.id).first()
    active_timer_data = None

    if active_timer_record:
        current_elapsed = active_timer_record.elapsed_seconds or 0
        if active_timer_record.status == "RUNNING" and active_timer_record.started_at:
            current_elapsed += int((datetime.utcnow() - active_timer_record.started_at).total_seconds())

        issue = db.query(Issue).filter(Issue.id == active_timer_record.issue_id).first() if active_timer_record.issue_id else None

        active_timer_data = {
            "id": active_timer_record.id,
            "issue_id": active_timer_record.issue_id,
            "issue_title": issue.title if issue else "General Defect Triage",
            "status": active_timer_record.status,
            "work_type": active_timer_record.work_type or "Debugging",
            "work_notes": active_timer_record.work_notes or "",
            "elapsed_seconds": current_elapsed,
            "elapsed_formatted": format_duration(current_elapsed),
            "started_at": active_timer_record.started_at.isoformat() if active_timer_record.started_at else None,
            "paused_at": active_timer_record.paused_at.isoformat() if active_timer_record.paused_at else None
        }

    return {
        "total_logged_seconds": total_seconds,
        "total_logged_formatted": format_duration(total_seconds),
        "today_logged_seconds": today_seconds,
        "today_logged_formatted": format_duration(today_seconds),
        "this_week_logged_seconds": week_seconds,
        "this_week_logged_formatted": format_duration(week_seconds),
        "total_entries_count": len(all_entries),
        "active_timer": active_timer_data
    }


@router.get("/analytics")
def get_time_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entries = db.query(TimeEntry).all()
    total_seconds = max(1, sum([e.duration_seconds or int((e.hours_logged or 0) * 3600) for e in entries]))

    # Breakdown by Work Type
    type_map = {}
    for e in entries:
        wt = e.work_type or "Development"
        sec = e.duration_seconds or int((e.hours_logged or 0) * 3600)
        type_map[wt] = type_map.get(wt, 0) + sec

    by_work_type = [
        {
            "work_type": k,
            "seconds": v,
            "hours": round(v / 3600.0, 1),
            "formatted": format_duration(v),
            "percentage": round((v / total_seconds) * 100, 1)
        }
        for k, v in sorted(type_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Breakdown by Developer
    user_map = {}
    for e in entries:
        u_name = e.user.name if e.user else f"User #{e.user_id}"
        sec = e.duration_seconds or int((e.hours_logged or 0) * 3600)
        user_map[u_name] = user_map.get(u_name, 0) + sec

    by_developer = [
        {
            "developer_name": k,
            "seconds": v,
            "hours": round(v / 3600.0, 1),
            "formatted": format_duration(v)
        }
        for k, v in sorted(user_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Breakdown by Project
    proj_map = {}
    for e in entries:
        p_name = e.project.name if e.project else (e.issue.project.name if (e.issue and e.issue.project) else "Core Platform")
        sec = e.duration_seconds or int((e.hours_logged or 0) * 3600)
        proj_map[p_name] = proj_map.get(p_name, 0) + sec

    by_project = [
        {
            "project_name": k,
            "seconds": v,
            "hours": round(v / 3600.0, 1),
            "formatted": format_duration(v)
        }
        for k, v in sorted(proj_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Breakdown by Issue (Estimated vs Actual)
    issue_map = {}
    for e in entries:
        if not e.issue_id:
            continue
        if e.issue_id not in issue_map:
            est_hrs = (e.issue.est_resolution_hours or 4.0) if e.issue else 4.0
            issue_map[e.issue_id] = {
                "issue_id": e.issue_id,
                "issue_title": e.issue.title if e.issue else f"Issue #{e.issue_id}",
                "logged_seconds": 0,
                "estimated_hours": est_hrs,
                "estimated_seconds": int(est_hrs * 3600)
            }
        sec = e.duration_seconds or int((e.hours_logged or 0) * 3600)
        issue_map[e.issue_id]["logged_seconds"] += sec

    by_issue = [
        {
            "issue_id": item["issue_id"],
            "issue_title": item["issue_title"],
            "logged_seconds": item["logged_seconds"],
            "logged_formatted": format_duration(item["logged_seconds"]),
            "estimated_hours": item["estimated_hours"],
            "estimated_formatted": format_duration(item["estimated_seconds"]),
            "variance_hours": round((item["logged_seconds"] - item["estimated_seconds"]) / 3600.0, 1)
        }
        for item in sorted(issue_map.values(), key=lambda x: x["logged_seconds"], reverse=True)
    ]

    # Daily Trend (Last 7 Days)
    now = datetime.utcnow()
    daily_trend = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_start = datetime(day_date.year, day_date.month, day_date.day)
        day_end = day_start + timedelta(days=1)
        day_sec = sum([
            e.duration_seconds or int((e.hours_logged or 0) * 3600)
            for e in entries
            if e.logged_date and day_start <= e.logged_date < day_end
        ])
        daily_trend.append({
            "date": day_start.strftime("%b %d"),
            "full_date": day_start.strftime("%Y-%m-%d"),
            "seconds": day_sec,
            "hours": round(day_sec / 3600.0, 1),
            "formatted": format_duration(day_sec)
        })

    return {
        "by_work_type": by_work_type,
        "by_developer": by_developer,
        "by_project": by_project,
        "by_issue": by_issue,
        "daily_trend": daily_trend
    }


@router.post("/entries", status_code=status.HTTP_201_CREATED)
def create_time_entry(
    payload: TimeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail=f"Issue #{payload.issue_id} not found.")

    if not payload.note or not payload.note.strip():
        raise HTTPException(status_code=400, detail="Work notes are required to log engineering time.")

    # Calculate total duration in seconds
    sec = payload.duration_seconds or 0
    if not sec:
        h = payload.hours or 0
        m = payload.minutes or 0
        sec = int(h * 3600 + m * 60)

    if sec <= 0:
        raise HTTPException(status_code=400, detail="Logged duration must be greater than 0 minutes.")

    target_user_id = payload.user_id if (payload.user_id and current_user.role == UserRole.ADMIN) else current_user.id
    target_project_id = payload.project_id or issue.project_id
    target_squad_id = payload.squad_id or issue.team_id
    target_sprint_id = payload.sprint_id or issue.sprint_id
    logged_dt = payload.logged_date or datetime.utcnow()

    entry = TimeEntry(
        issue_id=issue.id,
        user_id=target_user_id,
        duration_seconds=sec,
        hours_logged=round(sec / 3600.0, 2),
        work_type=payload.work_type or "Development",
        note=payload.note.strip(),
        logged_date=logged_dt,
        project_id=target_project_id,
        squad_id=target_squad_id,
        sprint_id=target_sprint_id,
        billable=payload.billable if payload.billable is not None else True
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id": entry.id,
        "message": f"Logged {format_duration(sec)} on #{issue.id} ({issue.title}).",
        "entry": {
            "id": entry.id,
            "issue_id": entry.issue_id,
            "duration_seconds": entry.duration_seconds,
            "duration_formatted": format_duration(entry.duration_seconds),
            "work_type": entry.work_type,
            "note": entry.note,
            "logged_date": entry.logged_date.isoformat()
        }
    }


@router.put("/entries/{entry_id}")
def update_time_entry(
    entry_id: int,
    payload: TimeLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"Work log #{entry_id} not found.")

    if current_user.role != UserRole.ADMIN and entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only edit your own work logs.")

    if payload.duration_seconds is not None or payload.hours is not None or payload.minutes is not None:
        sec = payload.duration_seconds or 0
        if not sec:
            h = payload.hours or 0
            m = payload.minutes or 0
            sec = int(h * 3600 + m * 60)
        if sec > 0:
            entry.duration_seconds = sec
            entry.hours_logged = round(sec / 3600.0, 2)

    if payload.work_type is not None:
        entry.work_type = payload.work_type
    if payload.note is not None and payload.note.strip():
        entry.note = payload.note.strip()
    if payload.logged_date is not None:
        entry.logged_date = payload.logged_date
    if payload.project_id is not None:
        entry.project_id = payload.project_id
    if payload.squad_id is not None:
        entry.squad_id = payload.squad_id
    if payload.sprint_id is not None:
        entry.sprint_id = payload.sprint_id
    if payload.billable is not None:
        entry.billable = payload.billable

    db.commit()
    db.refresh(entry)

    return {"message": "Work log updated successfully.", "id": entry.id}


@router.delete("/entries/{entry_id}")
def delete_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"Work log #{entry_id} not found.")

    if current_user.role != UserRole.ADMIN and entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only delete your own work logs.")

    db.delete(entry)
    db.commit()
    return {"message": f"Work log #{entry_id} deleted successfully."}


@router.get("/active-timer")
def get_active_timer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timer = db.query(ActiveTimer).filter(ActiveTimer.user_id == current_user.id).first()
    if not timer:
        return {"active": False, "timer": None}

    current_elapsed = timer.elapsed_seconds or 0
    if timer.status == "RUNNING" and timer.started_at:
        current_elapsed += int((datetime.utcnow() - timer.started_at).total_seconds())

    issue = db.query(Issue).filter(Issue.id == timer.issue_id).first() if timer.issue_id else None

    return {
        "active": True,
        "timer": {
            "id": timer.id,
            "issue_id": timer.issue_id,
            "issue_title": issue.title if issue else "General Defect Triage",
            "issue_key": f"BUG-{issue.id}" if issue else "TASK",
            "status": timer.status,
            "work_type": timer.work_type or "Debugging",
            "work_notes": timer.work_notes or "",
            "elapsed_seconds": current_elapsed,
            "elapsed_formatted": format_duration(current_elapsed),
            "started_at": timer.started_at.isoformat() if timer.started_at else None
        }
    }


@router.post("/timer/start")
def start_timer(
    payload: TimerStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail=f"Issue #{payload.issue_id} not found.")

    existing = db.query(ActiveTimer).filter(ActiveTimer.user_id == current_user.id).first()
    now = datetime.utcnow()

    if existing:
        if existing.issue_id == payload.issue_id:
            existing.status = "RUNNING"
            existing.started_at = now
            existing.work_type = payload.work_type or existing.work_type or "Debugging"
            if payload.work_notes:
                existing.work_notes = payload.work_notes
        else:
            # Switch timer to new issue
            existing.issue_id = payload.issue_id
            existing.started_at = now
            existing.paused_at = None
            existing.elapsed_seconds = 0
            existing.status = "RUNNING"
            existing.work_type = payload.work_type or "Debugging"
            existing.work_notes = payload.work_notes or f"Work session on #{issue.id}"
    else:
        timer = ActiveTimer(
            issue_id=issue.id,
            user_id=current_user.id,
            started_at=now,
            elapsed_seconds=0,
            status="RUNNING",
            work_type=payload.work_type or "Debugging",
            work_notes=payload.work_notes or f"Work session on #{issue.id}"
        )
        db.add(timer)

    db.commit()
    return {"message": f"Active work timer started on #{issue.id} ({issue.title})."}


@router.post("/timer/pause")
def pause_timer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timer = db.query(ActiveTimer).filter(ActiveTimer.user_id == current_user.id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="No active timer session running.")

    now = datetime.utcnow()
    if timer.status == "RUNNING" and timer.started_at:
        additional = int((now - timer.started_at).total_seconds())
        timer.elapsed_seconds = (timer.elapsed_seconds or 0) + additional
        timer.started_at = None

    timer.status = "PAUSED"
    timer.paused_at = now
    db.commit()

    return {
        "message": "Timer session paused.",
        "elapsed_seconds": timer.elapsed_seconds,
        "elapsed_formatted": format_duration(timer.elapsed_seconds)
    }


@router.post("/timer/resume")
def resume_timer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timer = db.query(ActiveTimer).filter(ActiveTimer.user_id == current_user.id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="No active timer session found.")

    timer.status = "RUNNING"
    timer.started_at = datetime.utcnow()
    timer.paused_at = None
    db.commit()

    return {"message": "Timer session resumed."}


@router.post("/timer/stop")
def stop_timer(
    payload: TimerStopRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timer = db.query(ActiveTimer).filter(ActiveTimer.user_id == current_user.id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="No active timer session to stop.")

    now = datetime.utcnow()
    total_seconds = timer.elapsed_seconds or 0
    if timer.status == "RUNNING" and timer.started_at:
        total_seconds += int((now - timer.started_at).total_seconds())

    # Minimum 60 seconds logged on timer stop
    total_seconds = max(60, total_seconds)

    issue = db.query(Issue).filter(Issue.id == timer.issue_id).first() if timer.issue_id else None
    if not issue:
        db.delete(timer)
        db.commit()
        raise HTTPException(status_code=404, detail="Associated issue no longer exists.")

    notes = payload.note or timer.work_notes or f"Work session completed on #{issue.id}"
    work_type = payload.work_type or timer.work_type or "Debugging"

    entry = TimeEntry(
        issue_id=issue.id,
        user_id=current_user.id,
        duration_seconds=total_seconds,
        hours_logged=round(total_seconds / 3600.0, 2),
        work_type=work_type,
        note=notes,
        logged_date=now,
        project_id=issue.project_id,
        squad_id=issue.team_id,
        sprint_id=issue.sprint_id,
        billable=payload.billable if payload.billable is not None else True
    )

    db.add(entry)
    db.delete(timer)
    db.commit()

    return {
        "message": f"Timer stopped and {format_duration(total_seconds)} logged on #{issue.id}.",
        "duration_seconds": total_seconds,
        "duration_formatted": format_duration(total_seconds),
        "entry_id": entry.id
    }


@router.post("/generate-summary")
def generate_ai_work_summary(
    payload: AISummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Use Gemini AI service to clean raw notes into a professional engineering work log description."""
    if not payload.raw_notes or not payload.raw_notes.strip():
        raise HTTPException(status_code=400, detail="Please enter raw work notes to summarize.")

    from app.services.ai_service import generate_ai_response
    prompt = (
        f"You are an expert lead software engineer formatting time tracking work logs for a Jira/Linear platform.\n"
        f"Context Issue: {payload.issue_title or 'Software Defect'}\n"
        f"Raw Engineer Notes: \"{payload.raw_notes.strip()}\"\n\n"
        f"Write a crisp, single-sentence professional engineering work log description (max 25 words). "
        f"Focus on actions taken, root cause identified, or testing performed. Output ONLY the polished summary text."
    )

    try:
        summary = generate_ai_response(prompt)
        cleaned = summary.strip().strip('"').strip("'")
        return {"success": True, "summary": cleaned}
    except Exception as err:
        # Fallback formatting if AI service fails gracefully
        raw = payload.raw_notes.strip().capitalize()
        if not raw.endswith('.'):
            raw += '.'
        return {"success": True, "summary": f"Completed work session: {raw}"}
