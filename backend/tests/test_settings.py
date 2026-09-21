import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.connection import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_settings_bugflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def get_auth_headers(email="dev@bugflow.io", password="dev123", role="Developer"):
    client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "name": "Test User",
        "role": role
    })
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_settings_profile_and_password():
    headers = get_auth_headers()
    
    # Get profile
    res = client.get("/api/settings/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "role" in data
    assert "project_memberships" in data

    # Update profile
    update_res = client.put("/api/settings/profile", json={"name": "Updated Test User"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["user"]["name"] == "Updated Test User"


def test_settings_preferences():
    headers = get_auth_headers()

    # Get initial preferences
    get_res = client.get("/api/settings/preferences", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "notification_settings" in data

    # Update preferences
    payload = {
        "appearance": {"theme": "dark", "density": "compact"},
        "default_views": {"landing_page": "issues", "issue_view": "kanban"}
    }
    put_res = client.put("/api/settings/preferences", json=payload, headers=headers)
    assert put_res.status_code == 200


def test_api_keys_and_sessions():
    headers = get_auth_headers()

    # List sessions
    sess_res = client.get("/api/settings/sessions", headers=headers)
    assert sess_res.status_code == 200

    # Create API key
    key_res = client.post("/api/settings/api-keys", json={"name": "CI Token", "expires_in_days": 15}, headers=headers)
    assert key_res.status_code == 200
    key_data = key_res.json()
    assert "raw_token" in key_data
    assert key_data["raw_token"].startswith("bgf_live_")

    # List API keys (raw_token should NOT be returned)
    list_keys_res = client.get("/api/settings/api-keys", headers=headers)
    assert list_keys_res.status_code == 200
    keys_list = list_keys_res.json()
    assert len(keys_list) >= 1
    assert "raw_token" not in keys_list[0]


def test_ai_settings_and_admin_endpoints():
    admin_headers = get_auth_headers(email="admin@bugflow.io", password="admin123", role="Admin")

    # Get AI settings
    ai_res = client.get("/api/settings/ai", headers=admin_headers)
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert "provider" in ai_data
    assert "feature_toggles" in ai_data

    # Admin health check
    health_res = client.get("/api/settings/admin/health", headers=admin_headers)
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "Healthy"
