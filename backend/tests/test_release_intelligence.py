import pytest
from datetime import datetime, timedelta
from app.models.release_management import Release
from app.models.project import Project
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.milestone import Milestone
from app.services.release_intelligence_service import ReleaseIntelligenceService
from app.services.release_note_validator import ReleaseNoteValidator

def test_closed_defects_zero_no_hallucination(db):
    """Test 1: closed_defects = 0 -> Validator strips any mention of resolved defects."""
    proj = Project(name="Release Test Proj 1", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.0.0", name="Test Release 1", release_date=datetime.utcnow() + timedelta(days=7))
    db.add(rel)
    db.commit()

    facts = ReleaseIntelligenceService.collect_release_facts(rel.id, db)
    assert facts["defects"]["closed"] == 0

    fake_ai_text = "Fixed token expiration handling and security audit logs.\nResolved defect DEF-101."
    validated = ReleaseNoteValidator.validate_and_sanitize(fake_ai_text, facts)

    assert "Fixed token expiration handling" not in validated["sanitized_notes"]
    assert "Resolved defect DEF-101" not in validated["sanitized_notes"]
    assert validated["unsupported_claims_count"] > 0

def test_completed_tasks_zero_no_hallucination(db):
    """Test 2: completed_tasks = 0 -> Validator strips claims of added features."""
    proj = Project(name="Release Test Proj 2", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.1.0", name="Test Release 2")
    db.add(rel)
    db.commit()

    facts = ReleaseIntelligenceService.collect_release_facts(rel.id, db)
    assert facts["tasks"]["completed"] == 0

    fake_ai_text = "Added feature organization switcher.\nImplemented new dashboard."
    validated = ReleaseNoteValidator.validate_and_sanitize(fake_ai_text, facts)

    assert "Added feature" not in validated["sanitized_notes"]
    assert "Implemented new dashboard" not in validated["sanitized_notes"]

def test_no_qa_records_behavior(db):
    """Test 3: No QA records -> Output states QA data unavailable."""
    proj = Project(name="Release Test Proj 3", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.2.0", name="Test Release 3")
    db.add(rel)
    db.commit()

    facts = ReleaseIntelligenceService.collect_release_facts(rel.id, db)
    assert facts["qa"]["has_test_data"] is False

    risk = ReleaseIntelligenceService.calculate_release_risk(facts)
    notes = ReleaseIntelligenceService._generate_deterministic_fallback(facts, risk)

    assert "No verified QA execution data is currently linked to this release." in notes

def test_github_disconnected_behavior(db):
    """Test 4: GitHub disconnected -> No fake commits or PRs."""
    proj = Project(name="Release Test Proj 4", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.3.0", name="Test Release 4")
    db.add(rel)
    db.commit()

    facts = ReleaseIntelligenceService.collect_release_facts(rel.id, db)
    assert facts["github"]["connected"] is False

    fake_text = "Merged 15 pull requests into main branch."
    validated = ReleaseNoteValidator.validate_and_sanitize(fake_text, facts)
    assert "Merged 15 pull requests" not in validated["sanitized_notes"]

def test_verified_completed_task_evidence(db):
    """Test 5: Verified completed task -> Mapped in evidence trace."""
    proj = Project(name="Release Test Proj 5", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.4.0", name="Test Release 5")
    db.add(rel)
    db.commit()

    task = Issue(
        title="Organization Switcher Feature",
        description="Add org switcher",
        work_item_type="FEATURE",
        status=IssueStatus.CLOSED,
        project_id=proj.id,
        reporter_id=1
    )
    db.add(task)
    db.commit()

    facts = ReleaseIntelligenceService.collect_release_facts(rel.id, db)
    assert facts["tasks"]["completed"] == 1

    val = ReleaseNoteValidator.validate_and_sanitize("## Highlights\n- Added Org Switcher", facts)
    assert val["verified_claims_count"] >= 1
    assert any("Organization Switcher" in e["title"] for e in val["evidence"])

def test_open_critical_defect_in_risk(db):
    """Test 6: Open critical bug -> Mentions bug in risk factors and known issues."""
    proj = Project(name="Release Test Proj 6", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.5.0", name="Test Release 6")
    db.add(rel)
    db.commit()

    crit_bug = Issue(
        title="Payment Callback Timeout",
        description="Checkout fails on webhook",
        work_item_type="BUG",
        severity=IssueSeverity.CRITICAL,
        status=IssueStatus.OPEN,
        project_id=proj.id,
        reporter_id=1
    )
    db.add(crit_bug)
    db.commit()

    facts = ReleaseIntelligenceService.collect_release_facts(rel.id, db)
    risk = ReleaseIntelligenceService.calculate_release_risk(facts)

    assert risk["risk_level"] in ["HIGH", "CRITICAL"]
    assert any("Critical" in f["factor"] for f in risk["factors"])

def test_data_consistency_across_queries(db):
    """Test 7: Canonical metrics in facts match UI metrics."""
    proj = Project(name="Release Test Proj 7", description="Test Proj")
    db.add(proj)
    db.commit()

    rel = Release(project_id=proj.id, version="v1.6.0", name="Test Release 7")
    db.add(rel)
    db.commit()

    bug1 = Issue(title="B1", description="D1", work_item_type="BUG", status=IssueStatus.CLOSED, project_id=proj.id, reporter_id=1)
    bug2 = Issue(title="B2", description="D2", work_item_type="BUG", status=IssueStatus.OPEN, project_id=proj.id, reporter_id=1)
    db.add_all([bug1, bug2])
    db.commit()

    res = ReleaseIntelligenceService.generate_release_notes(rel.id, db)
    assert res["metrics"]["closed_defects"] == 1
    assert res["metrics"]["open_defects"] == 1
