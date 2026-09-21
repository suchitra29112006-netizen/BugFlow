from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.goal import Goal, GoalProjectLink
from app.models.project import Project

router = APIRouter(prefix="/api/v1/goals", tags=["Goals & OKRs"])

class GoalCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    target_metric: Optional[str] = "Reduce defects by 30%"
    deadline_days: Optional[int] = 30
    project_ids: Optional[List[int]] = []

@router.get("")
def get_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goals = db.query(Goal).all()
    if not goals:
        # Seed initial enterprise goals
        default_goals = [
            Goal(
                title="Zero Production Critical Escapes",
                description="Maintain 0 critical security & data loss defects in production releases",
                target_metric="0 Critical Incidents",
                current_progress=85.0,
                status="ON_TRACK",
                deadline=datetime.utcnow() + timedelta(days=45),
                owner_id=current_user.id
            ),
            Goal(
                title="Sub-4 Hour SLA Triage Efficiency",
                description="Triaging 100% of reported defects within 4 hours using AI Triage Engine",
                target_metric="< 4h Triage SLA",
                current_progress=92.0,
                status="ON_TRACK",
                deadline=datetime.utcnow() + timedelta(days=30),
                owner_id=current_user.id
            ),
            Goal(
                title="Automated Test Coverage > 85%",
                description="Increase unit, integration, and end-to-end regression coverage across all core modules",
                target_metric="> 85% Code Coverage",
                current_progress=68.0,
                status="AT_RISK",
                deadline=datetime.utcnow() + timedelta(days=60),
                owner_id=current_user.id
            )
        ]
        db.add_all(default_goals)
        db.commit()
        goals = db.query(Goal).all()

    result = []
    for g in goals:
        linked_projects = [link.project.name for link in g.project_links if link.project]
        result.append({
            "id": g.id,
            "title": g.title,
            "description": g.description,
            "target_metric": g.target_metric,
            "current_progress": g.current_progress,
            "status": g.status,
            "deadline": g.deadline.isoformat() if g.deadline else None,
            "owner_name": g.owner.name if g.owner else "Unassigned",
            "linked_projects": linked_projects
        })
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deadline = datetime.utcnow() + timedelta(days=payload.deadline_days or 30)
    goal = Goal(
        title=payload.title,
        description=payload.description,
        target_metric=payload.target_metric,
        current_progress=10.0,
        status="ON_TRACK",
        deadline=deadline,
        owner_id=current_user.id
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    if payload.project_ids:
        for pid in payload.project_ids:
            link = GoalProjectLink(goal_id=goal.id, project_id=pid)
            db.add(link)
        db.commit()

    return goal
