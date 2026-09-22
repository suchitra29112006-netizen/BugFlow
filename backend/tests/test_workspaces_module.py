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
from app.models.issue import Issue, IssueStatus, IssueSeverity

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

    user = db.query(User).filter(User.email == "wsadmin@bugflow.io").first()
    if not user:
        user = User(
            name="Alexander Wright",
            email="wsadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "id": user.id, "role": str(user.role.value) if hasattr(user.role, 'value') else str(user.role)})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_create_workspace(auth_headers):
    payload = {
        "name": "Platform Infrastructure",
        "key": "PLAT",
        "description": "Core Cloud & Infrastructure Engineering Workspace",
        "workspace_type": "Platform",
        "visibility": "Organization",
        "timezone": "UTC",
        "default_sprint_length": 14
    }
    response = client.post("/api/v1/workspaces", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Platform Infrastructure"
    assert data["key"] == "PLAT"
    assert data["workspace_type"] == "Platform"
    assert data["health_status"] in ["Healthy", "At Risk", "Critical"]


def test_get_workspaces_list(auth_headers):
    response = client.get("/api/v1/workspaces?category=Platform", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["workspace_type"] == "Platform"


def test_workspace_sub_routes(auth_headers):
    # First get workspace ID
    ws_res = client.get("/api/v1/workspaces", headers=auth_headers).json()
    ws_id = ws_res[0]["id"]

    # Overview
    res_overview = client.get(f"/api/v1/workspaces/{ws_id}/overview", headers=auth_headers)
    assert res_overview.status_code == 200
    assert "kpis" in res_overview.json()

    # Projects
    res_proj = client.get(f"/api/v1/workspaces/{ws_id}/projects", headers=auth_headers)
    assert res_proj.status_code == 200

    # Teams
    res_teams = client.get(f"/api/v1/workspaces/{ws_id}/teams", headers=auth_headers)
    assert res_teams.status_code == 200

    # Members
    res_members = client.get(f"/api/v1/workspaces/{ws_id}/members", headers=auth_headers)
    assert res_members.status_code == 200

    # Issues
    res_issues = client.get(f"/api/v1/workspaces/{ws_id}/issues", headers=auth_headers)
    assert res_issues.status_code == 200

    # Sprints
    res_sprints = client.get(f"/api/v1/workspaces/{ws_id}/sprints", headers=auth_headers)
    assert res_sprints.status_code == 200

    # Repositories
    res_repos = client.get(f"/api/v1/workspaces/{ws_id}/repositories", headers=auth_headers)
    assert res_repos.status_code == 200

    # Releases
    res_rel = client.get(f"/api/v1/workspaces/{ws_id}/releases", headers=auth_headers)
    assert res_rel.status_code == 200

    # Incidents
    res_inc = client.get(f"/api/v1/workspaces/{ws_id}/incidents", headers=auth_headers)
    assert res_inc.status_code == 200

    # Documents
    res_docs = client.get(f"/api/v1/workspaces/{ws_id}/documents", headers=auth_headers)
    assert res_docs.status_code == 200

    # Analytics
    res_ana = client.get(f"/api/v1/workspaces/{ws_id}/analytics", headers=auth_headers)
    assert res_ana.status_code == 200
    assert "issue_distribution" in res_ana.json()

    # Activity
    res_act = client.get(f"/api/v1/workspaces/{ws_id}/activity", headers=auth_headers)
    assert res_act.status_code == 200


def test_ai_insights_endpoint(auth_headers):
    ws_res = client.get("/api/v1/workspaces", headers=auth_headers).json()
    ws_id = ws_res[0]["id"]

    res_ai = client.post(f"/api/v1/workspaces/{ws_id}/ai-insights", headers=auth_headers)
    assert res_ai.status_code == 200
    data = res_ai.json()
    assert "insights" in data
    assert len(data["insights"]) >= 1


def test_update_workspace(auth_headers):
    ws_res = client.get("/api/v1/workspaces", headers=auth_headers).json()
    ws_id = ws_res[0]["id"]

    res_put = client.put(
        f"/api/v1/workspaces/{ws_id}",
        json={"name": "Platform & Cloud Architecture", "status": "Active"},
        headers=auth_headers
    )
    assert res_put.status_code == 200
    assert res_put.json()["name"] == "Platform & Cloud Architecture"
