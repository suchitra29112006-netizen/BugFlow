import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app, apply_schema_migrations
from app.database.connection import Base, get_db
from app.auth.jwt import create_access_token
from app.models.user import User, UserRole

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
    user = db.query(User).filter(User.email == "testadmin@bugflow.io").first()
    if not user:
        user = User(
            name="Test Org Admin",
            email="testadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    db.close()
    return {"Authorization": f"Bearer {token}"}

def test_organization_wizard_and_switcher(auth_headers):
    # 1. User orgs switcher endpoint
    res = client.get("/api/v1/organizations/user-orgs", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 2. Org creation wizard
    wizard_payload = {
        "name": "Acme SaaS Corporation",
        "description": "Multi-tenant cloud engineering platform",
        "industry": "Software / SaaS",
        "company_size": "201-500",
        "country": "United States",
        "timezone": "PST (Pacific Standard Time)"
    }
    res_wiz = client.post("/api/v1/organizations/wizard", json=wizard_payload, headers=auth_headers)
    assert res_wiz.status_code == 201
    assert res_wiz.json()["success"] is True
    assert res_wiz.json()["organization"]["name"] == "Acme SaaS Corporation"

def test_departments_workspaces_and_boards(auth_headers):
    # Departments
    res_dept = client.get("/api/v1/departments", headers=auth_headers)
    assert res_dept.status_code == 200
    assert len(res_dept.json()) >= 1

    # Workspaces
    ws_payload = {
        "name": "Engineering Core Workspace",
        "description": "Central repository for backend and frontend projects",
        "icon": "layers",
        "color_theme": "#10b981"
    }
    res_ws = client.post("/api/v1/workspaces", json=ws_payload, headers=auth_headers)
    assert res_ws.status_code == 201
    assert res_ws.json()["name"] == "Engineering Core Workspace"

    # Boards for project 1
    res_b = client.get("/api/v1/boards/project/1", headers=auth_headers)
    assert res_b.status_code == 200
    assert len(res_b.json()) >= 1
    assert res_b.json()[0]["board_type"] == "Kanban"

def test_ai_org_intelligence_and_brief(auth_headers):
    # AI Org Config Analysis
    res_ai = client.post("/api/v1/organizations/ai-configure", json={"prompt": "Fintech SaaS startup with 50 devs"}, headers=auth_headers)
    assert res_ai.status_code == 200
    assert "recommended_departments" in res_ai.json()
    assert len(res_ai.json()["recommended_departments"]) >= 2

    # Executive Brief
    res_brief = client.post("/api/v1/organizations/executive-brief", headers=auth_headers)
    assert res_brief.status_code == 200
    assert "executive_summary" in res_brief.json()
    assert "key_metrics" in res_brief.json()
