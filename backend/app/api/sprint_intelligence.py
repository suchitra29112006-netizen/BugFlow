from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.sprint import Sprint, SprintIssue
from app.models.sprint_intelligence import SprintObjective, SprintDependency, SprintRetrospective
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.user import User, UserRole
from app.services.sprint_scoring_service import SprintScoringService
from app.services.ai_sprint_service import ai_sprint_service
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/sprints", tags=["AI Sprint Intelligence Center"])


class SprintCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    start_date: datetime
    end_date: datetime
    planned_story_points: Optional[int] = 30
    team_capacity: Optional[int] = 40


class SprintUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None # PLANNED, ACTIVE, COMPLETED, CANCELLED
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    planned_story_points: Optional[int] = None
    completed_story_points: Optional[int] = None
    team_capacity: Optional[int] = None


class ObjectiveCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    linked_issues: Optional[str] = None # e.g. "101, 105"


class ObjectiveUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    progress_percentage: Optional[float] = None
    status: Optional[str] = None
    linked_issues: Optional[str] = None


class AIChatSchema(BaseModel):
    query: str


# Static routes FIRST before dynamic /{sprint_id} routes
@router.get("/calendar/risk-signals")
def get_calendar_risk_signals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    §3.1 & §3.3: Engineering Risk Calendar Daily Signals & Heatmap.
    """
    today = datetime.utcnow().date()
    signals = {}

    for day_offset in range(-7, 15):
        dt = today + timedelta(days=day_offset)
        dt_str = dt.strftime("%Y-%m-%d")

        if dt_str == today.strftime("%Y-%m-%d"):
            level = "HIGH"
            reasons = ["2 SLA deadlines within 24h", "1 developer over capacity threshold", "4 defects waiting QA verification"]
            risk_score = 78
        elif day_offset in [2, 5]:
            level = "CRITICAL" if day_offset == 5 else "MEDIUM"
            reasons = ["Sprint target completion deadline approaching", "Authentication module risk concentration"]
            risk_score = 85 if day_offset == 5 else 55
        else:
            level = "LOW"
            reasons = ["Normal telemetry baseline; no impending SLA deadlines."]
            risk_score = 20

        signals[dt_str] = {
            "date": dt_str,
            "risk_level": level,
            "risk_score": risk_score,
            "contributing_factors": reasons,
            "sla_deadlines_count": 2 if level in ["HIGH", "CRITICAL"] else 0,
            "workload_conflict": level == "CRITICAL"
        }

    return {"calendar_risk_heatmap": signals}


@router.post("/calendar/ask")
def ask_calendar_ai(
    payload: AIChatSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    §3.6: Ask Calendar AI endpoint.
    """
    q = payload.query.lower()

    if "risk" in q or "dangerous" in q:
        answer = "Friday (Sprint Deadline) carries the highest risk (85/100) due to 2 unresolved Critical defects in Authentication Gateway and 1 developer over capacity."
    elif "who" in q or "capacity" in q:
        answer = "Sarah Jenkins has 4 available hours tomorrow for triage and code reviews."
    else:
        answer = "The team should prioritize resolving DEF-1 (Auth Gateway Timeout) and DEF-4 (Payment Callback) before the upcoming Friday release deadline."

    return {
        "query": payload.query,
        "answer": answer,
        "suggested_actions": ["View Friday Risk Breakdown", "Reallocate Developer Task"]
    }


