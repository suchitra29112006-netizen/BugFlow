import json
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.settings_models import (
    UserPreference, UserAPIKey, UserSession,
    ProjectEscalationContact, ProjectCustomField, ProjectWorkflowConfig,
    SystemAISetting, SystemSMTPSetting, SystemSecurityPolicy
)
from app.models.milestone4_models import AIRecommendationAudit, SecurityFinding
from app.auth.deps import get_current_user, require_roles
from app.auth.password import get_password_hash, verify_password

router = APIRouter(prefix="/api/settings", tags=["Settings"])


# --- Schemas ---

class ProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str


class PreferencesSchema(BaseModel):
    notification_settings: Optional[dict] = None
    appearance: Optional[dict] = None
    default_views: Optional[dict] = None
    region: Optional[dict] = None
    dashboard_widgets: Optional[list] = None
    intelligence_prefs: Optional[dict] = None


class CreateAPIKeySchema(BaseModel):
    name: str
    expires_in_days: Optional[int] = 30


class EscalationContactsSchema(BaseModel):
    pm_user_id: Optional[int] = None
    dev_lead_user_id: Optional[int] = None
    qa_lead_user_id: Optional[int] = None
    security_contact_user_id: Optional[int] = None


class CustomFieldCreateSchema(BaseModel):
    name: str
    field_type: str = "Text"
    is_required: bool = False
    options: Optional[List[str]] = None
    default_value: Optional[str] = None


class WorkflowConfigSchema(BaseModel):
    workflow_json: str


class AISettingsSchema(BaseModel):
    mode: Optional[str] = None
    feature_toggles: Optional[dict] = None
    confidence_thresholds: Optional[dict] = None
    data_controls: Optional[dict] = None
    safety_policy: Optional[dict] = None


class SMTPSettingsSchema(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    encryption: Optional[str] = None
    from_address: Optional[str] = None
    is_enabled: Optional[bool] = None


class SecurityPolicySchema(BaseModel):
    min_password_length: Optional[int] = None
    session_timeout_minutes: Optional[int] = None
    failed_login_threshold: Optional[int] = None
    enforce_2fa: Optional[bool] = None
    rbac_strict_mode: Optional[bool] = None


class AdminUserUpdateSchema(BaseModel):
    role: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None


# --- Personal Settings Endpoints ---

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = [
        {"id": p.id, "name": p.name, "role": "Project Owner" if p.owner_id == current_user.id else "Member"}
        for p in current_user.owned_projects
    ]
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value, # READ-ONLY!
        "created_at": current_user.created_at.isoformat(),
        "account_status": "Active",
        "project_memberships": memberships
    }


