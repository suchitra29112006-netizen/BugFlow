import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app, apply_schema_migrations
from app.database.connection import Base, get_db
from app.auth.jwt import create_access_token
from app.models.user import User, UserRole
from app.models.organization import Organization, Department
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.goal import Goal

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
apply_schema_migrations(target_engine=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def auth_headers():
    db = TestingSessionLocal()
    org = db.query(Organization).filter(Organization.id == 1).first()
    if not org:
        org = Organization(id=1, name="NovaTech Engineering")
        db.add(org)
        db.commit()

    user = db.query(User).filter(User.email == "deptadmin@bugflow.io").first()
    if not user:
        user = User(
            name="Priya Sharma",
            email="deptadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    dept = db.query(Department).filter(Department.id == 1).first()
    if not dept:
        dept = Department(
            id=1,
            organization_id=1,
            name="Engineering",
            code="ENG",
            department_type="Engineering",
            description="Core software development and platform engineering.",
            lead_id=user.id,
            status="Active"
        )
        db.add(dept)
        db.commit()

    team = db.query(Team).filter(Team.id == 1).first()
    if not team:
        team = Team(
            id=1,
            name="Backend Engineering",
            organization_id=1,
            department_id=1,
            lead_id=user.id
        )
        db.add(team)
        db.commit()

    proj = db.query(Project).filter(Project.id == 1).first()
    if not proj:
        proj = Project(
            id=1,
            name="Payment Platform",
            project_key="PAY",
            department_id=1,
            owner_id=user.id
        )
        db.add(proj)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    db.close()
    return {"Authorization": f"Bearer {token}"}

def test_get_departments_list(auth_headers):
    res = client.get("/api/v1/departments", headers=auth_headers)
    assert res.status_code == 200
    depts = res.json()
    assert isinstance(depts, list)
    assert len(depts) >= 1
    d = depts[0]
    assert "name" in d
    assert "code" in d
    assert "squads_count" in d
    assert "health_status" in d

def test_create_department(auth_headers):
    payload = {
        "name": "Data & AI Systems",
        "code": "AIDATA",
        "description": "Data pipelines and ML defect triage models",
        "department_type": "Data & AI",
        "timezone": "PST"
    }
    res = client.post("/api/v1/departments", json=payload, headers=auth_headers)
    assert res.status_code == 201
    d = res.json()
    assert d["name"] == payload["name"]
    assert d["code"] == "AIDATA"
    assert d["department_type"] == "Data & AI"

def test_get_department_detail(auth_headers):
    res = client.get("/api/v1/departments/1", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "department" in data
    assert data["department"]["id"] == 1
    assert "kpis" in data
    assert "health_details" in data
    assert "ai_insights" in data
    assert "summary" in data["ai_insights"]

def test_update_department(auth_headers):
    payload = {
        "name": "Core Software Engineering",
        "description": "Updated mandate for software engineering"
    }
    res = client.put("/api/v1/departments/1", json=payload, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["success"] is True

def test_department_squads_and_members(auth_headers):
    # Squads
    res_sq = client.get("/api/v1/departments/1/squads", headers=auth_headers)
    assert res_sq.status_code == 200
    squads = res_sq.json()
    assert isinstance(squads, list)

    sq_payload = {"name": "Frontend Experience Squad", "description": "React & UI component design"}
    res_sq_create = client.post("/api/v1/departments/1/squads", json=sq_payload, headers=auth_headers)
    assert res_sq_create.status_code == 201
    assert res_sq_create.json()["name"] == sq_payload["name"]

    # Members
    res_mem = client.get("/api/v1/departments/1/members", headers=auth_headers)
    assert res_mem.status_code == 200
    members = res_mem.json()
    assert isinstance(members, list)

def test_department_projects_issues_and_goals(auth_headers):
    # Projects
    res_proj = client.get("/api/v1/departments/1/projects", headers=auth_headers)
    assert res_proj.status_code == 200
    assert isinstance(res_proj.json(), list)

    # Issues
    res_iss = client.get("/api/v1/departments/1/issues", headers=auth_headers)
    assert res_iss.status_code == 200
    assert isinstance(res_iss.json(), list)

    # Goals
    res_goals = client.get("/api/v1/departments/1/goals", headers=auth_headers)
    assert res_goals.status_code == 200
    assert isinstance(res_goals.json(), list)

    goal_payload = {"title": "Zero Critical SLA Breaches Q4", "target_metric": "Maintain 100% SLA"}
    res_goal_create = client.post("/api/v1/departments/1/goals", json=goal_payload, headers=auth_headers)
    assert res_goal_create.status_code == 201
    assert res_goal_create.json()["title"] == goal_payload["title"]

def test_department_sla_analytics_activity(auth_headers):
    # SLA
    res_sla = client.get("/api/v1/departments/1/sla", headers=auth_headers)
    assert res_sla.status_code == 200
    assert "sla_policy" in res_sla.json()

    # Analytics
    res_an = client.get("/api/v1/departments/1/analytics", headers=auth_headers)
    assert res_an.status_code == 200
    assert "open_defects_over_time" in res_an.json()

    # Activity
    res_act = client.get("/api/v1/departments/1/activity", headers=auth_headers)
    assert res_act.status_code == 200
    assert isinstance(res_act.json(), list)

def test_archive_department(auth_headers):
    res_arc = client.post("/api/v1/departments/1/archive", headers=auth_headers)
    assert res_arc.status_code == 200
    assert res_arc.json()["success"] is True
