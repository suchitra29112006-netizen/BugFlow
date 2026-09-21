from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from app.database.connection import Base


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    trigger_event = Column(String(100), nullable=False) # e.g. "ISSUE_CREATED", "STATUS_CHANGED"
    condition_field = Column(String(100), nullable=False) # e.g. "severity"
    condition_value = Column(String(100), nullable=False) # e.g. "Critical"
    action_type = Column(String(100), nullable=False) # e.g. "SET_PRIORITY", "AUTO_ASSIGN"
    action_value = Column(String(200), nullable=False) # e.g. "Critical", "2"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
