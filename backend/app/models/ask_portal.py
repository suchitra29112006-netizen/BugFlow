from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class ExternalRequest(Base):
    __tablename__ = "external_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_name = Column(String(255), nullable=False)
    requester_email = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    environment = Column(String(100), default="Production")
    request_type = Column(String(50), default="BUG") # BUG, FEATURE_REQUEST, SUPPORT
    status = Column(String(50), default="SUBMITTED") # SUBMITTED, TRIAGED, CONVERTED, REJECTED
    
    ai_triage_json = Column(Text, nullable=True) # AI clean title, severity, team suggestion, duplicate %
    converted_issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    converted_issue = relationship("Issue", foreign_keys=[converted_issue_id])
