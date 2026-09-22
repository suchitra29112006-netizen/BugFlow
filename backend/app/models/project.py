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
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Project Lead
    project_type = Column(String(100), default="Software Development")
    status = Column(String(50), default="Active") # Planning, Active, On Hold, Completed, Archived
    priority = Column(String(50), default="Medium") # Low, Medium, High, Critical
    repository_url = Column(String(255), nullable=True)
    environment = Column(String(100), default="Production")
    start_date = Column(DateTime, nullable=True)
    target_date = Column(DateTime, nullable=True)
    visibility = Column(String(50), default="Public") # Public, Private, Workspace
    archived_at = Column(DateTime, nullable=True)
    health = Column(String(50), default="Healthy") # Healthy, At Risk, Critical, No Data
    health_reasons_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="owned_projects")
    workspace = relationship("Workspace", back_populates="projects")
    department = relationship("Department", back_populates="projects")
    boards = relationship("Board", back_populates="project", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan")
    squad_links = relationship("ProjectSquad", back_populates="project", cascade="all, delete-orphan")
    member_links = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")


class ProjectSquad(Base):
    __tablename__ = "project_squads"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="squad_links")
    squad = relationship("Team")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(100), default="Contributor") # Lead, Contributor, QA, Manager
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="member_links")
    user = relationship("User")
