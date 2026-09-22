from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="folder")
    color_theme = Column(String(50), default="#10b981")
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    visibility = Column(String(50), default="Organization") # Private, Organization, Public
    key = Column(String(20), nullable=True)
    workspace_type = Column(String(50), default="Engineering")
    lead_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Active") # Active, On Hold, Archived
    timezone = Column(String(50), default="UTC")
    working_hours = Column(String(100), default="09:00 - 17:00")
    default_sprint_length = Column(Integer, default=14)
    repositories_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization")
    owner = relationship("User", foreign_keys=[owner_id])
    lead = relationship("User", foreign_keys=[lead_id])
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")
