from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Release(Base):
    __tablename__ = "releases"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(50), nullable=False) # e.g. v2.4.0
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="PLANNING") # PLANNING, IN_PROGRESS, READY, RELEASED
    release_date = Column(DateTime, nullable=True)
    release_notes_ai = Column(Text, nullable=True)
    risk_score = Column(Float, default=12.5) # 0 to 100 risk score
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    deployments = relationship("Deployment", back_populates="release", cascade="all, delete-orphan")

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    release_id = Column(Integer, ForeignKey("releases.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String(100), default="Staging") # Staging, Production
    status = Column(String(50), default="SUCCESS") # SUCCESS, FAILED, IN_PROGRESS, ROLLED_BACK
    deployed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deployed_at = Column(DateTime, default=datetime.utcnow)

    release = relationship("Release", back_populates="deployments")
    deployed_by = relationship("User")
