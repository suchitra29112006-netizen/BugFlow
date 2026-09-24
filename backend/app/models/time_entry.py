from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    hours_logged = Column(Float, nullable=False) # e.g. 1.33
    work_type = Column(String(50), default="Development", nullable=False) # Development, Debugging, Testing, Code Review, Investigation, Documentation, Meeting, Deployment, Other
    note = Column(Text, nullable=True)
    logged_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    squad_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    billable = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    issue = relationship("Issue", foreign_keys=[issue_id])
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])
    squad = relationship("Team", foreign_keys=[squad_id])
    sprint = relationship("Sprint", foreign_keys=[sprint_id])


class ActiveTimer(Base):
    __tablename__ = "active_timers"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    paused_at = Column(DateTime, nullable=True)
    elapsed_seconds = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="RUNNING", nullable=False) # RUNNING, PAUSED
    work_type = Column(String(50), default="Debugging", nullable=False)
    work_notes = Column(Text, nullable=True)

    issue = relationship("Issue", foreign_keys=[issue_id])
    user = relationship("User", foreign_keys=[user_id])

