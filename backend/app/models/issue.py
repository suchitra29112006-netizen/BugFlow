import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.models.label import issue_labels


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


ALLOWED_TRANSITIONS = {
    IssueStatus.REPORTED: {IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.CLOSED},
    IssueStatus.OPEN: {IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.CLOSED},
    IssueStatus.ASSIGNED: {IssueStatus.IN_PROGRESS, IssueStatus.OPEN, IssueStatus.IN_REVIEW},
    IssueStatus.IN_PROGRESS: {IssueStatus.IN_REVIEW, IssueStatus.OPEN, IssueStatus.ASSIGNED},
    IssueStatus.IN_REVIEW: {IssueStatus.RESOLVED, IssueStatus.IN_PROGRESS},
    IssueStatus.RESOLVED: {IssueStatus.CLOSED, IssueStatus.IN_PROGRESS, IssueStatus.OPEN},
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
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=True)
    due_date = Column(DateTime, nullable=True)

    # Enterprise Work Management Fields
    work_item_type = Column(String(50), default="BUG", nullable=False) # BUG, TASK, FEATURE, IMPROVEMENT, RESEARCH, REQUEST, INCIDENT
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    parent_task_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    blocked_by_issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)

    # Advanced Fields
    start_date = Column(DateTime, nullable=True)
    custom_fields_json = Column(Text, nullable=True)
    pr_url = Column(String(500), nullable=True)
    is_regression = Column(Boolean, default=False, nullable=False)
    reopen_count = Column(Integer, default=0, nullable=False)
    est_resolution_hours = Column(Float, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    verification_checklist = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_issues")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_issues")
    project = relationship("Project", back_populates="issues")
    workspace = relationship("Workspace")
    board = relationship("Board", back_populates="issues")
    sprint = relationship("Sprint", foreign_keys=[sprint_id])
    milestone = relationship("Milestone", foreign_keys=[milestone_id], back_populates="issues")
    parent_task = relationship("Issue", remote_side=[id], foreign_keys=[parent_task_id])
    blocked_by_issue = relationship("Issue", remote_side=[id], foreign_keys=[blocked_by_issue_id])
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="issue", cascade="all, delete-orphan")
    labels = relationship("Label", secondary=issue_labels, back_populates="issues")
    activity_logs = relationship("ActivityLog", back_populates="issue", cascade="all, delete-orphan")
    intelligence = relationship("IssueIntelligence", back_populates="issue", uselist=False, cascade="all, delete-orphan")
