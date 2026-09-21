from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_metric = Column(String(255), nullable=True, default="Reduce defects by 30%")
    current_progress = Column(Float, default=0.0) # 0.0 to 100.0
    deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="ON_TRACK") # ON_TRACK, AT_RISK, BEHIND, COMPLETED

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User")
    team = relationship("Team")
    project_links = relationship("GoalProjectLink", back_populates="goal", cascade="all, delete-orphan")

class GoalProjectLink(Base):
    __tablename__ = "goal_project_links"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    goal = relationship("Goal", back_populates="project_links")
    project = relationship("Project")
