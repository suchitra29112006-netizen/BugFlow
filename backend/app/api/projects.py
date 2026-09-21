from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.project import Project
from app.models.issue import Issue
from app.models.user import User, UserRole
from app.models.milestone import Milestone
from app.models.document import Document
from app.models.sprint import SprintIssue
from app.models.time_entry import TimeEntry, ActiveTimer
from app.models.sla import SLAEvent
from app.models.assignment_feedback import AssignmentFeedback
from app.models.milestone4_models import (
    DefectFingerprint,
    DefectRelationship,
    InvestigationWorkspace,
    VerificationPlan
)
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.auth.deps import get_current_user, require_roles

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DEVELOPER, UserRole.QA]))
):
    project = Project(
        name=project_in.name,
        description=project_in.description,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    project.issue_count = 0
    return project


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).all()
    res = []
    for proj in projects:
        count = db.query(func.count(Issue.id)).filter(Issue.project_id == proj.id).scalar()
        proj.issue_count = count or 0
        res.append(proj)
    return res


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    count = db.query(func.count(Issue.id)).filter(Issue.project_id == project.id).scalar()
    project.issue_count = count or 0
    return project


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
    if project_in.description is not None:
        project.description = project_in.description
        
    db.commit()
    db.refresh(project)
    count = db.query(func.count(Issue.id)).filter(Issue.project_id == project.id).scalar()
    project.issue_count = count or 0
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # 1. Fetch all issues belonging to this project
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    issue_ids = [i.id for i in issues]

    if issue_ids:
        # Delete dependent M4 & M3 records linked to these issue_ids
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

    # 2. Clean up project-level child tables
    db.query(Milestone).filter(Milestone.project_id == project_id).delete(synchronize_session=False)
    db.query(Document).filter(Document.project_id == project_id).delete(synchronize_session=False)

    db.delete(project)
    db.commit()
    return None

