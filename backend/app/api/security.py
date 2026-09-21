from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.auth.deps import get_current_user
from app.services.security_service import security_auditor_service, audit_log_anomaly_detector, pii_secret_leak_guard
from app.models.milestone4_models import SecurityFinding, SecurityFinding, FindingStatus

router = APIRouter(prefix="/api/security", tags=["Security & Governance Auditor"])


class TextScanSchema(BaseModel):
    text: str


class UpdateFindingStatusSchema(BaseModel):
    status: str # Open, Accepted Risk, Fixed, False Positive


@router.post("/audit")
def run_security_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 40: Runs static security audit against FastAPI route registry.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required for Security Audit.")
    
    from app.main import app
    return security_auditor_service.scan_fastapi_routes(app, db)


@router.get("/findings")
def get_security_findings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings = db.query(SecurityFinding).all()
    return {
        "total": len(findings),
        "findings": [
            {
                "id": f.id,
                "route": f.route,
                "method": f.method,
                "severity": f.severity.value,
                "category": f.category,
                "evidence": f.evidence,
                "recommendation": f.recommendation,
                "status": f.status.value
            }
            for f in findings
        ]
    }


@router.put("/findings/{finding_id}/status")
def update_security_finding_status(
    finding_id: int,
    status_in: UpdateFindingStatusSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")
    
    finding = db.query(SecurityFinding).filter(SecurityFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")
    
    finding.status = FindingStatus(status_in.status) if status_in.status in [e.value for e in FindingStatus] else finding.status
    db.commit()
    return {"message": f"Finding #{finding.id} status updated to '{finding.status.value}'."}


@router.get("/anomalies")
def get_audit_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 41: Audit Log Anomaly Detector.
    """
    return audit_log_anomaly_detector.detect_anomalies(db)


@router.post("/sensitive-data/check")
def check_sensitive_data_leak(
    scan_in: TextScanSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 42: PII / Secret Leak Guard.
    """
    return pii_secret_leak_guard.scan_text(scan_in.text)
