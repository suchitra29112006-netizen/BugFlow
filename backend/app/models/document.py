from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    document_type = Column(String(100), default="Technical Specification", nullable=False)
    category = Column(String(50), default="ENGINEERING", nullable=False) # PRODUCT, ENGINEERING, QUALITY, DELIVERY, OPERATIONS, KNOWLEDGE, AI
    status = Column(String(50), default="PUBLISHED", nullable=False) # DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    version = Column(String(20), default="v1.0", nullable=False)
    visibility = Column(String(50), default="ORGANIZATION", nullable=False) # ORGANIZATION, WORKSPACE, PROJECT, RESTRICTED
    scope = Column(String(50), default="org", nullable=False)
    file_path = Column(String(500), nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    review_status = Column(String(50), default="APPROVED", nullable=False) # NOT_REQUIRED, PENDING_REVIEW, APPROVED, CHANGES_REQUESTED
    review_comments = Column(Text, nullable=True)
    
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    tags = Column(Text, nullable=True) # Comma-separated tags
    last_reviewed_at = Column(DateTime, nullable=True)
    review_due_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", foreign_keys=[project_id])
    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    department = relationship("Department", foreign_keys=[department_id])
    author = relationship("User", foreign_keys=[author_id])
    owner = relationship("User", foreign_keys=[owner_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    creator = relationship("User", foreign_keys=[created_by])

    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    relations = relationship("DocumentRelation", back_populates="document", cascade="all, delete-orphan")
    comments = relationship("DocumentComment", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="versions")
    author = relationship("User")


class DocumentRelation(Base):
    __tablename__ = "document_relations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(50), nullable=False) # PROJECT, WORKSPACE, DEPARTMENT, SQUAD, GOAL, SPRINT, MILESTONE, ISSUE, TASK, RELEASE, INCIDENT, QA
    entity_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="relations")


class DocumentComment(Base):
    __tablename__ = "document_comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="comments")
    author = relationship("User")
