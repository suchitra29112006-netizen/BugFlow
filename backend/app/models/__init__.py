from app.models.user import User, UserRole
from app.models.organization import Organization, Department
from app.models.workspace import Workspace
from app.models.board import Board
from app.models.team import Team, TeamMember
from app.models.goal import Goal, GoalProjectLink
from app.models.project import Project
from app.models.issue import Issue, IssueSeverity, IssueStatus, IssuePriority, ALLOWED_TRANSITIONS
from app.models.comment import Comment
from app.models.attachment import Attachment
from app.models.sprint import Sprint, SprintIssue
from app.models.activity_log import ActivityLog
from app.models.label import Label
from app.models.notification import Notification
from app.models.milestone import Milestone
from app.models.time_entry import TimeEntry, ActiveTimer
from app.models.sla import SLAPolicy, SLAEvent
from app.models.automation import AutomationRule
from app.models.document import Document
from app.models.developer_profile import DeveloperProfile, DeveloperSkill, DeveloperTechnology, DeveloperCertification
from app.models.issue_intelligence import IssueIntelligence
from app.models.assignment_feedback import AssignmentFeedback
from app.models.user_intelligence import (
    UserProfile, Skill, UserSkill, UserDomain, UserProjectExperience,
    AssignmentRecommendation, AssignmentHistory
)
from app.models.sprint_intelligence import SprintObjective, SprintDependency, SprintRetrospective
from app.models.milestone4_models import (
    DefectFingerprint, DefectRelationship, RelationshipType,
    InvestigationWorkspace, InvestigationHypothesis,
    VerificationPlan, VerificationTestCase, TestCaseStatus,
    SecurityFinding, SecurityAnomaly, FindingSeverity, FindingStatus,
    AIRecommendationAudit, Incident, PreventiveAction
)
from app.models.settings_models import (
    UserPreference, UserAPIKey, UserSession,
    ProjectEscalationContact, ProjectCustomField, ProjectWorkflowConfig,
    SystemAISetting, SystemSMTPSetting, SystemSecurityPolicy
)
from app.models.ask_portal import ExternalRequest
from app.models.qa_management import TestSuite, TestCaseItem, TestRun, TestRunResult, TestRunStatus, TestResultStatus
from app.models.release_management import Release, Deployment
from app.models.knowledge_base import KnowledgeArticle, TechnicalDebtItem
from app.models.health_snapshot import OrganizationHealthSnapshot

__all__ = [
    "User", "UserRole", "Organization", "Department", "Workspace", "Board", "Team", "TeamMember", "Project", "Issue", "IssueSeverity", "IssueStatus", "IssuePriority", "ALLOWED_TRANSITIONS",
    "Comment", "Attachment", "Sprint", "SprintIssue", "ActivityLog", "Label", "Notification",
    "Milestone", "TimeEntry", "ActiveTimer", "SLAPolicy", "SLAEvent", "AutomationRule", "Document",
    "DeveloperProfile", "DeveloperSkill", "DeveloperTechnology", "DeveloperCertification",
    "IssueIntelligence", "AssignmentFeedback",
    "UserProfile", "Skill", "UserSkill", "UserDomain", "UserProjectExperience",
    "AssignmentRecommendation", "AssignmentHistory",
    "SprintObjective", "SprintDependency", "SprintRetrospective",
    "DefectFingerprint", "DefectRelationship", "RelationshipType",
    "InvestigationWorkspace", "InvestigationHypothesis",
    "VerificationPlan", "VerificationTestCase", "TestCaseStatus",
    "SecurityFinding", "SecurityAnomaly", "FindingSeverity", "FindingStatus",
    "AIRecommendationAudit", "Incident", "PreventiveAction",
    "UserPreference", "UserAPIKey", "UserSession",
    "ProjectEscalationContact", "ProjectCustomField", "ProjectWorkflowConfig",
    "SystemAISetting", "SystemSMTPSetting", "SystemSecurityPolicy"
]
