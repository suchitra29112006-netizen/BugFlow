from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    project_key = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_type = Column(String(100), default="Software Development")
    status = Column(String(50), default="Active") # Planned, Active, On Hold, Completed, Archived
    priority = Column(String(50), default="Medium")
    repository_url = Column(String(255), nullable=True)
    environment = Column(String(100), default="Production")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="owned_projects")
    workspace = relationship("Workspace", back_populates="projects")
    department = relationship("Department")
    boards = relationship("Board", back_populates="project", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan")
