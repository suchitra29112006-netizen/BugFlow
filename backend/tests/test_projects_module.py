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
    org = db.query(Organization).first()
    if not org:
        org = Organization(id=1, name="NovaTech Engineering")
        db.add(org)
        db.commit()

    user = db.query(User).first()
    if not user:
        user = User(
            name="Sarah Jenkins",
            email="projectadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "id": user.id, "role": str(user.role.value) if hasattr(user.role, 'value') else str(user.role)})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_portfolio_kpis(auth_headers):
    response = client.get("/api/projects/portfolio-kpis", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_projects" in data
    assert "active_projects" in data
    assert "open_issues" in data


def test_create_and_get_project(auth_headers):
    payload = {
        "name": "AI Defect Intelligence Unit",
        "project_key": "AIDEV",
        "description": "AI-driven defect triage and reproduction.",
        "project_type": "Data & AI",
        "priority": "High",
        "status": "Active"
    }
    create_res = client.post("/api/projects", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    proj = create_res.json()
    assert proj["name"] == "AI Defect Intelligence Unit"
    assert proj["project_key"] == "AIDEV"
    assert proj["health"] in ["Healthy", "At Risk", "Critical", "No Data"]

    get_res = client.get(f"/api/projects/{proj['id']}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == proj["id"]


def test_project_archive_and_restore(auth_headers):
    payload = {
        "name": "Legacy Billing Platform",
        "project_key": "LBP",
        "description": "Legacy billing system scheduled for deprecation."
    }
    proj = client.post("/api/projects", json=payload, headers=auth_headers).json()

    # Archive
    arch_res = client.post(f"/api/projects/{proj['id']}/archive", headers=auth_headers)
    assert arch_res.status_code == 200
    assert arch_res.json()["status"] == "Archived"

    # Verify not in default list
    list_res = client.get("/api/projects", headers=auth_headers)
    assert not any(p["id"] == proj["id"] for p in list_res.json())

    # Verify in include_archived list
    arch_list_res = client.get("/api/projects?include_archived=true", headers=auth_headers)
    assert any(p["id"] == proj["id"] for p in arch_list_res.json())

    # Restore
    rest_res = client.post(f"/api/projects/{proj['id']}/restore", headers=auth_headers)
    assert rest_res.status_code == 200
    assert rest_res.json()["status"] == "Active"


def test_project_detail_workspace_tabs(auth_headers):
    proj = client.post("/api/projects", json={"name": "Payment Gateway v2", "project_key": "PAY2"}, headers=auth_headers).json()
    pid = proj["id"]

    assert client.get(f"/api/projects/{pid}/issues", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/sprints", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/milestones", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/goals", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/squads", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/releases", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/qa", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/incidents", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/analytics", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/ai-insights", headers=auth_headers).status_code == 200
    assert client.get(f"/api/projects/{pid}/activity", headers=auth_headers).status_code == 200


def test_project_ai_chat(auth_headers):
    proj = client.post("/api/projects", json={"name": "Security & Compliance Shield", "project_key": "SEC"}, headers=auth_headers).json()
    pid = proj["id"]

    res = client.post(f"/api/projects/{pid}/ai-chat", json={"message": "What is driving project risk?"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "evidence" in data