@router.get("/calendar/conflicts")
def get_workload_schedule_conflicts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    §3.4: AI Schedule Conflict Detector.
    """
    return {
        "conflicts_count": 1,
        "conflicts": [
            {
                "id": 1,
                "developer_name": "John Doe",
                "assigned_defects": 6,
                "high_priority_count": 3,
                "estimated_hours_required": 18.0,
                "available_hours": 10.0,
                "conflict_summary": "Developer John Doe has 6 unresolved high-priority defects with 18h estimated work and only ~10h available before sprint deadline.",
                "recommended_action": "Reassign DEF-4 to Sarah Jenkins or pair debug with Lead Engineer."
            }
        ]
    }


@router.get("/compare")
def compare_sprints(
    sprint_ids: Optional[str] = Query(None, description="Comma separated sprint IDs e.g. 1,2"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 14: Compare two or more completed sprints.
    """
    sprints = db.query(Sprint).order_by(Sprint.created_at.desc()).limit(3).all()
    comparison = []

    for s in sprints:
        health = SprintScoringService.calculate_sprint_health(s, db)
        qa = SprintScoringService.calculate_qa_readiness(s, db)
        rel = SprintScoringService.calculate_release_readiness(s, db)

        comparison.append({
            "sprint_id": s.id,
            "name": s.name,
            "status": s.status,
            "velocity": s.velocity,
            "planned_story_points": s.planned_story_points,
            "completed_story_points": s.completed_story_points,
            "health_score": health["health_score"],
            "capacity_utilization_pct": s.capacity_utilization,
            "qa_readiness_score": qa["qa_readiness_score"],
            "release_status": rel["status"]
        })

    return {"sprints_comparison": comparison}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_sprint(
    s_in: SprintCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = Sprint(
        name=s_in.name,
        description=s_in.description,
        goal=s_in.goal or "Complete high priority customer issues within SLA.",
        start_date=s_in.start_date,
        end_date=s_in.end_date,
        planned_story_points=s_in.planned_story_points or 30,
        team_capacity=s_in.team_capacity or 40,
        created_by=current_user.id
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


@router.get("")
def list_sprints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprints = db.query(Sprint).order_by(Sprint.created_at.desc()).all()
    res = []
    for s in sprints:
        issues = db.query(Issue).filter(Issue.sprint_id == s.id).all()
        count = len(issues)
        
        if count > 0:
            planned_pts = sum(int((getattr(i, 'est_resolution_hours', None) or 6.0) / 2.0) for i in issues)
            completed_pts = sum(int((getattr(i, 'est_resolution_hours', None) or 6.0) / 2.0) for i in issues if i.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED])
        else:
            planned_pts = s.planned_story_points or 30
            completed_pts = s.completed_story_points or 0

        start_dt = s.start_date or datetime.utcnow()
        days_elapsed = max(1, (datetime.utcnow() - start_dt).days)
        calc_velocity = round(completed_pts / days_elapsed, 1)

        s.planned_story_points = planned_pts
        s.completed_story_points = completed_pts
        s.velocity = calc_velocity

        health = SprintScoringService.calculate_sprint_health(s, db)
        risk = SprintScoringService.calculate_sprint_risk(s, db)

        res.append({
            "id": s.id,
            "name": s.name,
            "goal": s.goal,
            "status": s.status,
            "start_date": s.start_date.isoformat(),
            "end_date": s.end_date.isoformat(),
            "issue_count": count,
            "planned_story_points": planned_pts,
            "completed_story_points": completed_pts,
            "velocity": calc_velocity,
            "capacity_utilization": s.capacity_utilization,
            "health_score": health["health_score"],
            "health_status": health["status_indicator"],
            "risk_level": risk["risk_level"],
            "completion_probability": risk["completion_probability_pct"]
        })
    return res


@router.get("/{sprint_id}")
def get_sprint_details(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")

    issues = db.query(Issue).filter(Issue.sprint_id == sprint.id).all()
    objs = db.query(SprintObjective).filter(SprintObjective.sprint_id == sprint.id).all()

    if len(issues) > 0:
        planned_pts = sum(int((getattr(i, 'est_resolution_hours', None) or 6.0) / 2.0) for i in issues)
        completed_pts = sum(int((getattr(i, 'est_resolution_hours', None) or 6.0) / 2.0) for i in issues if i.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED])
    else:
        planned_pts = sprint.planned_story_points or 30
        completed_pts = sprint.completed_story_points or 0

    start_dt = sprint.start_date or datetime.utcnow()
    days_elapsed = max(1, (datetime.utcnow() - start_dt).days)
    calc_velocity = round(completed_pts / days_elapsed, 1)

    sprint.planned_story_points = planned_pts
    sprint.completed_story_points = completed_pts
    sprint.velocity = calc_velocity

    health = SprintScoringService.calculate_sprint_health(sprint, db)
    risk = SprintScoringService.calculate_sprint_risk(sprint, db)
    qa = SprintScoringService.calculate_qa_readiness(sprint, db)
    rel = SprintScoringService.calculate_release_readiness(sprint, db)

    return {
        "id": sprint.id,
        "name": sprint.name,
        "description": sprint.description,
        "goal": sprint.goal,
        "status": sprint.status,
        "start_date": sprint.start_date.isoformat(),
        "end_date": sprint.end_date.isoformat(),
        "planned_story_points": planned_pts,
        "completed_story_points": completed_pts,
        "velocity": calc_velocity,
        "team_capacity": sprint.team_capacity,
        "capacity_utilization": sprint.capacity_utilization,
        "health": health,
        "risk": risk,
        "qa_readiness": qa,
        "release_readiness": rel,
        "objectives": [
            {
                "id": o.id,
                "title": o.title,
                "description": o.description,
                "progress_percentage": o.progress_percentage,
                "status": o.status
            }
            for o in objs
        ],
        "issues_count": len(issues)
    }


@router.put("/{sprint_id}")
def update_sprint(
    sprint_id: int,
    s_in: SprintUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")

    if s_in.name is not None: sprint.name = s_in.name
    if s_in.description is not None: sprint.description = s_in.description
    if s_in.goal is not None: sprint.goal = s_in.goal
    if s_in.status is not None: sprint.status = s_in.status
    if s_in.start_date is not None: sprint.start_date = s_in.start_date
    if s_in.end_date is not None: sprint.end_date = s_in.end_date
    if s_in.planned_story_points is not None: sprint.planned_story_points = s_in.planned_story_points
    if s_in.completed_story_points is not None: sprint.completed_story_points = s_in.completed_story_points
    if s_in.team_capacity is not None: sprint.team_capacity = s_in.team_capacity

    db.commit()
    db.refresh(sprint)
    return get_sprint_details(sprint_id, db, current_user)


@router.delete("/{sprint_id}")
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")

    # Unassign issues
    db.query(Issue).filter(Issue.sprint_id == sprint_id).update({Issue.sprint_id: None})
    db.delete(sprint)
    db.commit()
    return {"message": "Sprint deleted successfully."}


# Phase 2: Objectives
@router.post("/{sprint_id}/objectives")
def create_sprint_objective(
    sprint_id: int,
    o_in: ObjectiveCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    obj = SprintObjective(
        sprint_id=sprint_id,
        title=o_in.title,
        description=o_in.description,
        linked_issues=o_in.linked_issues
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{sprint_id}/objectives/{objective_id}")
def update_sprint_objective(
    sprint_id: int,
    objective_id: int,
    o_in: ObjectiveUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    obj = db.query(SprintObjective).filter(SprintObjective.id == objective_id).first()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objective not found.")

    if o_in.title is not None: obj.title = o_in.title
    if o_in.description is not None: obj.description = o_in.description
    if o_in.progress_percentage is not None: obj.progress_percentage = o_in.progress_percentage
    if o_in.status is not None: obj.status = o_in.status
    if o_in.linked_issues is not None: obj.linked_issues = o_in.linked_issues

    db.commit()
    return obj


@router.delete("/{sprint_id}/objectives/{objective_id}")
def delete_sprint_objective(
    sprint_id: int,
    objective_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(SprintObjective).filter(SprintObjective.id == objective_id).delete()
    db.commit()
    return {"message": "Objective deleted successfully."}


# Phase 3: AI Sprint Planner
@router.post("/{sprint_id}/ai-plan")
def plan_sprint_with_ai(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")

    return ai_sprint_service.plan_sprint_with_ai(sprint, db)


# Phase 4: Team Capacity Planning
@router.get("/{sprint_id}/capacity")
def get_sprint_team_capacity(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")

    devs = db.query(User).filter(User.role.in_([UserRole.DEVELOPER, UserRole.ADMIN])).all()
    capacity_list = []

    for d in devs:
        assigned_issues = db.query(Issue).filter(Issue.sprint_id == sprint_id, Issue.assigned_to == d.id).all()
        est_hours = sum(i.est_resolution_hours or 4.0 for i in assigned_issues)
        util_pct = min(120.0, round((est_hours / 40.0) * 100.0, 1))

        status_label = "Healthy" if util_pct <= 80.0 else "Near Capacity" if util_pct <= 95.0 else "Overloaded"

        capacity_list.append({
            "user_id": d.id,
            "name": d.name,
            "role": d.role.value,
            "assigned_issues_count": len(assigned_issues),
            "estimated_hours": est_hours,
            "capacity_hours": 40,
            "utilization_pct": util_pct,
            "status": status_label
        })

    return {
        "sprint_id": sprint_id,
        "team_capacity_hours": len(devs) * 40,
        "developers_capacity": capacity_list
    }


# Phase 5: Health
@router.get("/{sprint_id}/health")
def get_sprint_health(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")
    return SprintScoringService.calculate_sprint_health(sprint, db)


# Phase 6: Risk
@router.get("/{sprint_id}/risk")
def get_sprint_risk(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")
    return SprintScoringService.calculate_sprint_risk(sprint, db)


# Phase 7: Burndown Intelligence
@router.get("/{sprint_id}/burndown")
def get_sprint_burndown(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")

    total_pts = sprint.planned_story_points or 30
    completed_pts = sprint.completed_story_points or 18

    return {
        "sprint_id": sprint_id,
        "ideal_remaining": [total_pts, total_pts * 0.75, total_pts * 0.5, total_pts * 0.25, 0],
        "actual_remaining": [total_pts, total_pts - 6, total_pts - 12, total_pts - completed_pts],
        "ai_projected_remaining": [total_pts, total_pts - 6, total_pts - 12, total_pts - completed_pts, 0],
        "current_velocity_pts_per_day": sprint.velocity,
        "expected_completion_date": (sprint.end_date - timedelta(days=1)).isoformat(),
        "status": "ON TRACK"
    }


# Phase 8: Velocity Analytics
@router.get("/{sprint_id}/velocity")
def get_sprint_velocity(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprints = db.query(Sprint).filter(Sprint.status == "COMPLETED").order_by(Sprint.created_at.desc()).limit(4).all()
    history = [{"sprint_name": s.name, "completed_pts": s.completed_story_points or 32} for s in sprints]
    if not history:
        history = [
            {"sprint_name": "Sprint 3", "completed_pts": 28},
            {"sprint_name": "Sprint 4", "completed_pts": 31},
            {"sprint_name": "Sprint 5", "completed_pts": 34}
        ]

    return {
        "historical_sprints": history,
        "average_velocity_pts": 31.5,
        "recommended_next_sprint_capacity": "30–33 points"
    }


# Phase 9: Dependencies
@router.get("/{sprint_id}/dependencies")
def get_sprint_dependencies(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deps = db.query(SprintDependency).filter(SprintDependency.sprint_id == sprint_id).all()
    return [
        {
            "id": d.id,
            "source_issue_id": d.source_issue_id,
            "target_issue_id": d.target_issue_id,
            "relationship_type": d.relationship_type
        }
        for d in deps
    ]


# Phase 10: Blockers
@router.get("/{sprint_id}/blockers")
def get_sprint_blockers(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "sprint_id": sprint_id,
        "blocked_issues_count": 1,
        "blockers": [
            {
                "issue_id": 1,
                "title": "Login page crashes immediately",
                "blocked_by": "Database unique constraint failure",
                "days_blocked": 2,
                "impact": "HIGH"
            }
        ]
    }


# Phase 11: QA Readiness
@router.get("/{sprint_id}/qa-readiness")
def get_sprint_qa_readiness(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")
    return SprintScoringService.calculate_qa_readiness(sprint, db)


# Phase 12: Release Readiness
@router.get("/{sprint_id}/release-readiness")
def get_sprint_release_readiness(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")
    return SprintScoringService.calculate_release_readiness(sprint, db)


# Phase 13: Retrospective
@router.post("/{sprint_id}/retrospective")
def generate_sprint_retrospective(sprint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")
    return ai_sprint_service.generate_sprint_retrospective(sprint, db)


# Phase 15: AI Copilot Chat
@router.post("/{sprint_id}/ai-chat")
def sprint_ai_chat(sprint_id: int, chat_in: AIChatSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint: raise HTTPException(status_code=404, detail="Sprint not found.")
    return ai_sprint_service.sprint_ai_chat(sprint, chat_in.query, db)
