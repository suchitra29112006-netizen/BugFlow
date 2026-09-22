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

    user = db.query(User).filter(User.email == "peopleadmin@bugflow.io").first()
    if not user:
        user = User(
            name="Aarav Sharma",
            email="peopleadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "id": user.id, "role": str(user.role.value) if hasattr(user.role, 'value') else str(user.role)})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_get_people_directory(auth_headers):
    response = client.get("/api/v1/people", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    
    first = data[0]
    assert "capacity_hours" in first
    assert "allocated_hours" in first
    assert "available_hours" in first
    assert "utilization_pct" in first
    assert first["status"] in ["AVAILABLE", "OPTIMAL", "AT_RISK", "OVERLOADED"]


def test_get_people_overview(auth_headers):
    response = client.get("/api/v1/people/overview", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "total_members" in data["kpis"]
    assert "avg_allocation_pct" in data["kpis"]
    assert "ai_insights" in data


def test_get_person_workload_drawer(auth_headers):
    people_res = client.get("/api/v1/people", headers=auth_headers).json()
    user_id = people_res[0]["id"]

    response = client.get(f"/api/v1/people/{user_id}/drawer", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "member" in data
    assert "assigned_issues" in data
    assert "sprint_commitments" in data


def test_sync_people_capacity(auth_headers):
    response = client.post("/api/v1/people/sync-capacity", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["synced_members_count"] >= 1


def test_add_member(auth_headers):
    payload = {
        "name": "Vikram Patel",
        "email": "vikram.patel@bugflow.io",
        "role": "Developer",
        "weekly_capacity": 40
    }
    response = client.post("/api/v1/people", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Vikram Patel"
    assert data["email"] == "vikram.patel@bugflow.io"


def test_export_people_workload_csv(auth_headers):
    response = client.get("/api/v1/people/export", headers=auth_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Capacity Hours" in response.text


def test_ai_assignment_match(auth_headers):
    response = client.get("/api/v1/people/ai-assignment-match?required_skill=Python", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "suggested_assignees" in data
