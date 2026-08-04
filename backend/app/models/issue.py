import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.connection import Base


class IssueSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class IssuePriority(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class IssueStatus(str, enum.Enum):
    REPORTED = "Reported"
    OPEN = "Open"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


# Allowed state transitions matrix according to BugFlow rules
ALLOWED_TRANSITIONS = {
    IssueStatus.REPORTED: {IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.CLOSED},
    IssueStatus.OPEN: {IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.CLOSED},
    IssueStatus.ASSIGNED: {IssueStatus.IN_PROGRESS, IssueStatus.OPEN, IssueStatus.IN_REVIEW},
    IssueStatus.IN_PROGRESS: {IssueStatus.IN_REVIEW, IssueStatus.OPEN, IssueStatus.ASSIGNED},
    IssueStatus.IN_REVIEW: {IssueStatus.RESOLVED, IssueStatus.IN_PROGRESS},
    IssueStatus.RESOLVED: {IssueStatus.CLOSED, IssueStatus.IN_PROGRESS},
    IssueStatus.CLOSED: {IssueStatus.OPEN},
}


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(Enum(IssueSeverity), default=IssueSeverity.MEDIUM, nullable=False)
    status = Column(Enum(IssueStatus), default=IssueStatus.REPORTED, nullable=False)
    priority = Column(Enum(IssuePriority), default=IssuePriority.MEDIUM, nullable=False)
    
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_issues")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_issues")
    project = relationship("Project", back_populates="issues")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="issue", cascade="all, delete-orphan")