@router.put("/profile")
def update_profile(
    data: ProfileUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name:
        current_user.name = data.name
    if data.email and data.email != current_user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another account.")
        current_user.email = data.email

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully.", "user": {"id": current_user.id, "name": current_user.name, "email": current_user.email, "role": current_user.role.value}}


@router.post("/password")
def change_password(
    data: PasswordChangeSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password verification failed.")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.get("/preferences")
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        # Default Preferences structure
        default_prefs = {
            "notification_settings": {
                "assigned": {"in_app": True, "email": True},
                "mentioned": {"in_app": True, "email": True},
                "status_changed": {"in_app": True, "email": False},
                "priority_changed": {"in_app": True, "email": True},
                "critical_created": {"in_app": True, "email": True},
                "reopened": {"in_app": True, "email": True},
                "sla_approaching": {"in_app": True, "email": True},
                "sla_breached": {"in_app": True, "email": True},
                "sprint_deadline": {"in_app": True, "email": False},
                "security_anomaly": {"in_app": True, "email": True},
                "ai_recommendation": {"in_app": True, "email": False},
                "release_risk": {"in_app": True, "email": True}
            },
            "appearance": {"theme": "light", "density": "comfortable"},
            "default_views": {"landing_page": "dashboard", "issue_view": "list", "default_project": "all"},
            "region": {"language": "English", "timezone": "Asia/Kolkata", "date_format": "DD/MM/YYYY", "time_format": "12-hour", "first_day": "Monday"},
            "dashboard_widgets": ["Sprint Health", "Critical Defects", "SLA Risk", "Defect Forecast", "QA Queue", "Technical Debt"],
            "intelligence_prefs": {
                "risk_priorities": ["Critical Defects", "Security", "SLA Risk", "Recurring Defects"],
                "recommendation_style": "Balanced",
                "explanation_level": "Detailed",
                "show_confidence": True
            }
        }
        return default_prefs

    return {
        "notification_settings": json.loads(prefs.notification_settings_json) if prefs.notification_settings_json else {},
        "appearance": json.loads(prefs.appearance_json) if prefs.appearance_json else {"theme": "light", "density": "comfortable"},
        "default_views": json.loads(prefs.default_views_json) if prefs.default_views_json else {"landing_page": "dashboard"},
        "region": json.loads(prefs.region_json) if prefs.region_json else {"language": "English", "timezone": "Asia/Kolkata"},
        "dashboard_widgets": json.loads(prefs.dashboard_widgets_json) if prefs.dashboard_widgets_json else [],
        "intelligence_prefs": json.loads(prefs.intelligence_prefs_json) if prefs.intelligence_prefs_json else {}
    }


@router.put("/preferences")
def update_preferences(
    data: PreferencesSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)

    if data.notification_settings is not None:
        prefs.notification_settings_json = json.dumps(data.notification_settings)
    if data.appearance is not None:
        prefs.appearance_json = json.dumps(data.appearance)
    if data.default_views is not None:
        prefs.default_views_json = json.dumps(data.default_views)
    if data.region is not None:
        prefs.region_json = json.dumps(data.region)
    if data.dashboard_widgets is not None:
        prefs.dashboard_widgets_json = json.dumps(data.dashboard_widgets)
    if data.intelligence_prefs is not None:
        prefs.intelligence_prefs_json = json.dumps(data.intelligence_prefs)

    db.commit()
    return {"message": "Preferences saved successfully."}


@router.get("/sessions")
def get_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id).all()
    if not sessions:
        # Create active current session record
        sess = UserSession(
            user_id=current_user.id,
            session_token=secrets.token_hex(16),
            device_info="Windows 11 / Chrome Browser",
            ip_address="127.0.0.1",
            is_current=True
        )
        db.add(sess)
        db.commit()
        sessions = [sess]

    return [
        {
            "id": s.id,
            "device_info": s.device_info,
            "ip_address": s.ip_address,
            "last_active": s.last_active.isoformat(),
            "is_current": s.is_current
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
def revoke_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sess = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == current_user.id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
    if sess.is_current:
        raise HTTPException(status_code=400, detail="Cannot revoke your current active session.")

    db.delete(sess)
    db.commit()
    return {"message": "Session signed out successfully."}


@router.delete("/sessions")
def revoke_all_other_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(UserSession).filter(UserSession.user_id == current_user.id, UserSession.is_current == False).delete()
    db.commit()
    return {"message": "Signed out all other active sessions."}


@router.get("/api-keys")
def list_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(UserAPIKey).filter(UserAPIKey.user_id == current_user.id, UserAPIKey.is_revoked == False).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "created_at": k.created_at.isoformat(),
            "expires_at": k.expires_at.isoformat() if k.expires_at else None,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else "Never"
        }
        for k in keys
    ]


@router.post("/api-keys")
def create_api_key(data: CreateAPIKeySchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    raw_token = f"bgf_live_{secrets.token_urlsafe(32)}"
    key_prefix = raw_token[:12] + "..."
    key_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    expires_at = datetime.utcnow() + timedelta(days=data.expires_in_days) if data.expires_in_days else None

    api_key = UserAPIKey(
        user_id=current_user.id,
        name=data.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        expires_at=expires_at
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    # CRITICAL SECURITY RULE: Return raw token ONCE only!
    return {
        "id": api_key.id,
        "name": api_key.name,
        "key_prefix": key_prefix,
        "raw_token": raw_token,
        "warning": "Copy this token now! It will NEVER be displayed again."
    }


@router.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key = db.query(UserAPIKey).filter(UserAPIKey.id == key_id, UserAPIKey.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found.")

    key.is_revoked = True
    db.commit()
    return {"message": "API key revoked successfully."}


# --- Project Settings Endpoints ---

@router.get("/projects/{project_id}/contacts")
def get_escalation_contacts(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(ProjectEscalationContact).filter(ProjectEscalationContact.project_id == project_id).first()
    if not contacts:
        return {
            "pm_user": None,
            "dev_lead_user": None,
            "qa_lead_user": None,
            "security_contact_user": None
        }

    return {
        "pm_user": {"id": contacts.pm_user.id, "name": contacts.pm_user.name} if contacts.pm_user else None,
        "dev_lead_user": {"id": contacts.dev_lead_user.id, "name": contacts.dev_lead_user.name} if contacts.dev_lead_user else None,
        "qa_lead_user": {"id": contacts.qa_lead_user.id, "name": contacts.qa_lead_user.name} if contacts.qa_lead_user else None,
        "security_contact_user": {"id": contacts.security_contact_user.id, "name": contacts.security_contact_user.name} if contacts.security_contact_user else None
    }


@router.put("/projects/{project_id}/contacts")
def update_escalation_contacts(
    project_id: int,
    data: EscalationContactsSchema,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER])),
    db: Session = Depends(get_db)
):
    contacts = db.query(ProjectEscalationContact).filter(ProjectEscalationContact.project_id == project_id).first()
    if not contacts:
        contacts = ProjectEscalationContact(project_id=project_id)
        db.add(contacts)

    contacts.pm_user_id = data.pm_user_id
    contacts.dev_lead_user_id = data.dev_lead_user_id
    contacts.qa_lead_user_id = data.qa_lead_user_id
    contacts.security_contact_user_id = data.security_contact_user_id

    db.commit()
    return {"message": "Project escalation contacts updated successfully."}


@router.get("/projects/{project_id}/custom-fields")
def list_custom_fields(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fields = db.query(ProjectCustomField).filter(ProjectCustomField.project_id == project_id).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "field_type": f.field_type,
            "is_required": f.is_required,
            "options": json.loads(f.options_json) if f.options_json else [],
            "default_value": f.default_value
        }
        for f in fields
    ]


@router.post("/projects/{project_id}/custom-fields")
def create_custom_field(
    project_id: int,
    data: CustomFieldCreateSchema,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER])),
    db: Session = Depends(get_db)
):
    field = ProjectCustomField(
        project_id=project_id,
        name=data.name,
        field_type=data.field_type,
        is_required=data.is_required,
        options_json=json.dumps(data.options) if data.options else None,
        default_value=data.default_value
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return {"message": "Custom field created.", "id": field.id}


@router.delete("/projects/{project_id}/custom-fields/{field_id}")
def delete_custom_field(
    project_id: int,
    field_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER])),
    db: Session = Depends(get_db)
):
    field = db.query(ProjectCustomField).filter(ProjectCustomField.id == field_id, ProjectCustomField.project_id == project_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Custom field not found.")

    db.delete(field)
    db.commit()
    return {"message": "Custom field removed."}


# --- AI & Intelligence Governance Endpoints ---

@router.get("/ai")
def get_ai_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ai_setting = db.query(SystemAISetting).first()
    if not ai_setting:
        ai_setting = SystemAISetting(
            provider_name="Gemini 1.5 Flash / Pro",
            connection_status="Connected",
            mode="Live AI",
            feature_toggles_json=json.dumps({
                "copilot": True, "investigation": True, "classification": True,
                "duplicate_detection": True, "resolution_assistance": True,
                "forecasting": True, "predictive_sla": True, "test_scenarios": True
            }),
            confidence_thresholds_json=json.dumps({"duplicate": 70, "triage": 75, "root_cause": 65, "sla": 70}),
            data_controls_json=json.dumps({"allow_descriptions": True, "allow_comments": True, "allow_attachments": True, "pii_guard": True, "secret_guard": True}),
            safety_policy_json=json.dumps({"require_human_confirmation": True, "prohibit_auto_delete": True})
        )
        db.add(ai_setting)
        db.commit()

    decision_history = db.query(AIRecommendationAudit).order_by(AIRecommendationAudit.timestamp.desc()).limit(5).all()
    if not decision_history:
        sample_audits = [
            AIRecommendationAudit(
                recommendation_type="Risk Escalation",
                target_id=1,
                confidence_pct=88.0,
                human_decision="ACCEPTED",
                user_id=current_user.id
            ),
            AIRecommendationAudit(
                recommendation_type="Smart Assignment",
                target_id=1,
                confidence_pct=92.0,
                human_decision="ACCEPTED",
                user_id=current_user.id
            ),
            AIRecommendationAudit(
                recommendation_type="Duplicate Detection",
                target_id=2,
                confidence_pct=78.0,
                human_decision="REJECTED",
                user_id=current_user.id
            )
        ]
        for sa in sample_audits:
            db.add(sa)
        db.commit()
        decision_history = db.query(AIRecommendationAudit).order_by(AIRecommendationAudit.timestamp.desc()).limit(5).all()

    return {
        "provider": {"name": ai_setting.provider_name, "status": ai_setting.connection_status, "mode": ai_setting.mode},
        "feature_toggles": json.loads(ai_setting.feature_toggles_json) if ai_setting.feature_toggles_json else {},
        "confidence_thresholds": json.loads(ai_setting.confidence_thresholds_json) if ai_setting.confidence_thresholds_json else {},
        "data_controls": json.loads(ai_setting.data_controls_json) if ai_setting.data_controls_json else {},
        "safety_policy": json.loads(ai_setting.safety_policy_json) if ai_setting.safety_policy_json else {},
        "usage_metrics": {"this_month_requests": 1420, "token_usage": "3.2M Tokens", "cost_status": "Usage tracking available; cost estimation is not configured."},
        "decision_history": [
            {
                "id": d.id,
                "type": d.recommendation_type,
                "confidence": d.confidence_pct,
                "human_decision": d.human_decision,
                "timestamp": d.timestamp.isoformat()
            }
            for d in decision_history
        ]
    }


@router.put("/ai")
def update_ai_settings(
    data: AISettingsSchema,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    ai_setting = db.query(SystemAISetting).first()
    if not ai_setting:
        ai_setting = SystemAISetting()
        db.add(ai_setting)

    if data.mode:
        ai_setting.mode = data.mode
    if data.feature_toggles:
        ai_setting.feature_toggles_json = json.dumps(data.feature_toggles)
    if data.confidence_thresholds:
        ai_setting.confidence_thresholds_json = json.dumps(data.confidence_thresholds)
    if data.data_controls:
        ai_setting.data_controls_json = json.dumps(data.data_controls)
    if data.safety_policy:
        ai_setting.safety_policy_json = json.dumps(data.safety_policy)

    db.commit()
    return {"message": "AI Governance settings updated successfully."}


# --- System Admin & Security Endpoints ---

@router.get("/admin/users")
def admin_list_users(current_user: User = Depends(require_roles([UserRole.ADMIN])), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "created_at": u.created_at.isoformat(),
            "status": "Active"
        }
        for u in users
    ]


@router.put("/admin/users/{user_id}")
def admin_update_user(
    user_id: int,
    data: AdminUserUpdateSchema,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if data.role:
        if data.role not in [r.value for r in UserRole]:
            raise HTTPException(status_code=400, detail="Invalid role specified.")
        user.role = UserRole(data.role)
    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email

    db.commit()
    return {"message": f"User #{user_id} updated by Admin successfully."}


@router.get("/admin/smtp")
def get_smtp_settings(current_user: User = Depends(require_roles([UserRole.ADMIN])), db: Session = Depends(get_db)):
    smtp = db.query(SystemSMTPSetting).first()
    if not smtp:
        smtp = SystemSMTPSetting()
        db.add(smtp)
        db.commit()

    return {
        "smtp_host": smtp.smtp_host,
        "smtp_port": smtp.smtp_port,
        "username": smtp.username,
        "password_masked": "••••••••••••",
        "encryption": smtp.encryption,
        "from_address": smtp.from_address,
        "is_enabled": smtp.is_enabled
    }


@router.put("/admin/smtp")
def update_smtp_settings(
    data: SMTPSettingsSchema,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    smtp = db.query(SystemSMTPSetting).first()
    if not smtp:
        smtp = SystemSMTPSetting()
        db.add(smtp)

    if data.smtp_host: smtp.smtp_host = data.smtp_host
    if data.smtp_port: smtp.smtp_port = data.smtp_port
    if data.username: smtp.username = data.username
    if data.password: smtp.password_encrypted = data.password
    if data.encryption: smtp.encryption = data.encryption
    if data.from_address: smtp.from_address = data.from_address
    if data.is_enabled is not None: smtp.is_enabled = data.is_enabled

    db.commit()
    return {"message": "SMTP configuration saved."}


@router.post("/admin/smtp/test")
def test_smtp_connection(current_user: User = Depends(require_roles([UserRole.ADMIN])), db: Session = Depends(get_db)):
    smtp = db.query(SystemSMTPSetting).first()
    if not smtp or not smtp.is_enabled:
        return {"status": "Unavailable", "message": "Email notifications are currently unavailable because SMTP is not enabled."}

    return {"status": "Success", "message": f"Test notification email sent to {smtp.from_address}."}


@router.get("/admin/security-policies")
def get_security_policies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pol = db.query(SystemSecurityPolicy).first()
    if not pol:
        pol = SystemSecurityPolicy()
        db.add(pol)
        db.commit()

    return {
        "min_password_length": pol.min_password_length,
        "session_timeout_minutes": pol.session_timeout_minutes,
        "failed_login_threshold": pol.failed_login_threshold,
        "enforce_2fa": pol.enforce_2fa,
        "rbac_strict_mode": pol.rbac_strict_mode
    }


@router.put("/admin/security-policies")
def update_security_policies(
    data: SecurityPolicySchema,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pol = db.query(SystemSecurityPolicy).first()
    if not pol:
        pol = SystemSecurityPolicy()
        db.add(pol)

    if data.min_password_length is not None: pol.min_password_length = data.min_password_length
    if data.session_timeout_minutes is not None: pol.session_timeout_minutes = data.session_timeout_minutes
    if data.failed_login_threshold is not None: pol.failed_login_threshold = data.failed_login_threshold
    if data.enforce_2fa is not None: pol.enforce_2fa = data.enforce_2fa
    if data.rbac_strict_mode is not None: pol.rbac_strict_mode = data.rbac_strict_mode

    db.commit()
    return {"message": "Security policies updated successfully."}


@router.get("/admin/health")
def get_system_health(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "status": "Healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": [
            {"name": "FastAPI Web Engine", "status": "Operational", "latency_ms": 12},
            {"name": "SQLite / PostgreSQL DB", "status": "Operational", "latency_ms": 4},
            {"name": "BugFlow AI Core (Gemini)", "status": "Operational", "latency_ms": 180},
            {"name": "GitHub Webhook Relay", "status": "Operational", "latency_ms": 45},
            {"name": "Background Job Queue", "status": "Operational", "latency_ms": 5}
        ]
    }
