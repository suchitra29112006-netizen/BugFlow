import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace

router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "folder"
    color_theme: Optional[str] = "#10b981"
    visibility: Optional[str] = "Organization"
    organization_id: Optional[int] = 1

class WorkspaceOut(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    icon: Optional[str]
    color_theme: Optional[str]
    visibility: Optional[str]
    projects_count: Optional[int] = 0

    class Config:
        from_attributes = True

@router.get("", response_model=List[WorkspaceOut])
def get_workspaces(
    organization_id: Optional[int] = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspaces = db.query(Workspace).filter(Workspace.organization_id == organization_id).all()
    res = []
    for w in workspaces:
        res.append(WorkspaceOut(
            id=w.id,
            organization_id=w.organization_id,
            name=w.name,
            description=w.description,
            icon=w.icon,
            color_theme=w.color_theme,
            visibility=w.visibility,
            projects_count=len(w.projects) if w.projects else 0
        ))
    return res

@router.post("", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = Workspace(
        organization_id=data.organization_id or 1,
        name=data.name,
        description=data.description,
        icon=data.icon or "folder",
        color_theme=data.color_theme or "#10b981",
        visibility=data.visibility or "Organization",
        owner_id=current_user.id
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return WorkspaceOut(
        id=ws.id,
        organization_id=ws.organization_id,
        name=ws.name,
        description=ws.description,
        icon=ws.icon,
        color_theme=ws.color_theme,
        visibility=ws.visibility,
        projects_count=0
    )

@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    db.delete(ws)
    db.commit()
    return {"message": f"Workspace {workspace_id} deleted successfully"}
