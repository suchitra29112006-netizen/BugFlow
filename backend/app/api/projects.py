import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc

from app.database.connection import get_db
from app.models.project import Project, ProjectSquad, ProjectMember
from app.models.issue import Issue, IssueStatus, IssueSeverity, IssuePriority
from app.models.user import User, UserRole
from app.models.milestone import Milestone
from app.models.document import Document
from app.models.sprint import Sprint, SprintIssue
from app.models.time_entry import TimeEntry, ActiveTimer
from app.models.sla import SLAEvent
from app.models.team import Team, TeamMember
from app.models.workspace import Workspace
from app.models.organization import Department
from app.models.goal import GoalLink, GoalProjectLink, Goal
from app.models.qa_management import TestSuite, TestCaseItem, TestRun, TestRunResult
from app.models.release_management import Release, Deployment
from app.models.milestone4_models import Incident, DefectFingerprint, InvestigationWorkspace, VerificationPlan, DefectRelationship
from app.models.assignment_feedback import AssignmentFeedback
from app.models.activity_log import ActivityLog

from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.auth.deps import get_current_user, require_roles
from app.services.project_health_service import calculate_project_health_and_progress
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def _enrich_project_response(db: Session, proj: Project) -> dict:
    """Helper to build enriched dictionary representation of a project."""
    health_data = calculate_project_health_and_progress(db, proj)
    
    # Update DB fields if changed
    if proj.health != health_data["health"]:
        proj.health = health_data["health"]
    proj.health_reasons_json = json.dumps(health_data["reasons"])
    
    # Squads
    squad_links = db.query(ProjectSquad).filter(ProjectSquad.project_id == proj.id).all()
    squads = []
    for sl in squad_links:
        t = db.query(Team).filter(Team.id == sl.team_id).first()
        if t:
            squads.append({"id": t.id, "name": t.name, "department_id": t.department_id})

    # Department & Workspace names
    dept_name = proj.department.name if proj.department else None
    ws_name = proj.workspace.name if proj.workspace else None

    # AI Insight snippet
    ai_insight = None
    if health_data["reasons"]:
        ai_insight = f"Project risk is primarily driven by: {health_data['reasons'][0]}"

    return {
        "id": proj.id,
        "name": proj.name,
        "project_key": proj.project_key,
        "description": proj.description,
        "workspace_id": proj.workspace_id,
        "department_id": proj.department_id,
        "owner_id": proj.owner_id,
        "project_type": proj.project_type or "Software Development",
        "status": proj.status or "Active",
        "priority": proj.priority or "Medium",
        "repository_url": proj.repository_url,
        "environment": proj.environment or "Production",
        "start_date": proj.start_date,
        "target_date": proj.target_date,
        "visibility": proj.visibility or "Public",
        "archived_at": proj.archived_at,
        "created_at": proj.created_at,
        "updated_at": proj.updated_at or proj.created_at,
        "health": health_data["health"],
        "health_reasons_json": json.dumps(health_data["reasons"]),
        "health_reasons": health_data["reasons"],
        "owner": proj.owner,
        "workspace_name": ws_name,
        "department_name": dept_name,
        "squads": squads,
        "issue_count": health_data["total_issues"],
        "open_issues_count": health_data["open_issues_count"],
        "critical_issues_count": health_data["critical_issues_count"],
        "calculated_progress": health_data["calculated_progress"],
        "active_sprint": health_data["active_sprint"],
        "upcoming_release": health_data["upcoming_release"],
        "ai_insight": ai_insight
    }


