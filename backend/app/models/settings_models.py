from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database.connection import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    notification_settings_json = Column(Text, nullable=True) # JSON string
    appearance_json = Column(Text, nullable=True) # Theme, density
    default_views_json = Column(Text, nullable=True) # Default landing page, default issue view, filters
    region_json = Column(Text, nullable=True) # Language, timezone, date/time format
    dashboard_widgets_json = Column(Text, nullable=True) # Visible widgets list
    intelligence_prefs_json = Column(Text, nullable=True) # Risk priorities, recommendation style, explanation level
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="preferences")


class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    key_hash = Column(String(255), nullable=False)
    key_prefix = Column(String(20), nullable=False) # bgf_live_...
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="api_keys")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_token = Column(String(255), nullable=False, unique=True)
    device_info = Column(String(255), default="Windows / Chrome Browser")
    ip_address = Column(String(50), default="127.0.0.1")
    last_active = Column(DateTime, default=datetime.utcnow)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="sessions")


class ProjectEscalationContact(Base):
    __tablename__ = "project_escalation_contacts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    pm_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dev_lead_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    qa_lead_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    security_contact_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="escalation_contacts")
    pm_user = relationship("User", foreign_keys=[pm_user_id])
    dev_lead_user = relationship("User", foreign_keys=[dev_lead_user_id])
    qa_lead_user = relationship("User", foreign_keys=[qa_lead_user_id])
    security_contact_user = relationship("User", foreign_keys=[security_contact_user_id])


class ProjectCustomField(Base):
    __tablename__ = "project_custom_fields"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    field_type = Column(String(50), default="Text") # Text, Number, Dropdown, Multi-select, Boolean, Date
    is_required = Column(Boolean, default=False)
    options_json = Column(Text, nullable=True) # Options list for dropdowns
    default_value = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="custom_fields")


class ProjectWorkflowConfig(Base):
    __tablename__ = "project_workflow_configs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    workflow_json = Column(Text, nullable=False) # Configured transitions & role permissions
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", backref="workflow_config")


class SystemAISetting(Base):
    __tablename__ = "system_ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String(50), default="Gemini 1.5 Flash / Pro")
    connection_status = Column(String(50), default="Connected")
    mode = Column(String(50), default="Live AI") # Live AI, Fallback / Stub
    feature_toggles_json = Column(Text, nullable=True)
    confidence_thresholds_json = Column(Text, nullable=True)
    data_controls_json = Column(Text, nullable=True)
    safety_policy_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemSMTPSetting(Base):
    __tablename__ = "system_smtp_settings"

    id = Column(Integer, primary_key=True, index=True)
    smtp_host = Column(String(255), default="smtp.mailtrap.io")
    smtp_port = Column(Integer, default=587)
    username = Column(String(100), default="bugflow_smtp")
    password_encrypted = Column(String(255), default="••••••••••••")
    encryption = Column(String(20), default="TLS") # TLS, SSL, None
    from_address = Column(String(150), default="noreply@bugflow.ai")
    is_enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemSecurityPolicy(Base):
    __tablename__ = "system_security_policies"

    id = Column(Integer, primary_key=True, index=True)
    min_password_length = Column(Integer, default=8)
    session_timeout_minutes = Column(Integer, default=60)
    failed_login_threshold = Column(Integer, default=5)
    enforce_2fa = Column(Boolean, default=False)
    rbac_strict_mode = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
