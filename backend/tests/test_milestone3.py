import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_headers():
    client.post("/api/auth/register", json={
        "email": "m3admin@bugflow.io",
        "password": "password123",
        "name": "Milestone3 Admin",
        "role": "Admin"
    })
    response = client.post("/api/auth/login", json={"email": "m3admin@bugflow.io", "password": "password123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_analytics_endpoints():
    headers = get_auth_headers()
    
    # Overview
    ov_resp = client.get("/api/analytics/overview", headers=headers)
    assert ov_resp.status_code == 200
    data = ov_resp.json()
    assert "total_defects" in data
    assert "active_defects" in data

    # Defect Trends
    trend_resp = client.get("/api/analytics/defect-trends?days=7", headers=headers)
    assert trend_resp.status_code == 200
    assert "trends" in trend_resp.json()

    # Severity distribution
    sev_resp = client.get("/api/analytics/severity", headers=headers)
    assert sev_resp.status_code == 200

    # Developer workload
    work_resp = client.get("/api/analytics/developer-workload", headers=headers)
    assert work_resp.status_code == 200

    # AI Insights
    ai_resp = client.get("/api/analytics/ai-insights", headers=headers)
    assert ai_resp.status_code == 200
    assert "insights" in ai_resp.json()


def test_ai_resolution_assistance_and_similarity():
    headers = get_auth_headers()

    # Create project & issue
    p_resp = client.post("/api/projects", json={"name": "M3 Test Project", "description": "M3 Description"}, headers=headers)
    assert p_resp.status_code in [200, 201]
    proj_id = p_resp.json()["id"]

    iss_resp = client.post("/api/issues", json={
        "title": "Payment gateway timeout on transaction submit",
        "description": "Application hangs and returns null response during checkout.",
        "severity": "Critical",
        "priority": "Critical",
        "project_id": proj_id
    }, headers=headers)
    assert iss_resp.status_code == 201
    issue_id = iss_resp.json()["id"]

    # Resolution assistance
    res_resp = client.post(f"/api/issues/{issue_id}/ai-resolution-assistance", headers=headers)
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert "investigation_areas" in res_data
    assert "suggested_resolution" in res_data

    # Similar defects
    sim_resp = client.get(f"/api/issues/{issue_id}/similar", headers=headers)
    assert sim_resp.status_code == 200

    # Intelligence score
    intel_resp = client.get(f"/api/issues/{issue_id}/intelligence-score", headers=headers)
    assert intel_resp.status_code == 200
    assert "intelligence_score" in intel_resp.json()


def test_ai_command_center_and_github_link():
    headers = get_auth_headers()

    # Command Center Query
    cmd_resp = client.post("/api/ai/command-center", json={"query": "Show critical defects"}, headers=headers)
    assert cmd_resp.status_code == 200
    assert "answer" in cmd_resp.json()

    # GitHub PR Link
    pr_resp = client.post("/api/github/link-pr", json={"issue_id": 1, "pr_url": "https://github.com/bugflow/core/pull/42"}, headers=headers)
    assert pr_resp.status_code in [200, 404]

    # GitHub AI PR Review
    rev_resp = client.post("/api/github/ai-pr-review", json={"issue_id": 1, "pr_url": "https://github.com/bugflow/core/pull/42"}, headers=headers)
    assert rev_resp.status_code in [200, 404]
