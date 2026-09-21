import csv
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/issues/{issue_id}/activity", tags=["Activity Audit Log"])
audit_router = APIRouter(prefix="/api/activity", tags=["Audit Trail Export"])


@router.get("", response_model=List[ActivityLogResponse])
def get_issue_activity_log(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ActivityLog).filter(ActivityLog.issue_id == issue_id).order_by(ActivityLog.timestamp.desc()).all()


@audit_router.get("/export-csv")
def export_activity_audit_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates and downloads a CSV export of the full activity audit trail."""
    logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Log ID", "Issue ID", "User ID", "User Name", "Field Changed", "Old Value", "New Value", "Timestamp"])

    for log in logs:
        writer.writerow([
            log.id,
            log.issue_id,
            log.user_id,
            log.user.name if log.user else "System",
            log.field_changed,
            log.old_value or "",
            log.new_value or "",
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bugflow_activity_audit_trail.csv"}
    )
