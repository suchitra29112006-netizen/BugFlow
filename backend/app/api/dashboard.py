from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.project import Project
from app.models.user import User, UserRole
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/statistics")
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_issues = db.query(func.count(Issue.id)).scalar() or 0
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    open_bugs = db.query(func.count(Issue.id)).filter(
        Issue.status.in_([IssueStatus.REPORTED, IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
    ).scalar() or 0

    resolved_bugs = db.query(func.count(Issue.id)).filter(
        Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
    ).scalar() or 0

    critical_bugs = db.query(func.count(Issue.id)).filter(
        Issue.severity == IssueSeverity.CRITICAL,
        Issue.status != IssueStatus.CLOSED
    ).scalar() or 0

    # Role specific issue lists & counts
    my_reported_count = db.query(func.count(Issue.id)).filter(Issue.reporter_id == current_user.id).scalar() or 0
    my_assigned_count = db.query(func.count(Issue.id)).filter(Issue.assigned_to == current_user.id).scalar() or 0
    testing_bugs_count = db.query(func.count(Issue.id)).filter(Issue.status.in_([IssueStatus.IN_REVIEW, IssueStatus.RESOLVED, IssueStatus.OPEN])).scalar() or 0

    # Fetch recent issue lists for role tabs
    my_reported_issues = db.query(Issue).filter(Issue.reporter_id == current_user.id).order_by(Issue.created_at.desc()).limit(10).all()
    my_assigned_issues = db.query(Issue).filter(Issue.assigned_to == current_user.id).order_by(Issue.created_at.desc()).limit(10).all()
    testing_issues = db.query(Issue).filter(Issue.status.in_([IssueStatus.IN_REVIEW, IssueStatus.RESOLVED, IssueStatus.OPEN])).order_by(Issue.created_at.desc()).limit(10).all()

    # Severity distribution
    severity_counts = {}
    for sev in IssueSeverity:
        count = db.query(func.count(Issue.id)).filter(Issue.severity == sev).scalar() or 0
        severity_counts[sev.value] = count

    # Status distribution
    status_counts = {}
    for st in IssueStatus:
        count = db.query(func.count(Issue.id)).filter(Issue.status == st).scalar() or 0
        status_counts[st.value] = count

    def format_issue_summary(iss):
        return {
            "id": iss.id,
            "title": iss.title,
            "severity": iss.severity.value,
            "status": iss.status.value,
            "project_name": iss.project.name if iss.project else "General",
            "created_at": iss.created_at
        }

    return {
        "total_issues": total_issues,
        "open_bugs": open_bugs,
        "resolved_bugs": resolved_bugs,
        "critical_bugs": critical_bugs,
        "total_projects": total_projects,
        "total_users": total_users,
        "my_reported_count": my_reported_count,
        "my_assigned_count": my_assigned_count,
        "testing_bugs_count": testing_bugs_count,
        "my_reported_issues": [format_issue_summary(i) for i in my_reported_issues],
        "my_assigned_issues": [format_issue_summary(i) for i in my_assigned_issues],
        "testing_issues": [format_issue_summary(i) for i in testing_issues],
        "severity_distribution": severity_counts,
        "status_distribution": status_counts,
        "user_role": current_user.role.value
    }
