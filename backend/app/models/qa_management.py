from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database.connection import Base

class TestRunStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class TestResultStatus(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"
    NOT_RUN = "NOT_RUN"

class TestSuite(Base):
    __tablename__ = "test_suites"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    test_cases = relationship("TestCaseItem", back_populates="suite", cascade="all, delete-orphan")

class TestCaseItem(Base):
    __tablename__ = "test_case_items"

    id = Column(Integer, primary_key=True, index=True)
    suite_id = Column(Integer, ForeignKey("test_suites.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    preconditions = Column(Text, nullable=True)
    steps = Column(Text, nullable=True)
    expected_result = Column(Text, nullable=True)
    priority = Column(String(50), default="Medium")
    linked_issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    suite = relationship("TestSuite", back_populates="test_cases")
    linked_issue = relationship("Issue")

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    environment = Column(String(100), default="Staging")
    status = Column(SQLEnum(TestRunStatus), default=TestRunStatus.PLANNED)
    executed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    blocked_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    executed_by = relationship("User")
    results = relationship("TestRunResult", back_populates="test_run", cascade="all, delete-orphan")

class TestRunResult(Base):
    __tablename__ = "test_run_results"

    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_case_items.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum(TestResultStatus), default=TestResultStatus.NOT_RUN)
    notes = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)

    test_run = relationship("TestRun", back_populates="results")
    test_case = relationship("TestCaseItem")
