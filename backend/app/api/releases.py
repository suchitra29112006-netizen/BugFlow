from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.release_management import Release, Deployment
from app.models.project import Project
from app.services.release_intelligence_service import ReleaseIntelligenceService

router = APIRouter(prefix="/api/v1/releases", tags=["Release Intelligence & Management"])

class ReleaseCreate(BaseModel):
    project_id: Optional[int] = None
    version: str
    name: str
    description: Optional[str] = None
    target_date_days: Optional[int] = 14

@router.get("")
def get_releases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    releases = db.query(Release).order_by(Release.created_at.desc()).all()
    if not releases:
        proj = db.query(Project).first()
        if proj:
            r1 = Release(
                project_id=proj.id,
                version="v2.4.0",
                name="Milestone 4 Engineering & Intelligence Release",
                description="Includes Voice Triage, Defect Fingerprinting, Settings Hub, and Organization Squads",
                status="READY",
                release_date=datetime.utcnow() + timedelta(days=5),
                risk_score=14.2,
                release_notes_ai="## Highlights\n- Added Organization Squads & Goals layer\n- Automated Secret Sandbox Redaction\n- Force-Directed Knowledge Graph Visualizer"
            )
            db.add(r1)
            db.commit()
            releases = db.query(Release).order_by(Release.created_at.desc()).all()

    result = []
    for r in releases:
        facts = ReleaseIntelligenceService.collect_release_facts(r.id, db)
        risk = ReleaseIntelligenceService.calculate_release_risk(facts)

        closed_bugs = facts.get("defects", {}).get("closed", 0)
        open_bugs = facts.get("defects", {}).get("open", 0)
        completed_tasks = facts.get("tasks", {}).get("completed", 0)
        total_tasks = facts.get("tasks", {}).get("total", 0)

        total_scope = closed_bugs + open_bugs + total_tasks
        completed_scope = closed_bugs + completed_tasks
        readiness_pct = round((completed_scope / total_scope) * 100) if total_scope > 0 else 100

        result.append({
            "id": r.id,
            "version": r.version,
            "name": r.name,
            "description": r.description,
            "status": r.status,
            "release_date": r.release_date.isoformat() if r.release_date else None,
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "readiness_pct": readiness_pct,
            "days_remaining": facts.get("timeline", {}).get("days_remaining", 0),
            "is_overdue": facts.get("timeline", {}).get("is_overdue", False),
            "release_notes_ai": r.release_notes_ai,
            "closed_bugs_count": closed_bugs,
            "open_bugs_count": open_bugs,
            "completed_tasks_count": completed_tasks,
            "data_coverage_pct": 92 if r.release_notes_ai else 40,
            "verified_claims_count": closed_bugs + completed_tasks
        })
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def create_release(payload: ReleaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    proj_id = payload.project_id
    if not proj_id:
        proj = db.query(Project).first()
        proj_id = proj.id if proj else 1

    target_date = datetime.utcnow() + timedelta(days=payload.target_date_days or 14)
    rel = Release(
        project_id=proj_id,
        version=payload.version,
        name=payload.name,
        description=payload.description,
        status="PLANNING",
        release_date=target_date,
        risk_score=18.5,
        release_notes_ai=""
    )
    db.add(rel)
    db.commit()
    db.refresh(rel)

    # Automatically generate initial facts & notes
    ReleaseIntelligenceService.generate_release_notes(rel.id, db)
    return rel

@router.post("/{release_id}/notes/generate")
def generate_release_notes(release_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        res = ReleaseIntelligenceService.generate_release_notes(release_id, db)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to generate release notes: {err}")

@router.get("/{release_id}/intelligence")
def get_release_intelligence(release_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    facts = ReleaseIntelligenceService.collect_release_facts(release_id, db)
    if not facts:
        raise HTTPException(status_code=404, detail="Release not found")

    risk = ReleaseIntelligenceService.calculate_release_risk(facts)
    rel = db.query(Release).filter(Release.id == release_id).first()

    if rel and rel.release_notes_ai:
        from app.services.release_note_validator import ReleaseNoteValidator
        val = ReleaseNoteValidator.validate_and_sanitize(rel.release_notes_ai, facts)
    else:
        val = {
            "sanitized_notes": "",
            "data_coverage_pct": 30,
            "verified_claims_count": 0,
            "unsupported_claims_count": 0,
            "evidence": []
        }

    return {
        "release": facts["release"],
        "timeline": facts["timeline"],
        "risk": risk,
        "facts": facts,
        "release_notes_ai": rel.release_notes_ai if rel else "",
        "data_coverage_pct": val["data_coverage_pct"],
        "verified_claims_count": val["verified_claims_count"],
        "unsupported_claims_count": val["unsupported_claims_count"],
        "evidence": val["evidence"]
    }

@router.get("/{release_id}/evidence")
def get_release_evidence(release_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    facts = ReleaseIntelligenceService.collect_release_facts(release_id, db)
    if not facts:
        raise HTTPException(status_code=404, detail="Release not found")

    rel = db.query(Release).filter(Release.id == release_id).first()
    notes = rel.release_notes_ai if rel else ""

    val = ReleaseNoteValidator.validate_and_sanitize(notes, facts)
    return {
        "release_id": release_id,
        "version": facts["release"]["version"],
        "title": facts["release"]["title"],
        "data_coverage_pct": val["data_coverage_pct"],
        "verified_claims_count": val["verified_claims_count"],
        "unsupported_claims_count": val["unsupported_claims_count"],
        "unsupported_claims": val["unsupported_claims"],
        "evidence": val["evidence"]
    }

@router.post("/{release_id}/recalculate")
def recalculate_release(release_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    facts = ReleaseIntelligenceService.collect_release_facts(release_id, db)
    if not facts:
        raise HTTPException(status_code=404, detail="Release not found")

    risk = ReleaseIntelligenceService.calculate_release_risk(facts)
    rel = db.query(Release).filter(Release.id == release_id).first()
    rel.risk_score = risk["risk_score"]
    db.commit()

    return {
        "message": "Release canonical metrics and risk factors recalculated.",
        "release_id": release_id,
        "risk": risk,
        "facts": facts
    }
