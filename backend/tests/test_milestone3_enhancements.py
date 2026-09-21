import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token():
    # Register/Login Admin
    client.post("/api/auth/register", json={
        "name": "Platform Test Admin",
        "email": "m3enh_admin@bugflow.io",
        "password": "password123",
        "role": "Admin"
    })
    resp = client.post("/api/auth/login", json={
        "email": "m3enh_admin@bugflow.io",
        "password": "password123"
    })
    return resp.json()["access_token"]


def get_headers():
    token = get_auth_token()
    return {"Authorization": f"Bearer {token}"}


def test_copilot_14_queries_and_action_execution():
    headers = get_headers()

    # Create project & issue first
    proj_res = client.post("/api/projects", json={"name": "M3 Intelligence Suite", "description": "Testing AI Platform"}, headers=headers)
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    iss_res = client.post("/api/issues", json={
        "title": "Payment gateway timeout on checkout",
        "description": "500 Internal Server Error when processing payload.",
        "severity": "Critical",
        "priority": "Critical",
        "project_id": proj_id
    }, headers=headers)
    assert iss_res.status_code == 201
    iss_id = iss_res.json()["id"]

    # 1. Sprint blockers query
    res = client.post("/api/ai/copilot", json={"query": "What is blocking Sprint 1?"}, headers=headers)
    assert res.status_code == 200
    assert "tools_used" in res.json()

    # 2. Highest risk query
    res = client.post("/api/ai/copilot", json={"query": "Show me highest-risk unresolved defects"}, headers=headers)
    assert res.status_code == 200

    # 3. SLA breach query
    res = client.post("/api/ai/copilot", json={"query": "Which critical defects are close to SLA breach?"}, headers=headers)
    assert res.status_code == 200

    # 4. Highest workload query
    res = client.post("/api/ai/copilot", json={"query": "Who has the highest developer workload?"}, headers=headers)
    assert res.status_code == 200

    # 5. Activity history today
    res = client.post("/api/ai/copilot", json={"query": f"What changed on DEF-{iss_id} today?"}, headers=headers)
    assert res.status_code == 200

    # 6. Summarize defect
    res = client.post("/api/ai/copilot", json={"query": f"Summarize DEF-{iss_id}"}, headers=headers)
    assert res.status_code == 200

    # 7. Similar defects
    res = client.post("/api/ai/copilot", json={"query": f"Find defects similar to DEF-{iss_id}"}, headers=headers)
    assert res.status_code == 200

    # 8. Likely root cause
    res = client.post("/api/ai/copilot", json={"query": f"What is the likely root cause of DEF-{iss_id}?"}, headers=headers)
    assert res.status_code == 200

    # 9. Previous resolutions
    res = client.post("/api/ai/copilot", json={"query": "Show me previous resolutions for payment defects"}, headers=headers)
    assert res.status_code == 200

    # 10. Reopened defects
    res = client.post("/api/ai/copilot", json={"query": "Which defects are repeatedly being reopened?"}, headers=headers)
    assert res.status_code == 200

    # 11. Component concentration
    res = client.post("/api/ai/copilot", json={"query": "Which component has the highest defect concentration?"}, headers=headers)
    assert res.status_code == 200

    # 12. Manager sprint summary
    res = client.post("/api/ai/copilot", json={"query": "Summarize this sprint for my manager"}, headers=headers)
    assert res.status_code == 200

    # 13. Daily status update
    res = client.post("/api/ai/copilot", json={"query": "Draft a daily defect status update"}, headers=headers)
    assert res.status_code == 200

    # 14. Action proposal execution
    res = client.post("/api/ai/copilot", json={"query": f"Assign DEF-{iss_id} to Sarah Developer"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["action_required"] is True

    # Execute action confirmation
    exec_res = client.post("/api/ai/copilot/execute-action", json={
        "action_type": "ASSIGN_ISSUE",
        "issue_id": iss_id,
        "target": "Sarah Developer"
    }, headers=headers)
    assert exec_res.status_code == 200
    assert "Successfully assigned" in exec_res.json()["message"]


def test_smart_triage_queue_and_explain_why():
    headers = get_headers()

    triage_res = client.get("/api/issues/smart-triage", headers=headers)
    assert triage_res.status_code == 200
    data = triage_res.json()
    assert "triage_queue" in data
    assert len(data["triage_queue"]) >= 1
    first_item = data["triage_queue"][0]
    assert "impact_score" in first_item
    assert "rank_reasons" in first_item

    # Explain Why Endpoint
    iss_id = first_item["issue"]["id"]
    explain_res = client.get(f"/api/issues/{iss_id}/explain-why?type=triage", headers=headers)
    assert explain_res.status_code == 200
    exp_data = explain_res.json()
    assert "evidence" in exp_data
    assert exp_data["confidence_pct"] >= 50


def test_multi_hypothesis_root_cause_diagnosis():
    headers = get_headers()

    res = client.post("/api/issues/1/ai-resolution-assistance", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "hypotheses" in data
    assert len(data["hypotheses"]) >= 2
    assert "disclaimer" in data


def test_ai_sprint_rebalancer():
    headers = get_headers()

    # Create sprint first
    sp_res = client.post("/api/sprints", json={
        "name": "Sprint 4",
        "start_date": "2026-09-01T00:00:00",
        "end_date": "2026-09-15T00:00:00"
    }, headers=headers)
    assert sp_res.status_code == 201
    sprint_id = sp_res.json()["id"]

    # Rebalance proposal
    prop_res = client.get(f"/api/sprints/{sprint_id}/rebalance-proposal", headers=headers)
    assert prop_res.status_code == 200
    prop = prop_res.json()
    assert "suggested_actions" in prop
    assert "projected_completion_probability" in prop

    # Apply rebalance
    apply_res = client.post(f"/api/sprints/{sprint_id}/apply-rebalance", json={"action_ids": [1, 2]}, headers=headers)
    assert apply_res.status_code == 200
    assert "Successfully applied" in apply_res.json()["message"]


def test_resolution_knowledge_graph_and_ci_verification():
    headers = get_headers()

    # Knowledge graph
    kg_res = client.get("/api/issues/1/knowledge-graph", headers=headers)
    assert kg_res.status_code == 200
    kg_data = kg_res.json()
    assert "nodes" in kg_data
    assert "edges" in kg_data

    # CI Verification Batch
    ci_res = client.post("/api/issues/defects/verify-batch", json={
        "release": "v2.5-rc1",
        "defects": [
            {"id": "DEF-1", "status": "passed"}
        ]
    }, headers=headers)
    assert ci_res.status_code == 200
    assert ci_res.json()["processed_count"] == 1


def test_smart_automation_suggestions_and_acceptance():
    headers = get_headers()

    sug_res = client.get("/api/automation/smart-suggestions", headers=headers)
    assert sug_res.status_code == 200

    accept_res = client.post("/api/automation/accept-suggestion", json={
        "rule_name": "Auto-assign Critical Auth to Sarah",
        "event_type": "ISSUE_CREATED",
        "condition_field": "severity",
        "condition_value": "Critical",
        "action_type": "ASSIGN_USER",
        "action_value": "1"
    }, headers=headers)
    assert accept_res.status_code == 200
    assert "rule" in accept_res.json()


def test_error_handling_and_invalid_ids():
    headers = get_headers()

    # Invalid issue ID
    res = client.get("/api/issues/99999/explain-why", headers=headers)
    assert res.status_code == 200
    assert "Issue not found" in res.json()["evidence"][0]

    # Empty copilot query
    res = client.post("/api/ai/copilot", json={"query": "   "}, headers=headers)
    assert res.status_code == 400
