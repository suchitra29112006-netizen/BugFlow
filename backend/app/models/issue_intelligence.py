from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base


class IssueIntelligence(Base):
    __tablename__ = "issue_intelligences"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False, unique=True)
    required_skills = Column(Text, nullable=False) # Stored as comma-separated or JSON string, e.g. "Python, FastAPI, REST API"
    relevant_technologies = Column(Text, nullable=False) # e.g. "PostgreSQL, JWT"
    category = Column(String(100), default="Backend/API", nullable=False)
    complexity = Column(String(50), default="Medium", nullable=False) # Low, Medium, High, Critical
    domain = Column(String(100), default="Authentication", nullable=False)
    estimated_effort_hours = Column(Float, default=4.0, nullable=False)
    required_experience_level = Column(String(50), default="Intermediate", nullable=False) # Junior, Intermediate, Senior, Lead
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", foreign_keys=[issue_id], back_populates="intelligence")
