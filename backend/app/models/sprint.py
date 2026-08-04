from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sprint_issues = relationship("SprintIssue", back_populates="sprint", cascade="all, delete-orphan")


class SprintIssue(Base):
    __tablename__ = "sprint_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=False)

    sprint = relationship("Sprint", back_populates="sprint_issues")
