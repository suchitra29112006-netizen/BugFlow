import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database.connection import Base


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    DEVELOPER = "Developer"
    QA = "QA"
    REPORTER = "Reporter"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.REPORTER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owned_projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    reported_issues = relationship("Issue", foreign_keys="Issue.reporter_id", back_populates="reporter")
    assigned_issues = relationship("Issue", foreign_keys="Issue.assigned_to", back_populates="assignee")
    comments = relationship("Comment", back_populates="user")
