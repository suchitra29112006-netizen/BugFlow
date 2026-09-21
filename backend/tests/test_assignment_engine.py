import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.models import User, Issue, Project, DeveloperProfile, DeveloperSkill, DeveloperTechnology
from app.services.scoring_service import AssignmentScoringService

client = TestClient(app)


def get_auth_headers():
    client.post("/api/auth/register", json={
        "email": "testadmin_assign@bugflow.io",
        "password": "password123",
        "name": "Test Admin Assign",
        "role": "Admin"
    })
    response = client.post("/api/auth/login", json={"email": "testadmin_assign@bugflow.io", "password": "password123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_developer_profile_crud():
    headers = get_auth_headers()
    # Get user profile for user 1
    response = client.get("/api/users/1/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data
    assert "years_experience" in data

    # Update profile
    update_payload = {
        "years_experience": 5.0,
        "primary_specialization": "Backend API Architect",
        "availability_status": "Available"
    }
    up_resp = client.put("/api/users/1/profile", json=update_payload, headers=headers)
    assert up_resp.status_code == 200
    updated = up_resp.json()
    assert updated["years_experience"] == 5.0

    # Add Skills to User
    skills_resp = client.get("/api/skills", headers=headers)
    assert skills_resp.status_code == 200
    skills = skills_resp.json()
    if len(skills) > 0:
        add_skill_resp = client.post("/api/users/1/skills", json={"skill_id": skills[0]["id"], "proficiency_level": 5, "years_experience": 4.0}, headers=headers)
        assert add_skill_resp.status_code == 200


def test_assignment_scoring_engine_and_recommendation_api():
    headers = get_auth_headers()
    
    # Create project & issue first if empty
    p_resp = client.post("/api/projects", json={"name": "Assignment Test Project", "description": "Test project"}, headers=headers)
    assert p_resp.status_code in [200, 201]
    proj_id = p_resp.json()["id"]

    iss_resp = client.post("/api/issues", json={
        "title": "FastAPI payment endpoint returns 500 error",
        "description": "Critical failure in payment endpoint during transaction commit.",
        "severity": "Critical",
        "priority": "Critical",
        "project_id": proj_id
    }, headers=headers)
    assert iss_resp.status_code == 201
    issue_id = iss_resp.json()["id"]

    # Fetch recommendations for the issue
    response = client.get(f"/api/issues/{issue_id}/assignment-recommendations", headers=headers)
    assert response.status_code == 200
    res = response.json()

    assert res["status"] == "SUCCESS"
    assert "recommendations" in res
    recommendations = res["recommendations"]
    assert len(recommendations) > 0

    top = recommendations[0]
    assert "overall_score" in top
    assert 0.0 <= top["overall_score"] <= 100.0
    assert "component_scores" in top
    assert "positive_reasons" in top
    assert "concerns" in top
    assert "recommendation_level" in top

    # Verify score components
    comp = top["component_scores"]
    assert "skill_score" in comp
    assert "technology_score" in comp
    assert "experience_score" in comp
    assert "workload_score" in comp
    assert "past_issue_score" in comp
    assert "availability_score" in comp


def test_assignment_execution_and_audit():
    headers = get_auth_headers()

    # Assign developer to Issue #1
    payload = {
        "assigned_user_id": 1,
        "override_reason": None
    }
    assign_resp = client.post("/api/issues/1/assign-developer", json=payload, headers=headers)
    assert assign_resp.status_code == 200

    # Verify activity history log
    act_resp = client.get("/api/issues/1/activity", headers=headers)
    assert act_resp.status_code == 200
    logs = act_resp.json()
    assert any("Assignment" in log["field_changed"] for log in logs)


def test_assignment_feedback_and_analytics():
    headers = get_auth_headers()

    # Submit positive feedback
    fb_payload = {
        "is_good_recommendation": True,
        "reason_category": "Strong skill match",
        "comments": "Developer fixed the authentication defect in 2 hours."
    }
    fb_resp = client.post("/api/issues/1/assignment-feedback", json=fb_payload, headers=headers)
    assert fb_resp.status_code == 200

    # Check analytics
    analytics_resp = client.get("/api/assignment/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    ana_data = analytics_resp.json()
    assert ana_data["total_feedback"] >= 1
    assert ana_data["acceptance_rate_percentage"] >= 0.0