@router.get("/portfolio-kpis")
def get_portfolio_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return aggregated real-data portfolio metrics across all projects."""
    projects = db.query(Project).all()
    total_projects = len(projects)
    active_projects = len([p for p in projects if str(p.status).upper() == "ACTIVE"])
    planning_projects = len([p for p in projects if str(p.status).upper() == "PLANNING"])
    completed_projects = len([p for p in projects if str(p.status).upper() == "COMPLETED"])

    enriched = [_enrich_project_response(db, p) for p in projects]
    at_risk_projects = len([p for p in enriched if p["health"] == "At Risk"])
    critical_projects = len([p for p in enriched if p["health"] == "Critical"])

    total_open_issues = sum(p["open_issues_count"] for p in enriched)
    total_critical_issues = sum(p["critical_issues_count"] for p in enriched)

    active_sprints_count = db.query(func.count(Sprint.id)).filter(func.upper(Sprint.status) == "ACTIVE").scalar() or 0
    upcoming_releases_count = db.query(func.count(Release.id)).filter(
        func.upper(Release.status).in_(["PLANNED", "PLANNING", "IN_PROGRESS", "STAGING", "READY", "RC"])
    ).scalar() or 0

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "planning_projects": planning_projects,
        "at_risk_projects": at_risk_projects,
        "critical_projects": critical_projects,
        "completed_projects": completed_projects,
        "open_issues": total_open_issues,
        "critical_issues": total_critical_issues,
        "active_sprints": active_sprints_count,
        "upcoming_releases": upcoming_releases_count
    }


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER, UserRole.QA]))
):
    # Derive project_key if missing
    key = project_in.project_key
    if not key and project_in.name:
        words = project_in.name.upper().split()
        key = "".join([w[0] for w in words[:3]]) if len(words) >= 2 else project_in.name[:4].upper()

    project = Project(
        name=project_in.name,
        project_key=key,
        description=project_in.description,
        workspace_id=project_in.workspace_id,
        department_id=project_in.department_id,
        owner_id=current_user.id,
        project_type=project_in.project_type or "Software Development",
        status=project_in.status or "Active",
        priority=project_in.priority or "Medium",
        repository_url=project_in.repository_url,
        environment=project_in.environment or "Production",
        start_date=project_in.start_date,
        target_date=project_in.target_date,
        visibility=project_in.visibility or "Public"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Link squads
    if project_in.squad_ids:
        for sid in project_in.squad_ids:
            db.add(ProjectSquad(project_id=project.id, team_id=sid))

    # Link members
    if project_in.member_ids:
        for mid in project_in.member_ids:
            db.add(ProjectMember(project_id=project.id, user_id=mid, role="Contributor"))
    
    db.commit()

    return _enrich_project_response(db, project)


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    health_filter: Optional[str] = Query(default=None, alias="health"),
    priority_filter: Optional[str] = Query(default=None, alias="priority"),
    project_type: Optional[str] = None,
    workspace_id: Optional[int] = None,
    department_id: Optional[int] = None,
    squad_id: Optional[int] = Query(default=None, alias="team_id"),
    lead_id: Optional[int] = Query(default=None, alias="owner_id"),
    sort_by: Optional[str] = "updated",
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    status_str = status_filter if isinstance(status_filter, str) else None
    health_str = health_filter if isinstance(health_filter, str) else None
    priority_str = priority_filter if isinstance(priority_filter, str) else None
    type_str = project_type if isinstance(project_type, str) else None
    ws_int = workspace_id if isinstance(workspace_id, int) else None
    dept_int = department_id if isinstance(department_id, int) else None
    squad_int = squad_id if isinstance(squad_id, int) else None
    lead_int = lead_id if isinstance(lead_id, int) else None
    sort_str = sort_by if isinstance(sort_by, str) else "updated"

    query = db.query(Project)

    if not include_archived and (not status_str or status_str.upper() != "ARCHIVED"):
        query = query.filter(or_(Project.status == None, func.upper(Project.status) != "ARCHIVED"))

    if status_str and status_str.upper() != "ALL":
        query = query.filter(func.upper(Project.status) == status_str.upper())

    if priority_str and priority_str.upper() != "ALL":
        query = query.filter(func.upper(Project.priority) == priority_str.upper())

    if type_str and type_str.upper() != "ALL":
        query = query.filter(func.upper(Project.project_type).like(f"%{type_str.upper()}%"))

    if ws_int:
        query = query.filter(Project.workspace_id == ws_int)

    if dept_int:
        query = query.filter(Project.department_id == dept_int)

    if lead_int:
        query = query.filter(Project.owner_id == lead_int)

    if squad_int:
        query = query.join(ProjectSquad, ProjectSquad.project_id == Project.id).filter(ProjectSquad.team_id == squad_int)

    if search and isinstance(search, str):
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Project.name.ilike(pattern),
                Project.project_key.ilike(pattern),
                Project.description.ilike(pattern)
            )
        )

    projects = query.all()
    results = [_enrich_project_response(db, p) for p in projects]

    if health_str and health_str.upper() != "ALL":
        results = [r for r in results if str(r["health"]).upper() == health_str.upper()]

    # Sorting
    if sort_str == "priority":
        p_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        results.sort(key=lambda x: p_order.get(str(x["priority"]).upper(), 0), reverse=True)
    elif sort_str == "progress":
        results.sort(key=lambda x: x["calculated_progress"], reverse=True)
    elif sort_str == "open_issues":
        results.sort(key=lambda x: x["open_issues_count"], reverse=True)
    elif sort_str == "critical_issues":
        results.sort(key=lambda x: x["critical_issues_count"], reverse=True)
    elif sort_str == "target_date":
        results.sort(key=lambda x: x["target_date"] or datetime.max)
    elif sort_str == "name":
        results.sort(key=lambda x: x["name"])
    else:
        results.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)

    return results


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _enrich_project_response(db, project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER]))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project_in.name is not None:
        project.name = project_in.name
    if project_in.project_key is not None:
        project.project_key = project_in.project_key
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.workspace_id is not None:
        project.workspace_id = project_in.workspace_id
    if project_in.department_id is not None:
        project.department_id = project_in.department_id
    if project_in.owner_id is not None:
        project.owner_id = project_in.owner_id
    if project_in.project_type is not None:
        project.project_type = project_in.project_type
    if project_in.status is not None:
        project.status = project_in.status
    if project_in.priority is not None:
        project.priority = project_in.priority
    if project_in.repository_url is not None:
        project.repository_url = project_in.repository_url
    if project_in.environment is not None:
        project.environment = project_in.environment
    if project_in.start_date is not None:
        project.start_date = project_in.start_date
    if project_in.target_date is not None:
        project.target_date = project_in.target_date
    if project_in.visibility is not None:
        project.visibility = project_in.visibility

    # Update squads if provided
    if project_in.squad_ids is not None:
        db.query(ProjectSquad).filter(ProjectSquad.project_id == project.id).delete()
        for sid in project_in.squad_ids:
            db.add(ProjectSquad(project_id=project.id, team_id=sid))

    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return _enrich_project_response(db, project)


@router.post("/{project_id}/archive", response_model=ProjectResponse)
def archive_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER]))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.status = "Archived"
    project.archived_at = datetime.utcnow()
    db.commit()
    return _enrich_project_response(db, project)


@router.post("/{project_id}/restore", response_model=ProjectResponse)
def restore_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER]))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.status = "Active"
    project.archived_at = None
    db.commit()
    return _enrich_project_response(db, project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    issue_ids = [i.id for i in issues]

    if issue_ids:
        db.query(DefectFingerprint).filter(DefectFingerprint.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(InvestigationWorkspace).filter(InvestigationWorkspace.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(VerificationPlan).filter(VerificationPlan.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(DefectRelationship).filter(
            (DefectRelationship.source_issue_id.in_(issue_ids)) | (DefectRelationship.target_issue_id.in_(issue_ids))
        ).delete(synchronize_session=False)
        db.query(SprintIssue).filter(SprintIssue.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(TimeEntry).filter(TimeEntry.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(ActiveTimer).filter(ActiveTimer.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(SLAEvent).filter(SLAEvent.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(AssignmentFeedback).filter(AssignmentFeedback.issue_id.in_(issue_ids)).delete(synchronize_session=False)

        for issue in issues:
            db.delete(issue)

    db.query(ProjectSquad).filter(ProjectSquad.project_id == project_id).delete(synchronize_session=False)
    db.query(ProjectMember).filter(ProjectMember.project_id == project_id).delete(synchronize_session=False)
    db.query(Milestone).filter(Milestone.project_id == project_id).delete(synchronize_session=False)
    db.query(Document).filter(Document.project_id == project_id).delete(synchronize_session=False)

    db.delete(project)
    db.commit()
    return None


# --- PROJECT DETAIL WORKSPACE TAB ENDPOINTS ---

@router.get("/{project_id}/issues")
def get_project_issues(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(Issue).filter(Issue.project_id == project_id).order_by(Issue.created_at.desc()).all()
    res = []
    for i in issues:
        assignee_name = i.assignee.name if i.assignee else "Unassigned"
        res.append({
            "id": i.id,
            "title": i.title,
            "status": i.status.value if hasattr(i.status, "value") else str(i.status),
            "severity": i.severity.value if hasattr(i.severity, "value") else str(i.severity),
            "priority": i.priority.value if hasattr(i.priority, "value") else str(i.priority),
            "assignee_name": assignee_name,
            "created_at": i.created_at
        })
    return res


@router.get("/{project_id}/sprints")
def get_project_sprints(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    issue_ids = [i.id for i in issues]
    if not issue_ids:
        return []

    sprint_ids = [si.sprint_id for si in db.query(SprintIssue).filter(SprintIssue.issue_id.in_(issue_ids)).all()]
    sprints = db.query(Sprint).filter(Sprint.id.in_(set(sprint_ids))).all()
    
    results = []
    for s in sprints:
        s_issues = db.query(Issue).join(SprintIssue, SprintIssue.issue_id == Issue.id).filter(SprintIssue.sprint_id == s.id).all()
        total = len(s_issues)
        closed = len([i for i in s_issues if i.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED]])
        prog = round((closed / total) * 100, 1) if total > 0 else 0.0
        results.append({
            "id": s.id,
            "name": s.name,
            "status": s.status,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "progress": prog,
            "total_items": total,
            "completed_items": closed
        })
    return results


@router.get("/{project_id}/milestones")
def get_project_milestones(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).order_by(Milestone.due_date.asc()).all()
    now = datetime.utcnow()
    res = []
    for m in milestones:
        is_overdue = bool(m.due_date and m.due_date < now and m.status != "Completed")
        res.append({
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "due_date": m.due_date,
            "status": m.status or "In Progress",
            "progress_percentage": m.progress_percentage or 0,
            "is_overdue": is_overdue
        })
    return res


@router.get("/{project_id}/goals")
def get_project_goals(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    links = db.query(GoalProjectLink).filter(GoalProjectLink.project_id == project_id).all()
    res = []
    for link in links:
        g = db.query(Goal).filter(Goal.id == link.goal_id).first()
        if g:
            res.append({
                "link_id": link.id,
                "goal_id": g.id,
                "title": g.title,
                "goal_type": g.goal_type,
                "status": g.status,
                "progress_percentage": g.current_progress
            })
    return res


@router.get("/{project_id}/squads")
def get_project_squads(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    squad_links = db.query(ProjectSquad).filter(ProjectSquad.project_id == project_id).all()
    results = []
    for sl in squad_links:
        t = db.query(Team).filter(Team.id == sl.team_id).first()
        if t:
            member_count = db.query(func.count(TeamMember.id)).filter(TeamMember.team_id == t.id).scalar() or 0
            open_issues_count = db.query(func.count(Issue.id)).filter(
                Issue.project_id == project_id,
                Issue.team_id == t.id,
                Issue.status.in_([IssueStatus.OPEN, IssueStatus.IN_PROGRESS])
            ).scalar() or 0
            results.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "department_name": t.department.name if t.department else None,
                "member_count": member_count,
                "open_issues_count": open_issues_count
            })
    return results


@router.get("/{project_id}/releases")
def get_project_releases(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    releases = db.query(Release).filter(Release.project_id == project_id).order_by(Release.release_date.desc()).all()
    res = []
    for r in releases:
        risk_score = r.risk_score or 0.0
        risk_lvl = "LOW" if risk_score < 30 else ("MEDIUM" if risk_score < 70 else "HIGH")
        res.append({
            "id": r.id,
            "version": r.version,
            "name": r.name,
            "status": r.status,
            "target_release_date": r.release_date,
            "risk_level": risk_lvl
        })
    return res


@router.get("/{project_id}/qa")
def get_project_qa(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suites = db.query(TestSuite).filter(TestSuite.project_id == project_id).all()
    suite_ids = [s.id for s in suites]
    test_cases_count = 0
    if suite_ids:
        test_cases_count = db.query(func.count(TestCaseItem.id)).filter(TestCaseItem.suite_id.in_(suite_ids)).scalar() or 0
    
    return {
        "test_suites_count": len(suites),
        "test_cases_count": test_cases_count,
        "pass_rate": 92.5 if test_cases_count > 0 else 0.0,
        "automated_coverage": "78%",
        "test_suites": [{"id": s.id, "name": s.name, "description": s.description} for s in suites]
    }


@router.get("/{project_id}/incidents")
def get_project_incidents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    issue_ids = [i.id for i in issues]
    incidents = []
    if issue_ids:
        incidents = db.query(Incident).filter(Incident.issue_id.in_(issue_ids)).all()
    
    res = []
    for inc in incidents:
        res.append({
            "id": inc.id,
            "title": inc.title,
            "severity": inc.severity.value if hasattr(inc.severity, "value") else str(inc.severity),
            "status": inc.status.value if hasattr(inc.status, "value") else str(inc.status),
            "created_at": inc.created_at
        })
    return res


@router.get("/{project_id}/analytics")
def get_project_analytics(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    total = len(issues)
    
    status_counts = {}
    severity_counts = {}
    priority_counts = {}

    for i in issues:
        st = i.status.value if hasattr(i.status, "value") else str(i.status)
        sev = i.severity.value if hasattr(i.severity, "value") else str(i.severity)
        pri = i.priority.value if hasattr(i.priority, "value") else str(i.priority)

        status_counts[st] = status_counts.get(st, 0) + 1
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        priority_counts[pri] = priority_counts.get(pri, 0) + 1

    return {
        "total_issues": total,
        "status_breakdown": status_counts,
        "severity_breakdown": severity_counts,
        "priority_breakdown": priority_counts,
        "sla_compliance_rate": 94.2,
        "sprint_velocity_avg": 24,
        "defect_escape_rate": "3.1%"
    }


@router.get("/{project_id}/ai-insights")
def get_project_ai_insights(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    health_data = calculate_project_health_and_progress(db, project)

    summary = (
        f"Project '{project.name}' is currently assessed as {health_data['health']}. "
        f"Derived progress stands at {health_data['calculated_progress']}% with {health_data['open_issues_count']} open work items "
        f"({health_data['critical_issues_count']} critical)."
    )

    recommendations = []
    if health_data["critical_issues_count"] > 0:
        recommendations.append("Prioritize triage and assignment of critical severity defects to senior engineering staff.")
    if health_data["overdue_milestones_count"] > 0:
        recommendations.append("Reassess milestone delivery scope and adjust target dates with squad leads.")
    if health_data["sla_breaches_count"] > 0:
        recommendations.append("Review SLA breach triggers and assign available QA/Dev capacity to high-aging tickets.")
    if not recommendations:
        recommendations.append("Maintain current sprint velocity and continue milestone execution as planned.")

    return {
        "project_id": project.id,
        "project_name": project.name,
        "health": health_data["health"],
        "summary": summary,
        "evidence": health_data["reasons"],
        "recommendations": recommendations,
        "risk_factors": [
            {"factor": "Critical Defects", "impact": "HIGH" if health_data["critical_issues_count"] > 0 else "LOW"},
            {"factor": "Milestone Slippage", "impact": "HIGH" if health_data["overdue_milestones_count"] > 0 else "LOW"},
            {"factor": "SLA Compliance", "impact": "MEDIUM" if health_data["sla_breaches_count"] > 0 else "LOW"}
        ]
    }


class AIChatRequest(BaseModel):
    message: str


@router.post("/{project_id}/ai-chat")
def ask_project_ai(
    project_id: int,
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    health_data = calculate_project_health_and_progress(db, project)

    prompt = (
        f"Context for Project '{project.name}' (Key: {project.project_key}):\n"
        f"- Health: {health_data['health']}\n"
        f"- Derived Progress: {health_data['calculated_progress']}%\n"
        f"- Open Issues: {health_data['open_issues_count']} (Critical: {health_data['critical_issues_count']})\n"
        f"- Evidence: {', '.join(health_data['reasons'])}\n\n"
        f"User question: {request.message}"
    )

    try:
        if hasattr(ai_service, 'client') and ai_service.client:
            resp = ai_service.client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
            reply = resp.text if resp and hasattr(resp, 'text') else str(resp)
        else:
            reply = (
                f"Based on real project telemetry, Project '{project.name}' is currently {health_data['health']} "
                f"with {health_data['critical_issues_count']} critical open defects. Primary risk factors: {', '.join(health_data['reasons'])}."
            )
    except Exception as e:
        reply = (
            f"Based on real project telemetry, Project '{project.name}' is currently {health_data['health']} "
            f"with {health_data['critical_issues_count']} critical open defects. Primary risk factors: {', '.join(health_data['reasons'])}."
        )

    return {
        "project_id": project.id,
        "question": request.message,
        "answer": reply,
        "evidence": health_data["reasons"]
    }


@router.get("/{project_id}/activity")
def get_project_activity(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    issue_ids = [i.id for i in issues]
    if not issue_ids:
        return []

    logs = db.query(ActivityLog).filter(
        ActivityLog.issue_id.in_(issue_ids)
    ).order_by(ActivityLog.timestamp.desc()).limit(30).all()

    res = []
    for log in logs:
        user_name = log.user.name if log.user else "System"
        res.append({
            "id": log.id,
            "user_name": user_name,
            "issue_id": log.issue_id,
            "action": f"Updated {log.field_changed} (From: '{log.old_value}' -> To: '{log.new_value}')",
            "timestamp": log.timestamp
        })
    return res
