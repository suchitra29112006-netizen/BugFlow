from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database.connection import Base


class RelationshipType(str, enum.Enum):
    DUPLICATE_OF = "Duplicate of"
    SIMILAR_TO = "Similar to"
    REGRESSION_OF = "Regression of"
    CAUSED_BY = "Caused by"
    PARENT_OF = "Parent of"
    CHILD_OF = "Child of"
    REOPENED_FROM = "Reopened from"
    FIXED_BY = "Fixed by"
    RELATED_TO = "Related to"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class FindingStatus(str, enum.Enum):
    OPEN = "Open"
    ACCEPTED_RISK = "Accepted Risk"
    FIXED = "Fixed"
    FALSE_POSITIVE = "False Positive"


class TestCaseStatus(str, enum.Enum):
    NOT_TESTED = "Not Tested"
    PASSED = "Passed"
    FAILED = "Failed"
    BLOCKED = "Blocked"


# Defect DNA / Fingerprint
class DefectFingerprint(Base):
    __tablename__ = "defect_fingerprints"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, unique=True)
    fingerprint_hash = Column(String(100), nullable=False)
    component = Column(String(100), nullable=False, default="General System")
    failure_type = Column(String(100), nullable=False, default="Unhandled Exception")
    environment = Column(String(100), default="Production")
    severity = Column(String(50), default="Medium")
    pattern = Column(Text, nullable=True)
    historical_matches_count = Column(Integer, default=0)
    recurrence_risk_pct = Column(Float, default=15.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", backref="fingerprint")


# Bug Family Tree / Relationships
class DefectRelationship(Base):
    __tablename__ = "defect_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    target_issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(SQLEnum(RelationshipType), nullable=False, default=RelationshipType.RELATED_TO)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_issue = relationship("Issue", foreign_keys=[source_issue_id])
    target_issue = relationship("Issue", foreign_keys=[target_issue_id])


# AI Investigation Workspace
class InvestigationWorkspace(Base):
    __tablename__ = "investigation_workspaces"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, unique=True)
    problem_statement = Column(Text, nullable=False)
    investigation_steps_json = Column(Text, nullable=True) # JSON string list of steps
    human_decision = Column(String(100), default="UNDER_INVESTIGATION")
    decided_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    issue = relationship("Issue", backref="investigation")
    decided_by = relationship("User")


class InvestigationHypothesis(Base):
    __tablename__ = "investigation_hypotheses"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigation_workspaces.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    confidence_pct = Column(Float, default=50.0)
    evidence_json = Column(Text, nullable=True) # JSON list of evidence
    status = Column(String(50), default="PROPOSED") # PROPOSED, CONFIRMED, REJECTED

    investigation = relationship("InvestigationWorkspace", backref="hypotheses")


# Verification Plan & Test Cases
class VerificationPlan(Base):
    __tablename__ = "verification_plans"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, unique=True)
    primary_test_summary = Column(Text, nullable=True)
    fix_confidence_pct = Column(Float, default=85.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", backref="verification_plan")


class VerificationTestCase(Base):
    __tablename__ = "verification_test_cases"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("verification_plans.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    preconditions = Column(Text, nullable=True)
    steps = Column(Text, nullable=True)
    expected_result = Column(Text, nullable=True)
    priority = Column(String(50), default="High")
    regression_risk = Column(String(50), default="Low")
    status = Column(SQLEnum(TestCaseStatus), default=TestCaseStatus.NOT_TESTED)

    plan = relationship("VerificationPlan", backref="test_cases")


# Security Auditor Findings & Audit Anomalies
class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(Integer, primary_key=True, index=True)
    route = Column(String(255), nullable=False)
    method = Column(String(20), nullable=False)
    severity = Column(SQLEnum(FindingSeverity), default=FindingSeverity.MEDIUM)
    category = Column(String(100), nullable=False) # Auth, Authorization, Sensitive Field, Method Risk
    evidence = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    status = Column(SQLEnum(FindingStatus), default=FindingStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)


class SecurityAnomaly(Base):
    __tablename__ = "security_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pattern_name = Column(String(100), nullable=False)
    event_count = Column(Integer, default=1)
    severity = Column(SQLEnum(FindingSeverity), default=FindingSeverity.HIGH)
    evidence = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# AI Audit Trail & Decision History
class AIRecommendationAudit(Base):
    __tablename__ = "ai_recommendation_audits"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_type = Column(String(100), nullable=False) # Risk, Assignment, Triage, Rebalance, Resolution
    target_id = Column(Integer, nullable=False)
    prompt_intent = Column(String(255), nullable=True)
    confidence_pct = Column(Float, default=80.0)
    evidence_json = Column(Text, nullable=True)
    human_decision = Column(String(50), nullable=False, default="ACCEPTED") # ACCEPTED, MODIFIED, REJECTED
    override_reason = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# Incident Management & Postmortem
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), nullable=False, unique=True) # INC-001
    title = Column(String(255), nullable=False)
    severity = Column(SQLEnum(FindingSeverity), default=FindingSeverity.HIGH)
    status = Column(String(50), default="OPEN") # OPEN, INVESTIGATING, RESOLVED
    affected_components = Column(String(255), default="Authentication")
    postmortem_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class PreventiveAction(Base):
    __tablename__ = "preventive_actions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open") # Open, In Progress, Completed, Rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", backref="preventive_actions")
