from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class SprintObjective(Base):
    __tablename__ = "sprint_objectives"

    id = Column(Integer, primary_key=True, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    progress_percentage = Column(Float, default=0.0, nullable=False) # 0 to 100%
    status = Column(String(50), default="IN_PROGRESS", nullable=False) # NOT_STARTED, IN_PROGRESS, COMPLETED
    linked_issues = Column(Text, nullable=True) # Comma-separated issue IDs e.g. "101, 105"
    completion_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sprint = relationship("Sprint", back_populates="objectives")


class SprintDependency(Base):
    __tablename__ = "sprint_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=False)
    source_issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False) # Issue that blocks
    target_issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False) # Issue that is blocked
    relationship_type = Column(String(50), default="BLOCKS", nullable=False) # BLOCKS, BLOCKED_BY, DEPENDS_ON, RELATED_TO
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sprint = relationship("Sprint", foreign_keys=[sprint_id])
    source_issue = relationship("Issue", foreign_keys=[source_issue_id])
    target_issue = relationship("Issue", foreign_keys=[target_issue_id])


class SprintRetrospective(Base):
    __tablename__ = "sprint_retrospectives"

    id = Column(Integer, primary_key=True, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=False)
    what_went_well = Column(Text, nullable=False)
    what_didnt_go_well = Column(Text, nullable=False)
    key_problems = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sprint = relationship("Sprint", back_populates="retrospectives")
