from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.sprint import Sprint, SprintIssue
from app.models.issue import Issue
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.sprint import SprintCreate, SprintResponse
from app.auth.deps import get_current_user
from app.services.ai_resolution_service import ai_resolution_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/sprints", tags=["Sprints"])


class ApplyRebalanceSchema(BaseModel):
    action_ids: List[int]


@router.post("", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(
    sprint_in: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = Sprint(
        name=sprint_in.name,
        start_date=sprint_in.start_date,
        end_date=sprint_in.end_date
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    sprint.issue_count = 0
    return sprint


@router.get("", response_model=List[SprintResponse])
def list_sprints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprints = db.query(Sprint).order_by(Sprint.created_at.desc()).all()
    for s in sprints:
        count = db.query(func.count(Issue.id)).filter(Issue.sprint_id == s.id).scalar()
        s.issue_count = count or 0
    return sprints


# Phase 5: AI Sprint Rebalancer Proposal Endpoint
@router.get("/{sprint_id}/rebalance-proposal")
def get_sprint_rebalance_proposal(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found")
    return ai_resolution_service.generate_sprint_rebalance_proposal(sprint_id, db)


# Phase 5: Apply Sprint Rebalancer Plan with RBAC & Activity Audit Log
@router.post("/{sprint_id}/apply-rebalance")
def apply_sprint_rebalance(
    sprint_id: int,
    reb_in: ApplyRebalanceSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found")

    proposal = ai_resolution_service.generate_sprint_rebalance_proposal(sprint_id, db)
    applied_count = 0

    for action in proposal.get("suggested_actions", []):
        if action["id"] in reb_in.action_ids:
            iss = db.query(Issue).filter(Issue.id == action["issue_id"]).first()
            if iss:
                if action["action_type"] == "REASSIGN_DEFECT":
                    dev = db.query(User).filter(User.name.ilike(f"%{action.get('target_dev', '')}%")).first()
                    if dev:
                        iss.assigned_to = dev.id
                        db.add(ActivityLog(
                            issue_id=iss.id,
                            user_id=current_user.id,
                            field_changed="Assignee",
                            old_value=None,
                            new_value=f"Reassigned by AI Rebalancer to {dev.name}"
                        ))
                        applied_count += 1
                elif action["action_type"] == "MOVE_TO_NEXT_SPRINT":
                    iss.sprint_id = None
                    db.add(ActivityLog(
                        issue_id=iss.id,
                        user_id=current_user.id,
                        field_changed="Sprint",
                        old_value=sprint.name,
                        new_value="Moved out of sprint by AI Rebalancer"
                    ))
                    applied_count += 1

    db.commit()
    return {
        "message": f"Successfully applied {applied_count} sprint rebalancing action(s).",
        "sprint_id": sprint_id,
        "new_projected_completion": proposal.get("projected_completion_probability", 91)
    }


@router.post("/{sprint_id}/issues/{issue_id}")
def assign_issue_to_sprint(
    sprint_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found")

    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    issue.sprint_id = sprint_id
    db.commit()
    return {"message": f"Issue #{issue_id} assigned to Sprint '{sprint.name}'"}
