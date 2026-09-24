import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.issue import Issue, IssueSeverity, IssueStatus, IssuePriority
from app.auth.password import get_password_hash
from app.auth.jwt import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_time.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


from app.models.time_entry import TimeEntry, ActiveTimer


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.query(TimeEntry).delete()
    db.query(ActiveTimer).delete()
    db.query(Issue).delete()
    db.query(Project).delete()
    db.query(User).delete()
    db.commit()

    user = User(
        name="Developer Test",
        email="dev_time@test.com",
        password_hash=get_password_hash("password123"),
        role=UserRole.DEVELOPER
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    project = Project(name="Test Project", project_key="TP", owner_id=user.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    issue = Issue(
        title="Test Payment Checkout Crash",
        description="Checkout timeout defect",
        severity=IssueSeverity.HIGH,
        status=IssueStatus.IN_PROGRESS,
        priority=IssuePriority.HIGH,
        reporter_id=user.id,
        assigned_to=user.id,
        project_id=project.id,
        est_resolution_hours=5.0
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    token = create_access_token(data={"sub": str(user.id)})
    u_id = user.id
    p_id = project.id
    i_id = issue.id
    db.close()
    return {"token": token, "user_id": u_id, "issue_id": i_id, "project_id": p_id}


def test_time_entry_crud(setup_db):
    headers = {"Authorization": f"Bearer {setup_db['token']}"}

    # 1. Create work log
    payload = {
        "issue_id": setup_db["issue_id"],
        "duration_seconds": 4800, # 1h 20m
        "work_type": "Debugging",
        "note": "Investigated payment gateway timeout and fixed retry logic.",
        "billable": True
    }
    res = client.post("/api/time/entries", json=payload, headers=headers)
    assert res.status_code == 201
    entry_id = res.json()["entry"]["id"]

    # 2. Get entries
    res_get = client.get("/api/time/entries", headers=headers)
    assert res_get.status_code == 200
    entries = res_get.json()
    assert len(entries) == 1
    assert entries[0]["work_type"] == "Debugging"
    assert entries[0]["duration_formatted"] == "1h 20m"

    # 3. Get Summary KPIs
    res_sum = client.get("/api/time/summary", headers=headers)
    assert res_sum.status_code == 200
    summary = res_sum.json()
    assert summary["total_logged_formatted"] == "1h 20m"

    # 4. Get Analytics
    res_ana = client.get("/api/time/analytics", headers=headers)
    assert res_ana.status_code == 200
    ana = res_ana.json()
    assert len(ana["by_work_type"]) > 0

    # 5. Delete Entry
    res_del = client.delete(f"/api/time/entries/{entry_id}", headers=headers)
    assert res_del.status_code == 200


def test_active_timer_flow(setup_db):
    headers = {"Authorization": f"Bearer {setup_db['token']}"}

    # Start timer
    res = client.post(f"/api/time/timer/start", json={"issue_id": setup_db["issue_id"], "work_type": "Development", "work_notes": "Coding feature"}, headers=headers)
    assert res.status_code == 200

    # Get active timer
    res_active = client.get("/api/time/active-timer", headers=headers)
    assert res_active.status_code == 200
    assert res_active.json()["active"] is True

    # Pause timer
    res_pause = client.post("/api/time/timer/pause", headers=headers)
    assert res_pause.status_code == 200

    # Resume timer
    res_resume = client.post("/api/time/timer/resume", headers=headers)
    assert res_resume.status_code == 200

    # Stop timer
    res_stop = client.post("/api/time/timer/stop", json={"note": "Finished feature implementation", "work_type": "Development"}, headers=headers)
    assert res_stop.status_code == 200
    assert "duration_formatted" in res_stop.json()
