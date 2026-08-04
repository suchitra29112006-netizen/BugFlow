import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.connection import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_bugflow.db"
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
    Base.metadata.drop_all(bind=engine)


def test_auth_register_and_login():
    # 1. Register
    reg_resp = client.post("/api/auth/register", json={
        "name": "Test QA",
        "email": "testqa@bugflow.io",
        "password": "secretpassword",
        "role": "QA"
    })
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    assert user_data["email"] == "testqa@bugflow.io"
    assert user_data["role"] == "QA"

    # 2. Login
    login_resp = client.post("/api/auth/login", json={
        "email": "testqa@bugflow.io",
        "password": "secretpassword"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 3. Access /me protected route
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "testqa@bugflow.io"


def test_project_and_issue_workflow():
    # Register Admin User
    reg_resp = client.post("/api/auth/register", json={
        "name": "Admin User",
        "email": "admin_test@bugflow.io",
        "password": "password123",
        "role": "Admin"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "admin_test@bugflow.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Project
    proj_resp = client.post("/api/projects", json={
        "name": "E-Commerce App",
        "description": "Online storefront platform."
    }, headers=headers)
    assert proj_resp.status_code == 201
    proj_id = proj_resp.json()["id"]

    # Create Issue
    issue_resp = client.post("/api/issues", json={
        "title": "Checkout button disabled",
        "description": "Cart items present but checkout button is grayed out.",
        "severity": "High",
        "priority": "High",
        "project_id": proj_id
    }, headers=headers)
    assert issue_resp.status_code == 201
    issue = issue_resp.json()
    assert issue["status"] == "Reported"
    issue_id = issue["id"]

    # Valid Status Transition: Reported -> Open
    update_resp = client.put(f"/api/issues/{issue_id}", json={
        "status": "Open"
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "Open"

    # Invalid Status Transition: Open -> Resolved (direct jump without In Progress/In Review)
    invalid_resp = client.put(f"/api/issues/{issue_id}", json={
        "status": "Resolved"
    }, headers=headers)
    assert invalid_resp.status_code == 400
    assert "Invalid state transition" in invalid_resp.json()["detail"]


def test_ai_bug_report_generator():
    login_resp = client.post("/api/auth/register", json={
        "name": "AI Tester",
        "email": "aitester@bugflow.io",
        "password": "password123",
        "role": "Reporter"
    })
    tok = client.post("/api/auth/login", json={
        "email": "aitester@bugflow.io",
        "password": "password123"
    }).json()["access_token"]

    ai_resp = client.post("/api/ai/generate-report", json={
        "user_prompt": "Payment crashes on checkout",
        "project_name": "E-Commerce App"
    }, headers={"Authorization": f"Bearer {tok}"})

    assert ai_resp.status_code == 200
    data = ai_resp.json()
    assert "title" in data
    assert "description" in data
    assert "steps_to_reproduce" in data
    assert "suggested_severity" in data
