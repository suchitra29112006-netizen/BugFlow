from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    goal = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False) # PLANNED, ACTIVE, COMPLETED, CANCELLED

    planned_story_points = Column(Integer, default=30, nullable=False)
    completed_story_points = Column(Integer, default=0, nullable=False)
    velocity = Column(Float, default=5.0, nullable=False) # Points per day
    team_capacity = Column(Integer, default=40, nullable=False) # Total hours or points
    capacity_utilization = Column(Float, default=85.0, nullable=False) # %

    health_score = Column(Float, default=85.0, nullable=False) # 0-100
    risk_score = Column(Float, default=15.0, nullable=False) # 0-100
    completion_probability = Column(Float, default=85.0, nullable=False) # %
    expected_completion_date = Column(DateTime, nullable=True)
    carryover_issues_count = Column(Integer, default=0, nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sprint_issues = relationship("SprintIssue", back_populates="sprint", cascade="all, delete-orphan")
    objectives = relationship("SprintObjective", back_populates="sprint", cascade="all, delete-orphan")
    retrospectives = relationship("SprintRetrospective", back_populates="sprint", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class SprintIssue(Base):
    __tablename__ = "sprint_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=False)

    sprint = relationship("Sprint", back_populates="sprint_issues")
    issue = relationship("Issue", foreign_keys=[issue_id])
