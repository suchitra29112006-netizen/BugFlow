from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.project import Project
from app.models.issue import Issue, IssueStatus, IssueSeverity, IssuePriority
from app.models.milestone import Milestone
from app.models.sprint import Sprint, SprintIssue
from app.models.release_management import Release
from app.models.sla import SLAEvent


def calculate_project_health_and_progress(db: Session, project: Project) -> Dict[str, Any]:
    """
    Centralized health calculation service that evaluates actual operational signals
    for a project:
      - Open critical & high severity defects
      - Overdue milestones
      - Active sprint trajectory & completion
      - SLA breach events
      - Upcoming release blockers
    Calculates derived progress and human-readable evidence reasons.
    """
    # 1. Issues Analysis
    issues = db.query(Issue).filter(Issue.project_id == project.id).all()
    total_issues = len(issues)
    
    if total_issues == 0:
        return {
            "health": "No Data",
            "reasons": ["No work items or issues are linked to this project."],
            "calculated_progress": 0.0,
            "total_issues": 0,
            "open_issues_count": 0,
            "critical_issues_count": 0,
            "sla_breaches_count": 0,
            "overdue_milestones_count": 0,
            "active_sprint": None,
            "upcoming_release": None
        }

    open_statuses = [IssueStatus.REPORTED, IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW]
    closed_statuses = [IssueStatus.RESOLVED, IssueStatus.CLOSED]

    open_issues = [i for i in issues if i.status in open_statuses]
    closed_issues = [i for i in issues if i.status in closed_statuses]

    open_issues_count = len(open_issues)
    closed_issues_count = len(closed_issues)

    critical_issues = [
        i for i in open_issues 
        if i.severity == IssueSeverity.CRITICAL or i.priority == IssuePriority.CRITICAL
    ]
    critical_issues_count = len(critical_issues)

    # 2. Derived Project Progress
    calculated_progress = round((closed_issues_count / total_issues) * 100, 1) if total_issues > 0 else 0.0

    # 3. Milestones Analysis
    now = datetime.utcnow()
    milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
    total_milestones = len(milestones)
    overdue_milestones = [m for m in milestones if m.due_date and m.due_date < now and m.status != "Completed"]
    overdue_milestones_count = len(overdue_milestones)

    # 4. Active Sprint Analysis
    issue_ids = [i.id for i in issues]
    active_sprint = None
    sprint_progress = 0.0
    sprint_at_risk = False
    
    if issue_ids:
        sprint_issue = db.query(SprintIssue).filter(SprintIssue.issue_id.in_(issue_ids)).first()
        if sprint_issue:
            sprint = db.query(Sprint).filter(Sprint.id == sprint_issue.sprint_id, Sprint.status == "ACTIVE").first()
            if sprint:
                # Calculate sprint progress
                s_issues = db.query(Issue).join(SprintIssue, SprintIssue.issue_id == Issue.id).filter(SprintIssue.sprint_id == sprint.id).all()
                s_total = len(s_issues)
                s_closed = len([i for i in s_issues if i.status in closed_statuses])
                sprint_progress = round((s_closed / s_total) * 100, 1) if s_total > 0 else 0.0
                active_sprint = {
                    "id": sprint.id,
                    "name": sprint.name,
                    "status": sprint.status,
                    "progress": sprint_progress
                }
                # Check trajectory: if sprint target end is close (< 3 days) and progress < 60%
                if sprint.end_date:
                    days_left = (sprint.end_date - now).days
                    if days_left <= 3 and sprint_progress < 60.0:
                        sprint_at_risk = True

    # 5. SLA Breaches
    sla_breaches_count = 0
    if issue_ids:
        sla_breaches_count = db.query(func.count(SLAEvent.id)).filter(
            SLAEvent.issue_id.in_(issue_ids),
            SLAEvent.is_breached == True
        ).scalar() or 0

    # 6. Releases
    upcoming_release = db.query(Release).filter(
        Release.project_id == project.id,
        Release.status.in_(["PLANNING", "IN_PROGRESS", "STAGING", "READY", "RC"])
    ).order_by(Release.release_date.asc()).first()
    
    release_blockers_count = 0
    if upcoming_release:
        # Check critical issues assigned to release or project
        release_blockers_count = critical_issues_count

    # 7. Evaluate Health & Reasons
    reasons = []
    health = "Healthy"

    if critical_issues_count >= 3:
        health = "Critical"
        reasons.append(f"{critical_issues_count} critical open defects require immediate triage.")
    elif critical_issues_count > 0:
        health = "At Risk"
        reasons.append(f"{critical_issues_count} critical defect remains unresolved.")

    if overdue_milestones_count > 0:
        if health != "Critical":
            health = "At Risk"
        reasons.append(f"{overdue_milestones_count} milestone items are overdue.")

    if sprint_at_risk:
        if health != "Critical":
            health = "At Risk"
        reasons.append(f"Active sprint '{active_sprint['name']}' is falling behind expected trajectory ({sprint_progress}%).")

    if sla_breaches_count > 0:
        if health != "Critical":
            health = "At Risk"
        reasons.append(f"{sla_breaches_count} SLA compliance breaches unresolved.")

    if release_blockers_count > 0 and upcoming_release:
        reasons.append(f"Upcoming release '{upcoming_release.version}' has open blocker defects.")

    if not reasons:
        reasons.append("All project operational indicators, milestone timelines, and sprint progress are on track.")

    return {
        "health": health,
        "reasons": reasons,
        "calculated_progress": calculated_progress,
        "total_issues": total_issues,
        "open_issues_count": open_issues_count,
        "critical_issues_count": critical_issues_count,
        "sla_breaches_count": sla_breaches_count,
        "overdue_milestones_count": overdue_milestones_count,
        "active_sprint": active_sprint,
        "upcoming_release": {
            "id": upcoming_release.id,
            "version": upcoming_release.version,
            "name": upcoming_release.name,
            "target_date": upcoming_release.release_date,
            "status": upcoming_release.status
        } if upcoming_release else None
    }
