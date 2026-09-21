from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), default="Requirements", nullable=False) # Requirements, Test Reports, Release Notes, API Docs
    content = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    scope = Column(String(50), default="org", nullable=False) # org, project
    is_pinned = Column(Boolean, default=False, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", foreign_keys=[project_id])
    author = relationship("User", foreign_keys=[created_by])
