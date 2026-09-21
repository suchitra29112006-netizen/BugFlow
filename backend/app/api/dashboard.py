from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.project import Project
from app.models.user import User, UserRole
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Metrics"])


@router.get("/statistics")
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_issues = db.query(func.count(Issue.id)).scalar() or 0
    open_bugs = db.query(func.count(Issue.id)).filter(Issue.status.in_([IssueStatus.REPORTED, IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS])).scalar() or 0
    resolved_bugs = db.query(func.count(Issue.id)).filter(Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])).scalar() or 0
    critical_bugs = db.query(func.count(Issue.id)).filter(Issue.severity == IssueSeverity.CRITICAL).scalar() or 0
    
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Severity distribution
    sev_counts = db.query(Issue.severity, func.count(Issue.id)).group_by(Issue.severity).all()
    sev_dict = {sev.value: count for sev, count in sev_counts}
    for s in IssueSeverity:
        if s.value not in sev_dict:
            sev_dict[s.value] = 0

    # Status distribution
    st_counts = db.query(Issue.status, func.count(Issue.id)).group_by(Issue.status).all()
    st_dict = {st.value: count for st, count in st_counts}
    for st in IssueStatus:
        if st.value not in st_dict:
            st_dict[st.value] = 0

    # Role-specific counts
    my_reported = db.query(Issue).filter(Issue.reporter_id == current_user.id).order_by(Issue.created_at.desc()).limit(5).all()
    my_assigned = db.query(Issue).filter(Issue.assigned_to == current_user.id).order_by(Issue.created_at.desc()).limit(5).all()
    testing_issues = db.query(Issue).filter(Issue.status == IssueStatus.IN_REVIEW).order_by(Issue.created_at.desc()).limit(5).all()

    return {
        "user_role": current_user.role.value,
        "total_issues": total_issues,
        "open_bugs": open_bugs,
        "resolved_bugs": resolved_bugs,
        "critical_bugs": critical_bugs,
        "total_projects": total_projects,
        "total_users": total_users,
        "severity_distribution": sev_dict,
        "status_distribution": st_dict,
        "my_reported_count": len(my_reported),
        "my_assigned_count": len(my_assigned),
        "testing_bugs_count": len(testing_issues),
        "my_reported_issues": my_reported,
        "my_assigned_issues": my_assigned,
        "testing_issues": testing_issues
    }


@router.get("/workload-heatmap")
def get_team_workload_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns assigned active bug count per developer for workload balancing."""
    devs = db.query(User).filter(User.role.in_([UserRole.DEVELOPER, UserRole.ADMIN])).all()
    heatmap = []

    for dev in devs:
        active_count = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == dev.id,
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW])
        ).scalar() or 0

        resolved_count = db.query(func.count(Issue.id)).filter(
            Issue.assigned_to == dev.id,
            Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
        ).scalar() or 0

        heatmap.append({
            "developer_id": dev.id,
            "developer_name": dev.name,
            "role": dev.role.value,
            "active_assigned_bugs": active_count,
            "resolved_bugs": resolved_count,
            "workload_level": "High" if active_count >= 5 else "Medium" if active_count >= 2 else "Optimal"
        })

    return heatmap


@router.get("/gamification")
def get_gamification_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns developer resolution streak and gamification badges."""
    resolved_count = db.query(func.count(Issue.id)).filter(
        Issue.assigned_to == current_user.id,
        Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
    ).scalar() or 0

    critical_resolved = db.query(func.count(Issue.id)).filter(
        Issue.assigned_to == current_user.id,
        Issue.severity == IssueSeverity.CRITICAL,
        Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])
    ).scalar() or 0

    badges = []
    if resolved_count >= 1:
        badges.append({"name": "First Blood 🩸", "description": "Resolved your first software bug!"})
    if resolved_count >= 5:
        badges.append({"name": "Bug Smasher 🏆", "description": "Successfully resolved 5+ defects."})
    if resolved_count >= 10:
        badges.append({"name": "Code Legend 🌟", "description": "Master engineer with 10+ fixes."})
    if critical_resolved >= 1:
        badges.append({"name": "Critical Defender 🛡️", "description": "Resolved a Critical system outage defect."})

    return {
        "user_name": current_user.name,
        "resolved_count": resolved_count,
        "critical_resolved": critical_resolved,
        "badges": badges
    }
