import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app, apply_schema_migrations
from app.database.connection import Base, get_db
from app.auth.jwt import create_access_token
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.workspace import Workspace
from app.models.project import Project

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
        org = Organization(
            id=1,
            name="NovaUI Enterprise",
            industry="Software / SaaS",
            plan="Enterprise",
            company_size="100-500",
            country="United States",
            timezone="PST"
        )
        db.add(org)
        db.commit()

    user = db.query(User).filter(User.email == "orgdetailadmin@bugflow.io").first()
    if not user:
        user = User(
            name="Org Detail Admin",
            email="orgdetailadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    ws = db.query(Workspace).filter(Workspace.id == 1).first()
    if not ws:
        ws = Workspace(
            id=1,
            name="Engineering Workspace",
            organization_id=1,
            owner_id=user.id
        )
        db.add(ws)
        db.commit()

    proj = db.query(Project).filter(Project.id == 1).first()
    if not proj:
        proj = Project(
            id=1,
            name="NovaUI Core",
            project_key="NOVA",
            description="Frontend & Core Design System",
            owner_id=user.id,
            workspace_id=1
        )
        db.add(proj)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    db.close()
    return {"Authorization": f"Bearer {token}"}

def test_get_organization_detail_success(auth_headers):
    res = client.get("/api/v1/organizations/1", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "organization" in data
    assert data["organization"]["id"] == 1
    assert "kpis" in data
    assert "total_open_defects" in data["kpis"]
    assert "critical_unresolved" in data["kpis"]
    assert "health_trend_8_weeks" in data
    assert isinstance(data["health_trend_8_weeks"], list)
    assert "departments" in data
    assert "projects" in data
    assert "pinned_documents" in data
    assert "recent_activity" in data

def test_get_organization_detail_not_found(auth_headers):
    res = client.get("/api/v1/organizations/99999", headers=auth_headers)
    assert res.status_code == 404
    assert res.json()["detail"] == "Organization #99999 not found"

def test_get_organization_members(auth_headers):
    res = client.get("/api/v1/organizations/1/members", headers=auth_headers)
    assert res.status_code == 200
    members = res.json()
    assert isinstance(members, list)
    assert len(members) >= 1
    m = members[0]
    assert "id" in m
    assert "name" in m
    assert "role" in m

def test_get_organization_issues(auth_headers):
    res = client.get("/api/v1/organizations/1/issues", headers=auth_headers)
    assert res.status_code == 200
    issues = res.json()
    assert isinstance(issues, list)

def test_post_organization_issue_scoped(auth_headers):
    payload = {
        "title": "Org Scoped Critical Security Vulnerability",
        "description": "Cross-site scripting vulnerability found in org portal dashboard",
        "severity": "Critical",
        "priority": "High",
        "status": "Open",
        "project_id": 1
    }
    res = client.post("/api/v1/organizations/1/issues", json=payload, headers=auth_headers)
    assert res.status_code == 201
    issue = res.json()
    assert issue["title"] == payload["title"]
    assert issue["project_id"] == 1

def test_post_organization_issue_invalid_org(auth_headers):
    payload = {
        "title": "Test Issue",
        "description": "Test description",
        "severity": "Low",
        "priority": "Low",
        "project_id": 1
    }
    res = client.post("/api/v1/organizations/99999/issues", json=payload, headers=auth_headers)
    assert res.status_code == 404
    assert res.json()["detail"] == "Organization #99999 not found"
