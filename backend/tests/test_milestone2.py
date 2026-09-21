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
    Base.metadata.create_all(bind=engine)
    yield


def test_milestone2_workflow_and_features():
    # 1. Register & Login User
    reg_resp = client.post("/api/auth/register", json={
        "email": "m2dev@bugflow.io",
        "password": "pass123",
        "name": "Milestone 2 Developer",
        "role": "Developer"
    })
    assert reg_resp.status_code == 201

    login_resp = client.post("/api/auth/login", json={
        "email": "m2dev@bugflow.io",
        "password": "pass123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Create & List Labels
    lbl_create = client.post("/api/labels", json={"name": "Security", "color": "#ef4444"}, headers=headers)
    assert lbl_create.status_code == 201
    security_label = lbl_create.json()

    labels_resp = client.get("/api/labels", headers=headers)
    assert labels_resp.status_code == 200
    labels = labels_resp.json()
    assert len(labels) >= 1

    # 3. Create Project
    proj_resp = client.post("/api/projects", json={
        "name": "Milestone 2 Core",
        "description": "M2 Testing"
    }, headers=headers)
    assert proj_resp.status_code == 201
    proj_id = proj_resp.json()["id"]

    # 4. Create Sprint
    sprint_resp = client.post("/api/sprints", json={
        "name": "Sprint 1",
        "start_date": "2026-08-01T00:00:00",
        "end_date": "2026-08-15T00:00:00"
    }, headers=headers)
    assert sprint_resp.status_code == 201
    sprint_id = sprint_resp.json()["id"]

    # 5. Create Issue with Labels & Sprint
    iss_resp = client.post("/api/issues", json={
        "title": "Database connection timeout in backend",
        "description": "500 Internal Server Error when querying users table under load.",
        "severity": "High",
        "priority": "High",
        "project_id": proj_id,
        "sprint_id": sprint_id,
        "label_ids": [security_label["id"]]
    }, headers=headers)
    assert iss_resp.status_code == 201
    issue_id = iss_resp.json()["id"]

    # 6. Test Activity Log
    act_resp = client.get(f"/api/issues/{issue_id}/activity", headers=headers)
    assert act_resp.status_code == 200
    assert len(act_resp.json()) >= 1

    # 7. Update Issue Status (Reported -> Open) & check Activity Log update
    upd_resp = client.put(f"/api/issues/{issue_id}", json={
        "status": "Open"
    }, headers=headers)
    assert upd_resp.status_code == 200

    act_resp2 = client.get(f"/api/issues/{issue_id}/activity", headers=headers)
    assert act_resp2.status_code == 200
    field_changes = [a["field_changed"] for a in act_resp2.json()]
    assert "Status" in field_changes

    # 8. Test AI Auto Tagging
    tag_resp = client.post("/api/ai/auto-tag", json={
        "title": "JWT Auth Token Expiration Error",
        "description": "Login password verification failed with 401 Unauthorized"
    }, headers=headers)
    assert tag_resp.status_code == 200
    tags = tag_resp.json()["tags"]
    assert "Security" in tags or "Authentication" in tags

    # 9. Test AI Log Analyzer
    log_resp = client.post("/api/ai/analyze-log", json={
        "log_text": "2026-08-14 ERROR: Out of memory exception in worker process."
    }, headers=headers)
    assert log_resp.status_code == 200
    assert "Memory" in log_resp.json()["probable_cause"]
