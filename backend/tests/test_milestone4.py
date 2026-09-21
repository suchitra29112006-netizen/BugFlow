import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token():
    client.post("/api/auth/register", json={
        "name": "M4 Test Admin",
        "email": "m4_admin@bugflow.io",
        "password": "password123",
        "role": "Admin"
    })
    resp = client.post("/api/auth/login", json={
        "email": "m4_admin@bugflow.io",
        "password": "password123"
    })
    return resp.json()["access_token"]

def get_headers():
    token = get_auth_token()
    return {"Authorization": f"Bearer {token}"}

def test_milestone4_security_layer():
    headers = get_headers()

    # 1. Run Security Audit
    res = client.post("/api/security/audit", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "routes_scanned" in data or "total_routes_checked" in data
    assert "status" in data

    # 2. Get Security Findings
    res = client.get("/api/security/findings", headers=headers)
    assert res.status_code == 200
    sec_data = res.json()
    assert "findings" in sec_data
    assert isinstance(sec_data["findings"], list)

    # 3. Get Security Anomalies
    res = client.get("/api/security/anomalies", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 4. Check Sensitive Data (Secret / PII leak)
    res = client.post("/api/security/sensitive-data/check", json={
        "text": "Secret API Key: STRIPE_API_KEY_EXAMPLE and AWS key AWS_KEY_EXAMPLE"
    }, headers=headers)
    assert res.status_code == 200
    check_data = res.json()
    assert "findings" in check_data or "contains_sensitive_data" in check_data or "has_findings" in check_data
    assert len(check_data.get("findings", [])) >= 1

def test_milestone4_performance_layer():
    headers = get_headers()

    # 1. Get Query Performance Report
    res = client.get("/api/performance/report", headers=headers)
    assert res.status_code == 200
    rep = res.json()
    assert "n_plus_one_candidates" in rep or "n1_candidates" in rep
    assert "ddl_index_recommendations" in rep or "index_recommendations" in rep

    # 2. Get Performance Queries list
    res = client.get("/api/performance/queries", headers=headers)
    assert res.status_code == 200
    q_data = res.json()
    assert "slowest_queries" in q_data
    assert isinstance(q_data["slowest_queries"], list)

def test_milestone4_intelligence_and_knowledge_layer():
    headers = get_headers()

    # Setup seed project & issue
    proj_res = client.post("/api/projects", json={"name": "M4 Architecture Core", "description": "M4 Test Suite"}, headers=headers)
    proj_id = proj_res.json()["id"]

    iss_res = client.post("/api/issues", json={
        "title": "NullPointerException in Authentication Token Refresh Handler",
        "description": "Token refresh throws NPE when refresh_token expires in redis connection pool.",
        "severity": "High",
        "priority": "High",
        "project_id": proj_id
    }, headers=headers)
    iss_id = iss_res.json()["id"]

    # 1. Defect Fingerprint DNA
    res = client.get(f"/api/intelligence/fingerprint/{iss_id}", headers=headers)
    assert res.status_code == 200
    fp = res.json()
    assert "fingerprint_hash" in fp
    assert fp["issue_id"] == iss_id

    # 2. Recurrence Risk Predictor
    res = client.get(f"/api/intelligence/recurrence-risk/{iss_id}", headers=headers)
    assert res.status_code == 200
    risk = res.json()
    assert "recurrence_risk_pct" in risk or "risk_level" in risk

    # 3. Bug Family Tree
    res = client.get(f"/api/intelligence/family-tree/{iss_id}", headers=headers)
    assert res.status_code == 200
    tree = res.json()
    assert "issue_id" in tree or "root_issue_id" in tree

    # 4. Investigation Workspace
    res = client.get(f"/api/intelligence/investigation/{iss_id}", headers=headers)
    assert res.status_code == 200
    ws = res.json()
    assert ws["issue_id"] == iss_id

    # 5. Add Hypothesis
    res = client.post(f"/api/intelligence/investigation/{iss_id}/hypothesis", json={
        "hypothesis": "Redis connection pool timeout during token validation."
    }, headers=headers)
    assert res.status_code == 200

    # 6. Add Verification Test Case
    res = client.post(f"/api/intelligence/investigation/{iss_id}/verification-test", json={
        "test_name": "Test Redis Connection Timeout Handling",
        "assertion": "Returns 401 Unauthorized instead of 500 NPE"
    }, headers=headers)
    assert res.status_code == 200

    # 7. Fix Verification Plan
    res = client.get(f"/api/intelligence/verification-plan/{iss_id}", headers=headers)
    assert res.status_code == 200
    vplan = res.json()
    assert "verification_steps" in vplan or "issue_id" in vplan

    # 8. Defect Quality Score
    res = client.get(f"/api/intelligence/quality-score/{iss_id}", headers=headers)
    assert res.status_code == 200
    qs = res.json()
    assert "quality_score" in qs or "defect_quality_score" in qs or "issue_id" in qs

    # 9. 14-Day Defect Volume Forecast
    res = client.get("/api/intelligence/forecast", headers=headers)
    assert res.status_code == 200
    fc = res.json()
    assert "forecast_period" in fc or "forecast_days" in fc or "forecast" in fc

    # 10. Technical Debt Radar
    res = client.get("/api/intelligence/tech-debt-radar", headers=headers)
    assert res.status_code == 200
    td = res.json()
    assert isinstance(td, list) or "highest_debt_modules" in td or "tech_debt_score" in td

    # 11. What-If Sprint Simulator
    res = client.post("/api/intelligence/what-if-simulation", json={
        "scenario": "Capacity reduction",
        "developer_capacity_pct": 80
    }, headers=headers)
    assert res.status_code == 200

    # 12. Automated Release Notes
    res = client.get("/api/intelligence/release-notes", headers=headers)
    assert res.status_code == 200
    rn = res.json()
    assert "release_version" in rn or "summary" in rn

    # 13. Incidents Mode
    res = client.get("/api/intelligence/incidents", headers=headers)
    assert res.status_code == 200
    inc = res.json()
    assert isinstance(inc, list) or "incidents" in inc

    # 14. 7-Minute Developer Brief
    res = client.get("/api/intelligence/developer-brief", headers=headers)
    assert res.status_code == 200
    brief = res.json()
    assert "brief_title" in brief or "role" in brief or "estimated_read_time" in brief
