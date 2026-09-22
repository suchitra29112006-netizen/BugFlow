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

    user = db.query(User).filter(User.email == "goaladmin@bugflow.io").first()
    if not user:
        user = User(
            name="Alina Vance",
            email="goaladmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "id": user.id, "role": str(user.role.value) if hasattr(user.role, 'value') else str(user.role)})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_get_goals(auth_headers):
    response = client.get("/api/v1/goals", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "goals" in data
    assert data["kpis"]["total_active_objectives"] >= 3
    assert len(data["goals"]) >= 3


def test_get_goal_detail(auth_headers):
    goals_res = client.get("/api/v1/goals", headers=auth_headers).json()
    goal_id = goals_res["goals"][0]["id"]

    response = client.get(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "key_results" in data
    assert "linked_work" in data
    assert "progress_history" in data
    assert "activities" in data


def test_create_goal(auth_headers):
    payload = {
        "title": "Sub-2 Hour Critical Incident Resolution",
        "description": "Resolve all P0/P1 production incidents in under 2 hours",
        "goal_type": "Reliability",
        "time_period": "Q4 2026",
        "deadline_days": 30,
        "key_results": [
            {
                "title": "P0 Incident MTTR < 2 hours",
                "description": "Mean time to resolution for critical outages",
                "metric_type": "DURATION",
                "direction": "LOWER_IS_BETTER",
                "start_value": 5.0,
                "current_value": 2.2,
                "target_value": 2.0,
                "unit": "hours",
                "data_source": "INCIDENTS"
            }
        ]
    }
    response = client.post("/api/v1/goals", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Sub-2 Hour Critical Incident Resolution"
    assert len(data["key_results"]) == 1


def test_manual_key_result_update(auth_headers):
    goals_res = client.get("/api/v1/goals", headers=auth_headers).json()
    goal_id = goals_res["goals"][0]["id"]
    detail = client.get(f"/api/v1/goals/{goal_id}", headers=auth_headers).json()
    kr_id = detail["key_results"][0]["id"]

    update_payload = {
        "current_value": 90.0,
        "update_note": "Increased coverage after adding end-to-end regression tests."
    }
    response = client.post(f"/api/v1/goals/key-results/{kr_id}/manual-update", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


def test_link_entity_to_goal(auth_headers):
    goals_res = client.get("/api/v1/goals", headers=auth_headers).json()
    goal_id = goals_res["goals"][0]["id"]

    link_payload = {
        "entity_type": "PROJECT",
        "entity_id": 1,
        "contribution_weight": 1.0
    }
    response = client.post(f"/api/v1/goals/{goal_id}/links", json=link_payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_ai_risk_insights(auth_headers):
    goals_res = client.get("/api/v1/goals", headers=auth_headers).json()
    goal_id = goals_res["goals"][0]["id"]

    response = client.get(f"/api/v1/goals/{goal_id}/ai-risk-insights", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "risk_factors" in data
    assert "recommended_actions" in data
