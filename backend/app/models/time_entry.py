from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hours_logged = Column(Float, nullable=False) # e.g. 2.5
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", foreign_keys=[issue_id])
    user = relationship("User", foreign_keys=[user_id])


class ActiveTimer(Base):
    __tablename__ = "active_timers"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="RUNNING", nullable=False) # RUNNING, PAUSED

    issue = relationship("Issue", foreign_keys=[issue_id])
    user = relationship("User", foreign_keys=[user_id])
