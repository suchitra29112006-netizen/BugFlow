from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class AssignmentFeedback(Base):
    __tablename__ = "assignment_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    recommended_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    evaluator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_good_recommendation = Column(Boolean, nullable=False) # True = Good, False = Poor
    reason_category = Column(String(100), nullable=True) # e.g. "Incorrect skill match", "Too much workload"
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", foreign_keys=[issue_id])
    recommended_user = relationship("User", foreign_keys=[recommended_user_id])
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    evaluator = relationship("User", foreign_keys=[evaluator_id])
