import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app
from app.services.sprint_scoring_service import SprintScoringService

client = TestClient(app)


def get_auth_headers():
    client.post("/api/auth/register", json={
        "email": "testadmin_sprint@bugflow.io",
        "password": "password123",
        "name": "Test Admin Sprint",
        "role": "Admin"
    })
    response = client.post("/api/auth/login", json={"email": "testadmin_sprint@bugflow.io", "password": "password123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_sprint_creation_and_objectives_crud():
    headers = get_auth_headers()

    # 1. Create Sprint
    start = datetime.utcnow().isoformat()
    end = (datetime.utcnow() + timedelta(days=14)).isoformat()
    payload = {
        "name": "Sprint 8 — AI Center Test",
        "goal": "Test payment reliability and defect resolution",
        "start_date": start,
        "end_date": end,
        "planned_story_points": 34,
        "team_capacity": 40
    }
    create_resp = client.post("/api/sprints", json=payload, headers=headers)
    assert create_resp.status_code == 201
    sprint = create_resp.json()
    assert sprint["name"] == "Sprint 8 — AI Center Test"
    sprint_id = sprint["id"]

    # 2. Add Objective
    obj_payload = {
        "title": "Resolve authentication bugs",
        "description": "Ensure zero crash on login"
    }
    obj_resp = client.post(f"/api/sprints/{sprint_id}/objectives", json=obj_payload, headers=headers)
    assert obj_resp.status_code == 200
    obj = obj_resp.json()
    assert obj["title"] == "Resolve authentication bugs"

    # 3. List Sprints
    list_resp = client.get("/api/sprints", headers=headers)
    assert list_resp.status_code == 200
    sprints = list_resp.json()
    assert len(sprints) >= 1


def test_sprint_health_risk_qa_release_endpoints():
    headers = get_auth_headers()
    
    # 1. Health
    health_resp = client.get("/api/sprints/1/health", headers=headers)
    assert health_resp.status_code in [200, 404]

    # 2. Risk
    risk_resp = client.get("/api/sprints/1/risk", headers=headers)
    assert risk_resp.status_code in [200, 404]

    # 3. Capacity
    cap_resp = client.get("/api/sprints/1/capacity", headers=headers)
    assert cap_resp.status_code in [200, 404]

    # 4. Burndown
    burn_resp = client.get("/api/sprints/1/burndown", headers=headers)
    assert burn_resp.status_code in [200, 404]

    # 5. QA Readiness
    qa_resp = client.get("/api/sprints/1/qa-readiness", headers=headers)
    assert qa_resp.status_code in [200, 404]

    # 6. Release Readiness
    rel_resp = client.get("/api/sprints/1/release-readiness", headers=headers)
    assert rel_resp.status_code in [200, 404]


def test_ai_sprint_planner_and_copilot_chat():
    headers = get_auth_headers()

    # 1. Create Sprint
    start = datetime.utcnow().isoformat()
    end = (datetime.utcnow() + timedelta(days=14)).isoformat()
    sprint_resp = client.post("/api/sprints", json={
        "name": "Sprint 9 — AI Planning Test",
        "start_date": start,
        "end_date": end
    }, headers=headers)
    assert sprint_resp.status_code == 201
    s_id = sprint_resp.json()["id"]

    # 2. AI Sprint Planner
    plan_resp = client.post(f"/api/sprints/{s_id}/ai-plan", headers=headers)
    assert plan_resp.status_code == 200
    plan_data = plan_resp.json()
    assert "recommended_issues" in plan_data

    # 3. AI Copilot Chat
    chat_resp = client.post(f"/api/sprints/{s_id}/ai-chat", json={"query": "Why is this sprint at risk?"}, headers=headers)
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert "answer" in chat_data


def test_sprint_comparison_and_retrospective():
    headers = get_auth_headers()

    # 1. Compare Sprints
    comp_resp = client.get("/api/sprints/compare", headers=headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert "sprints_comparison" in comp_data

    # 2. Sprint Retrospective
    retro_resp = client.post("/api/sprints/1/retrospective", headers=headers)
    assert retro_resp.status_code in [200, 404]
