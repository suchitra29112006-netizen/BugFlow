from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json

from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.ask_portal import ExternalRequest
from app.models.issue import Issue, IssueSeverity, IssuePriority, IssueStatus
from app.models.project import Project
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/ask-portal", tags=["Public Ask Portal"])

class ExternalSubmitSchema(BaseModel):
    requester_name: str
    requester_email: str
    title: str
    description: str
    environment: Optional[str] = "Production"
    request_type: Optional[str] = "BUG"

@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_external_request(payload: ExternalSubmitSchema, db: Session = Depends(get_db)):
    # AI Triage synthesis
    severity_pred = ai_service.predict_severity(payload.title, payload.description)
    duplicates_res = ai_service.check_duplicates(payload.title, payload.description, None, db)
    duplicates = duplicates_res.get("duplicates", []) if isinstance(duplicates_res, dict) else []

    sev_str = severity_pred.severity.value if hasattr(severity_pred.severity, 'value') else str(severity_pred.severity)
    confidence = float(getattr(severity_pred, 'confidence', 85.0))

    text_lower = (payload.title + " " + payload.description).lower()
    if any(w in text_lower for w in ["sec", "auth", "token", "jwt", "permission", "xss", "csrf", "hack"]):
        dept_name = "DevOps & Security"
        team_name = "Security Engineering"
    elif any(w in text_lower for w in ["test", "qa", "bug", "reproduce", "automation", "e2e"]):
        dept_name = "QA & Quality"
        team_name = "Release Validation"
    elif any(w in text_lower for w in ["ux", "ui", "button", "design", "css", "layout", "mobile"]):
        dept_name = "Product & Design"
        team_name = "Design Systems"
    else:
        dept_name = "Engineering"
        team_name = "Backend Engineering" if any(w in text_lower for w in ["api", "db", "server", "endpoint", "sql"]) else "Frontend Experience"

    triage_info = {
        "clean_title": payload.title.strip(),
        "severity_suggestion": sev_str,
        "confidence_score": confidence,
        "suggested_department": dept_name,
        "suggested_squad": team_name,
        "suggested_team": team_name,
        "duplicate_matches": duplicates[:2] if duplicates else []
    }

    req = ExternalRequest(
        requester_name=payload.requester_name,
        requester_email=payload.requester_email,
        title=payload.title,
        description=payload.description,
        environment=payload.environment,
        request_type=payload.request_type,
        status="SUBMITTED",
        ai_triage_json=json.dumps(triage_info)
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return {
        "success": True,
        "request_id": req.id,
        "message": "Your report has been received and triaged by BugFlow AI.",
        "ai_triage": triage_info
    }

@router.get("/requests")
def get_external_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reqs = db.query(ExternalRequest).order_by(ExternalRequest.created_at.desc()).all()
    result = []
    for r in reqs:
        triage = json.loads(r.ai_triage_json) if r.ai_triage_json else {}
        result.append({
            "id": r.id,
            "requester_name": r.requester_name,
            "requester_email": r.requester_email,
            "title": r.title,
            "description": r.description,
            "environment": r.environment,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "ai_triage": triage
        })
    return result

@router.post("/requests/{request_id}/convert")
def convert_request_to_issue(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(ExternalRequest).filter(ExternalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    proj = db.query(Project).first()
    if not proj:
        raise HTTPException(status_code=400, detail="No active project available to link issue")

    triage = json.loads(req.ai_triage_json) if req.ai_triage_json else {}
    sev_str = triage.get("severity_suggestion", "Medium").upper()
    sev_enum = IssueSeverity.MEDIUM
    if sev_str == "CRITICAL":
        sev_enum = IssueSeverity.CRITICAL
    elif sev_str == "HIGH":
        sev_enum = IssueSeverity.HIGH
    elif sev_str == "LOW":
        sev_enum = IssueSeverity.LOW

    issue = Issue(
        title=f"[Portal] {req.title}",
        description=f"**Reported by**: {req.requester_name} ({req.requester_email})\n\n{req.description}",
        severity=sev_enum,
        status=IssueStatus.OPEN,
        priority=IssuePriority.MEDIUM,
        reporter_id=current_user.id,
        project_id=proj.id,
        work_item_type=req.request_type or "BUG"
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    req.status = "CONVERTED"
    req.converted_issue_id = issue.id
    db.commit()

    return {"success": True, "converted_issue_id": issue.id}
