from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base

class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Architecture") # Architecture, API Docs, Coding Standards, Troubleshooting, Security
    content_markdown = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tags = Column(String(255), nullable=True) # comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User")

class TechnicalDebtItem(Base):
    __tablename__ = "technical_debt_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    module = Column(String(100), nullable=False) # e.g. Authentication, Database Pool, Payment API
    description = Column(Text, nullable=False)
    impact_score = Column(Float, default=45.0) # 0 to 100 impact score
    estimated_effort_hours = Column(Float, default=16.0)
    status = Column(String(50), default="IDENTIFIED") # IDENTIFIED, IN_REFACTOR, RESOLVED
    related_issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    related_issue = relationship("Issue")
