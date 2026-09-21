from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    severity = Column(String(50), nullable=False) # Critical, High, Medium, Low
    target_hours = Column(Float, nullable=False) # e.g. 4.0 hours for Critical
    escalate_role = Column(String(50), default="Project Manager", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SLAEvent(Base):
    __tablename__ = "sla_events"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    sla_policy_id = Column(Integer, ForeignKey("sla_policies.id"), nullable=True)
    target_due_time = Column(DateTime, nullable=False)
    is_breached = Column(Boolean, default=False, nullable=False)
    breached_at = Column(DateTime, nullable=True)

    issue = relationship("Issue", foreign_keys=[issue_id])
    policy = relationship("SLAPolicy", foreign_keys=[sla_policy_id])
