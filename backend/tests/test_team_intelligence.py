import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.team_scoring_service import TeamScoringService

client = TestClient(app)


def get_auth_headers():
    client.post("/api/auth/register", json={
        "email": "testadmin_team@bugflow.io",
        "password": "password123",
        "name": "Test Admin Team",
        "role": "Admin"
    })
    response = client.post("/api/auth/login", json={"email": "testadmin_team@bugflow.io", "password": "password123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_workload_capacity_scoring_thresholds():
    assert TeamScoringService.calculate_workload_score(1) == 100.0
    assert TeamScoringService.calculate_workload_score(3) == 100.0
    assert TeamScoringService.calculate_workload_score(5) == 85.0
    assert TeamScoringService.calculate_workload_score(8) == 65.0
    assert TeamScoringService.calculate_workload_score(11) == 40.0
    assert TeamScoringService.calculate_workload_score(14) == 20.0


def test_user_professional_profile_and_skills_api():
    headers = get_auth_headers()
    # 1. Get profile
    get_resp = client.get("/api/users/1/profile", headers=headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "profile" in data
    assert "metrics" in data

    # 2. Update profile
    up_payload = {
        "department": "Core Platform",
        "highest_qualification": "M.Tech CS",
        "specialization": "Distributed Systems",
        "years_experience": 5.5,
        "experience_level": "Senior",
        "availability_status": "Available"
    }
    up_resp = client.put("/api/users/1/profile", json=up_payload, headers=headers)
    assert up_resp.status_code == 200
    updated = up_resp.json()
    assert updated["profile"]["years_experience"] == 5.5
    assert updated["profile"]["specialization"] == "Distributed Systems"

    # 3. Add Skill
    skills_resp = client.get("/api/skills", headers=headers)
    assert skills_resp.status_code == 200
    skills = skills_resp.json()
    assert len(skills) > 0
    skill_id = skills[0]["id"]

    add_skill_resp = client.post("/api/users/1/skills", json={"skill_id": skill_id, "proficiency_level": 5, "years_experience": 4.0}, headers=headers)
    assert add_skill_resp.status_code == 200


def test_team_workload_summary_api():
    headers = get_auth_headers()
    res = client.get("/api/users/workload", headers=headers)
    assert res.status_code == 200
    workloads = res.json()
    assert isinstance(workloads, list)
    if len(workloads) > 0:
        w = workloads[0]
        assert "active_issues" in w
        assert "capacity_percentage" in w
        assert "status_indicator" in w


def test_ai_issue_analysis_and_top3_recommendations():
    headers = get_auth_headers()
    # Create test project & issue
    p_resp = client.post("/api/projects", json={"name": "UPI Payment Gateway", "description": "FinTech core"}, headers=headers)
    assert p_resp.status_code in [200, 201]
    proj_id = p_resp.json()["id"]

    iss_resp = client.post("/api/issues", json={
        "title": "Payment API returns 500 when processing UPI transaction",
        "description": "Critical failure in payment endpoint during transaction commit.",
        "severity": "Critical",
        "priority": "Critical",
        "project_id": proj_id
    }, headers=headers)
    assert iss_resp.status_code == 201
    issue_id = iss_resp.json()["id"]

    # Analyze issue & fetch Top 3 recommendations
    rec_resp = client.post(f"/api/issues/{issue_id}/assignment/analyze", headers=headers)
    assert rec_resp.status_code == 200
    data = rec_resp.json()

    assert "recommendations" in data
    recs = data["recommendations"]
    assert len(recs) <= 3
    if len(recs) > 0:
        top = recs[0]
        assert "overall_score" in top
        assert "confidence" in top
        assert "scores" in top
        assert "reasons" in top


def test_assignment_execution_and_history():
    headers = get_auth_headers()
    # Assign issue 1 to user 1
    assign_payload = {
        "user_id": 1,
        "source": "ai_recommendation",
        "recommendation_score": 92.5
    }
    assign_resp = client.post("/api/issues/1/assign", json=assign_payload, headers=headers)
    assert assign_resp.status_code == 200

    # Get assignment history
    hist_resp = client.get("/api/issues/1/assignment-history", headers=headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) >= 1
    assert history[0]["assignment_source"] == "ai_recommendation"


def test_team_assignment_insights():
    headers = get_auth_headers()
    res = client.get("/api/team/assignment-insights", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_assignments" in data
    assert "ai_acceptance_rate_pct" in data
