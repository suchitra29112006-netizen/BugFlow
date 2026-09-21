from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.issue import Issue
from app.models.user import User
from app.models.milestone4_models import InvestigationWorkspace, InvestigationHypothesis, VerificationTestCase, TestCaseStatus

from app.auth.deps import get_current_user
from app.services.intelligence_service import intelligence_service

router = APIRouter(prefix="/api", tags=["Milestone 4 Intelligence & Predictive Analytics"])


class HumanDecisionSchema(BaseModel):
    decision: str # CONFIRMED_H1, REJECTED, UNDER_INVESTIGATION


class UpdateTestCaseStatusSchema(BaseModel):
    test_case_id: int
    status: str # Not Tested, Passed, Failed, Blocked


class SimulatorPayloadSchema(BaseModel):
    scenario: str
    developer_capacity_pct: int = 80


@router.get("/issues/{issue_id}/fingerprint")
@router.get("/intelligence/fingerprint/{issue_id}")
def get_defect_dna(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.get_or_generate_defect_dna(issue, db)


@router.get("/issues/{issue_id}/recurrence")
@router.get("/intelligence/recurrence-risk/{issue_id}")
def get_recurrence_risk(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.predict_recurrence_risk(issue, db)


@router.get("/issues/{issue_id}/genealogy")
@router.get("/intelligence/family-tree/{issue_id}")
def get_bug_family_tree(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.get_defect_genealogy(issue, db)


@router.get("/issues/{issue_id}/investigation")
@router.get("/intelligence/investigation/{issue_id}")
def get_investigation_workspace(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.get_or_create_investigation(issue, db)


@router.post("/issues/{issue_id}/investigation/decision")
def submit_investigation_decision(
    issue_id: int,
    dec_in: HumanDecisionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(InvestigationWorkspace).filter(InvestigationWorkspace.issue_id == issue_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation workspace not found.")
    
    inv.human_decision = dec_in.decision
    inv.decided_by_user_id = current_user.id
    db.commit()
    return {"message": f"Human investigation decision updated to '{dec_in.decision}'.", "issue_id": issue_id}


class AddHypothesisSchema(BaseModel):
    hypothesis: str


class AddTestCaseSchema(BaseModel):
    test_name: str
    assertion: str


@router.post("/intelligence/investigation/{issue_id}/hypothesis")
def add_hypothesis_endpoint(
    issue_id: int,
    payload: AddHypothesisSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    inv = intelligence_service.get_or_create_investigation(issue, db)
    hyp = InvestigationHypothesis(
        investigation_id=inv["investigation_id"],
        title=payload.hypothesis,
        confidence_pct=75.0,
        status="PROPOSED"
    )
    db.add(hyp)
    db.commit()
    return {"message": "Hypothesis added successfully", "hypothesis_id": hyp.id}


@router.post("/intelligence/investigation/{issue_id}/verification-test")
def add_verification_test_endpoint(
    issue_id: int,
    payload: AddTestCaseSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    vplan = intelligence_service.get_verification_plan(issue, db)
    tc = VerificationTestCase(
        plan_id=vplan["plan_id"],
        title=payload.test_name,
        expected_result=payload.assertion,
        status=TestCaseStatus.PASSED
    )
    db.add(tc)
    db.commit()
    return {"message": "Verification test case added", "test_id": tc.id}




@router.get("/issues/{issue_id}/verification")
@router.get("/intelligence/verification-plan/{issue_id}")
def get_verification_plan(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.get_verification_plan(issue, db)


@router.post("/issues/{issue_id}/verification/test-status")
def update_test_case_status(
    issue_id: int,
    tc_in: UpdateTestCaseStatusSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tc = db.query(VerificationTestCase).filter(VerificationTestCase.id == tc_in.test_case_id).first()
    if not tc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test case not found.")
    
    tc.status = TestCaseStatus(tc_in.status) if tc_in.status in [e.value for e in TestCaseStatus] else tc.status
    db.commit()
    return {"message": f"Test case #{tc.id} status updated to '{tc.status.value}'."}


@router.get("/issues/{issue_id}/quality")
@router.get("/intelligence/quality-score/{issue_id}")
def get_defect_quality_score(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.score_defect_quality(issue, db)



@router.get("/issues/{issue_id}/contradictions")
def get_defect_contradictions(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.detect_contradictions(issue, db)


@router.get("/analytics/forecast")
@router.get("/intelligence/forecast")
def get_defect_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 47: 14-Day Statistical Defect Forecasting.
    """
    return intelligence_service.get_defect_forecast(db)


@router.get("/analytics/hotspots")
@router.get("/intelligence/hotspots")
def get_defect_hotspot_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 22: Defect Hotspot Forecast.
    """
    return intelligence_service.forecast_hotspots(db)


@router.get("/analytics/technical-debt")
@router.get("/intelligence/tech-debt-radar")
def get_technical_debt_radar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 21: Technical Debt Radar.
    """
    return intelligence_service.get_technical_debt_radar(db)


@router.get("/analytics/why")
def get_explainable_why(
    metric: str = Query("backlog", description="Metric to explain"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 23: AI 'Why?' Engine.
    """
    return intelligence_service.explain_metric_why(metric, db)


@router.post("/sprints/simulator")
@router.post("/intelligence/what-if-simulation")
def run_what_if_simulator(
    sim_in: SimulatorPayloadSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 25: What-If Sprint / Release Simulator.
    """
    return intelligence_service.simulate_sprint_scenario(sim_in.model_dump(), db)


@router.post("/releases/generate-notes")
@router.get("/intelligence/release-notes")
def generate_auto_release_notes(
    sprint_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 46: Auto-Generated Release Notes.
    """
    return intelligence_service.generate_release_notes(sprint_id, db)


@router.get("/incidents")
@router.get("/intelligence/incidents")
def get_incidents_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 32 & 33: Incident Mode & Postmortem.
    """
    return intelligence_service.get_incidents(db)


@router.get("/onboarding/{role}")
@router.get("/intelligence/developer-brief")
def get_role_onboarding(
    role: str = "Developer",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phase 30 & 31: Role-Aware Onboarding & 7-Minute Developer Brief.
    """
    return intelligence_service.get_onboarding_brief(role, db)


@router.get("/intelligence/lifecycle-replay/{issue_id}")
def get_defect_lifecycle_replay(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    §9: Defect Lifecycle Replay & Timeline Analysis.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.get_defect_lifecycle_replay(issue, db)


@router.get("/intelligence/defect-origin/{issue_id}")
def get_defect_origin_analysis(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    §10: Defect Origin Analysis.
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return intelligence_service.get_defect_origin_analysis(issue, db)


@router.get("/intelligence/rule-suggestions")
def get_ai_rule_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    §5: AI Business Rule Advisor suggestions.
    """
    return intelligence_service.get_ai_rule_suggestions(db)


