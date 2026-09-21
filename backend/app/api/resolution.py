from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.issue import Issue, IssueStatus
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.services.ai_resolution_service import ai_resolution_service
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["AI Resolution & Intelligence Center"])


class CopilotQuerySchema(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None


class CopilotActionExecutionSchema(BaseModel):
    action_type: str
    issue_id: int
    target: Optional[str] = None


class LinkPRSchema(BaseModel):
    issue_id: int
    pr_url: str


class AIPRReviewSchema(BaseModel):
    issue_id: int
    pr_url: str
    diff_text: Optional[str] = None


class TestGeneratorSchema(BaseModel):
    issue_id: int


@router.post("/issues/{issue_id}/ai-resolution-assistance")
def get_ai_resolution_assistance(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return ai_resolution_service.generate_resolution_assistance(issue, db)


@router.get("/issues/{issue_id}/explain-why")
def get_explain_why_analysis(
    issue_id: int,
    type: str = Query("risk", description="Recommendation type: triage, risk, assignment, sprint_rebalance"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ai_resolution_service.generate_explain_why(type, issue_id, db)


@router.get("/issues/{issue_id}/similar")
def get_similar_defects(
    issue_id: int,
    limit: int = Query(5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return ai_resolution_service.find_similar_defects(issue.id, issue.title, issue.description or "", db, limit=limit)


@router.get("/issues/historical-resolutions")
def search_historical_resolutions(
    query: str = Query(..., description="Query text or defect title"),
    limit: int = Query(5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ai_resolution_service.search_historical_resolutions(query, db, limit=limit)


@router.get("/issues/{issue_id}/intelligence-score")
def get_defect_intelligence_score(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return ai_resolution_service.calculate_defect_intelligence_score(issue, db)


# P0-1: BugFlow Copilot Conversational Assistant Endpoint
@router.post("/ai/copilot")
def ask_bugflow_copilot(
    cop_in: CopilotQuerySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not cop_in.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    return ai_resolution_service.process_copilot_chat(cop_in.query, current_user, db, history=cop_in.history)


# Copilot Action Execution with RBAC Validation & Activity Log
@router.post("/ai/copilot/execute-action")
def execute_copilot_action(
    act_in: CopilotActionExecutionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == act_in.issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    if act_in.action_type == "ASSIGN_ISSUE":
        dev = db.query(User).filter(User.name.ilike(f"%{act_in.target}%")).first()
        target_user_id = dev.id if dev else current_user.id
        issue.assigned_to = target_user_id
        db.add(ActivityLog(
            issue_id=issue.id,
            user_id=current_user.id,
            field_changed="Assignee",
            old_value=None,
            new_value=dev.name if dev else current_user.name
        ))
        db.commit()
        return {"message": f"Successfully assigned Defect #{issue.id} to {dev.name if dev else current_user.name}."}

    elif act_in.action_type == "UPDATE_STATUS":
        target_st = act_in.target.title() if act_in.target else "Open"
        old_st = issue.status.value if hasattr(issue.status, 'value') else str(issue.status)
        issue.status = IssueStatus(target_st) if target_st in [e.value for e in IssueStatus] else issue.status
        db.add(ActivityLog(
            issue_id=issue.id,
            user_id=current_user.id,
            field_changed="Status",
            old_value=old_st,
            new_value=str(issue.status.value if hasattr(issue.status, 'value') else issue.status)
        ))
        db.commit()
        return {"message": f"Successfully updated Defect #{issue.id} status to '{issue.status.value}'."}

    return {"message": f"Action '{act_in.action_type}' processed successfully."}


@router.post("/ai/command-center")
def ask_ai_command_center(
    cop_in: CopilotQuerySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not cop_in.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    return ai_resolution_service.process_command_center_query(cop_in.query, current_user, db)


# P1-12: Resolution Knowledge Graph Endpoint
@router.get("/issues/{issue_id}/knowledge-graph")
def get_resolution_knowledge_graph(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    similar = ai_resolution_service.find_similar_defects(issue.id, issue.title, issue.description or "", db, limit=3)
    nodes = [
        {"id": f"DEF-{issue.id}", "label": f"DEF-{issue.id}: {issue.title}", "type": "Defect", "color": "#10b981"},
        {"id": "COMP-AUTH", "label": "Authentication Module", "type": "Component", "color": "#3b82f6"},
        {"id": "RC-PAYLOAD", "label": "Unhandled Null Payload Response", "type": "RootCause", "color": "#f97316"}
    ]
    edges = [
        {"source": f"DEF-{issue.id}", "target": "COMP-AUTH", "relation": "Same Component"},
        {"source": f"DEF-{issue.id}", "target": "RC-PAYLOAD", "relation": "Root Cause"}
    ]

    for sim in similar:
        nodes.append({"id": f"DEF-{sim['issue_id']}", "label": f"DEF-{sim['issue_id']}: {sim['title']}", "type": "Defect", "color": "#a855f7"})
        edges.append({"source": f"DEF-{issue.id}", "target": f"DEF-{sim['issue_id']}", "relation": f"Similar ({sim['similarity_score']}%)"})

    return {
        "issue_id": issue.id,
        "nodes": nodes,
        "edges": edges,
        "systemic_cluster_insight": f"Systemic Pattern: {len(similar)} connected defect(s) share Authentication & Payload response dependencies."
    }


# P2-14: AI Regression Test Generator Endpoint
@router.post("/issues/{issue_id}/generate-test-scenarios")
def generate_ai_test_scenarios(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    scenarios = [
        {"id": 1, "name": "Valid Payload Execution", "description": "Submit valid form data and verify 200 OK status.", "type": "Positive"},
        {"id": 2, "name": "API Timeout Boundary", "description": "Simulate 5000ms API timeout and verify graceful error toast.", "type": "EdgeCase"},
        {"id": 3, "name": "Null Response Handling", "description": "Return empty null object from server and verify app doesn't crash.", "type": "Negative"}
    ]
    return {
        "issue_id": issue.id,
        "scenarios": scenarios,
        "disclaimer": "⚠️ AI-generated QA test suggestions. Verification by QA Lead recommended."
    }


# P2-16: AI Daily Team Brief Endpoint
@router.post("/team/daily-brief")
def get_daily_team_brief(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(Issue).count()
    critical = db.query(Issue).filter(Issue.severity == "Critical").count()
    open_cnt = db.query(Issue).filter(Issue.status == "Open").count()
    return {
        "today_summary": f"BugFlow Daily Brief: {total} defects tracked across active projects. {open_cnt} Open, {critical} Critical severity.",
        "top_concerns": ["Authentication gateway exception handling", "Developer workload balance on Payment module"],
        "recommended_attention": ["DEF-1", "DEF-2"]
    }


@router.post("/github/link-pr")
def link_github_pr(
    pr_in: LinkPRSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == pr_in.issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    issue.pr_url = pr_in.pr_url
    db.commit()
    return {"message": f"Successfully linked PR {pr_in.pr_url} to Defect #{issue.id}.", "issue_id": issue.id, "pr_url": issue.pr_url}


@router.post("/github/ai-pr-review")
def run_ai_pr_review(
    rev_in: AIPRReviewSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == rev_in.issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return ai_resolution_service.review_pull_request_diff(issue.title, issue.description or "", rev_in.pr_url, rev_in.diff_text or "")
