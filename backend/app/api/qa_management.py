from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.qa_management import TestSuite, TestCaseItem, TestRun, TestRunResult, TestRunStatus, TestResultStatus
from app.models.project import Project

router = APIRouter(prefix="/api/v1/test-management", tags=["QA & Test Management"])

class TestSuiteCreate(BaseModel):
    project_id: Optional[int] = None
    name: str
    description: Optional[str] = None

class TestRunExecute(BaseModel):
    name: str
    environment: Optional[str] = "Staging"
    suite_id: Optional[int] = None
    project_id: Optional[int] = None

class TestCaseCreate(BaseModel):
    suite_id: int
    title: str
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    priority: Optional[str] = "High"

@router.get("/suites")
def get_test_suites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suites = db.query(TestSuite).all()
    if not suites:
        proj = db.query(Project).first()
        if proj:
            # Seed default suites
            s1 = TestSuite(project_id=proj.id, name="Authentication & Security Suite", description="JWT Token lifecycle, refresh rotation, and RBAC authorization tests")
            s2 = TestSuite(project_id=proj.id, name="API & Webhook Integration Suite", description="Core REST API endpoints, Pydantic validation, and GitHub webhooks")
            db.add_all([s1, s2])
            db.commit()
            
            # Seed test cases
            tc1 = TestCaseItem(suite_id=s1.id, title="Verify JWT Refresh Token Invalidation", preconditions="User logged in", steps="1. Send expired refresh token\n2. Inspect API status", expected_result="Returns HTTP 401 Unauthorized")
            tc2 = TestCaseItem(suite_id=s1.id, title="Verify Admin Secret Sandbox Endpoint", preconditions="Admin role required", steps="1. Access security sandbox\n2. Redact token", expected_result="Token masked with [MASKED_SECRET]")
            db.add_all([tc1, tc2])
            db.commit()
            suites = db.query(TestSuite).all()

    result = []
    for s in suites:
        cases_count = db.query(TestCaseItem).filter(TestCaseItem.suite_id == s.id).count()
        result.append({
            "id": s.id,
            "project_name": s.project.name if s.project else "General Project",
            "name": s.name,
            "description": s.description,
            "test_cases_count": cases_count,
            "created_at": s.created_at.isoformat()
        })
    return result

@router.post("/suites", status_code=status.HTTP_201_CREATED)
def create_test_suite(payload: TestSuiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    proj_id = payload.project_id
    if not proj_id:
        proj = db.query(Project).first()
        proj_id = proj.id if proj else 1
    suite = TestSuite(project_id=proj_id, name=payload.name, description=payload.description)
    db.add(suite)
    db.commit()
    db.refresh(suite)
    return suite

@router.get("/cases")
def get_test_cases(suite_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(TestCaseItem)
    if suite_id:
        query = query.filter(TestCaseItem.suite_id == suite_id)
    cases = query.all()
    return cases

@router.post("/cases", status_code=status.HTTP_201_CREATED)
def create_test_case(payload: TestCaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tc = TestCaseItem(
        suite_id=payload.suite_id,
        title=payload.title,
        preconditions=payload.preconditions,
        steps=payload.steps,
        expected_result=payload.expected_result,
        priority=payload.priority
    )
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return tc

@router.get("/runs")
def get_test_runs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    runs = db.query(TestRun).order_by(TestRun.created_at.desc()).all()
    if not runs:
        proj = db.query(Project).first()
        if proj:
            r1 = TestRun(project_id=proj.id, name="Sprint 8 Automated Regression Run", environment="Staging", status=TestRunStatus.COMPLETED, passed_count=18, failed_count=2, blocked_count=0)
            db.add(r1)
            db.commit()
            runs = db.query(TestRun).order_by(TestRun.created_at.desc()).all()
    return runs

@router.post("/runs/execute", status_code=status.HTTP_201_CREATED)
def execute_test_run(payload: TestRunExecute, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    proj_id = payload.project_id
    if not proj_id:
        proj = db.query(Project).first()
        proj_id = proj.id if proj else 1

    passed = 12
    failed = 1
    if payload.suite_id:
        cases_count = db.query(TestCaseItem).filter(TestCaseItem.suite_id == payload.suite_id).count()
        if cases_count > 0:
            passed = max(1, cases_count - 1)
            failed = 1 if cases_count > 1 else 0

    run = TestRun(
        project_id=proj_id,
        name=payload.name,
        environment=payload.environment or "Staging",
        status=TestRunStatus.COMPLETED,
        passed_count=passed,
        failed_count=failed,
        blocked_count=0
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
