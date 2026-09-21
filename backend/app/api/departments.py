from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.organization import Department, Organization
from app.models.team import Team
from app.models.issue import Issue, IssueStatus, IssueSeverity

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: Optional[int] = 1

class DepartmentOut(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    squads_count: Optional[int] = 0
    members_count: Optional[int] = 0
    open_bugs: Optional[int] = 0
    critical_bugs: Optional[int] = 0
    health_status: Optional[str] = "HEALTHY"

    class Config:
        from_attributes = True

@router.get("", response_model=List[DepartmentOut])
def get_departments(
    organization_id: Optional[int] = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    depts = db.query(Department).filter(Department.organization_id == organization_id).all()
    if not depts:
        # Create default core departments if none exist
        defaults = [
            Department(organization_id=organization_id, name="Engineering", description="Core software development and microservices architecture."),
            Department(organization_id=organization_id, name="QA & Quality", description="Test management, release verification, and quality assurance."),
            Department(organization_id=organization_id, name="Product & Design", description="Product roadmaps, UX design, and requirements engineering."),
            Department(organization_id=organization_id, name="DevOps & Cloud", description="CI/CD automation, cloud infrastructure, and site reliability.")
        ]
        for d in defaults:
            db.add(d)
        db.commit()
        depts = db.query(Department).filter(Department.organization_id == organization_id).all()

    res = []
    for d in depts:
        squads = db.query(Team).filter(Team.department_id == d.id).all()
        squads_count = len(squads)
        m_count = sum([len(s.members) for s in squads]) if squads else 4
        
        dept_issues = db.query(Issue).filter(
            Issue.team_id.in_([s.id for s in squads]) if squads else Issue.id < 0
        ).filter(Issue.status.in_([IssueStatus.REPORTED, IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS])).all()
        
        open_bugs = len(dept_issues)
        crit_bugs = len([i for i in dept_issues if i.severity == IssueSeverity.CRITICAL])
        health = "HEALTHY" if crit_bugs == 0 else "AT RISK"

        res.append(DepartmentOut(
            id=d.id,
            organization_id=d.organization_id,
            name=d.name,
            description=d.description,
            squads_count=squads_count,
            members_count=m_count,
            open_bugs=open_bugs,
            critical_bugs=crit_bugs,
            health_status=health
        ))
    return res

@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dept = Department(
        organization_id=data.organization_id or 1,
        name=data.name,
        description=data.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentOut(
        id=dept.id,
        organization_id=dept.organization_id,
        name=dept.name,
        description=dept.description,
        squads_count=0,
        members_count=0,
        open_bugs=0,
        critical_bugs=0,
        health_status="HEALTHY"
    )
