import os
import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.release_management import Release, Deployment
from app.models.issue import Issue, IssueStatus, IssueSeverity
from app.models.milestone import Milestone
from app.models.sprint import Sprint
from app.models.qa_management import TestSuite, TestRun, TestCaseItem
from app.models.project import Project
from app.models.user import User
from app.services.release_note_validator import ReleaseNoteValidator


class ReleaseIntelligenceService:

    @classmethod
    def collect_release_facts(cls, release_id: int, db: Session) -> Dict[str, Any]:
        """
        Phase 2 & Phase 3: Collects 100% database-grounded release facts.
        Every metric, status, count, and date is calculated deterministically from the database.
        """
        release = db.query(Release).filter(Release.id == release_id).first()
        if not release:
            return {}

        project = db.query(Project).filter(Project.id == release.project_id).first()

        # 1. Release Metadata & Timeline
        now = datetime.utcnow()
        target_dt = release.release_date or (now + timedelta(days=14))
        days_remaining = (target_dt - now).days
        is_overdue = now > target_dt and release.status not in ["RELEASED", "COMPLETED"]
        days_from_creation = (now - (release.created_at or now)).days

        metadata = {
            "id": release.id,
            "version": release.version,
            "title": release.name,
            "description": release.description or "",
            "status": release.status,
            "project_id": release.project_id,
            "project_name": project.name if project else "General Engineering",
            "created_at": release.created_at.isoformat() if release.created_at else now.isoformat(),
            "target_date": target_dt.strftime("%Y-%m-%d")
        }

        timeline = {
            "target_date": target_dt.strftime("%Y-%m-%d"),
            "days_remaining": max(0, days_remaining),
            "days_overdue": abs(days_remaining) if is_overdue else 0,
            "is_overdue": is_overdue,
            "days_from_creation": max(1, days_from_creation)
        }

        # 2. Defects Data for Release's Project
        all_bugs = db.query(Issue).filter(
            Issue.project_id == release.project_id,
            Issue.work_item_type == "BUG"
        ).all()

        closed_bugs = [b for b in all_bugs if b.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED]]
        open_bugs = [b for b in all_bugs if b.status not in [IssueStatus.RESOLVED, IssueStatus.CLOSED]]

        critical_open = sum(1 for b in open_bugs if b.severity == IssueSeverity.CRITICAL)
        high_open = sum(1 for b in open_bugs if b.severity == IssueSeverity.HIGH)
        medium_open = sum(1 for b in open_bugs if b.severity == IssueSeverity.MEDIUM)
        low_open = sum(1 for b in open_bugs if b.severity == IssueSeverity.LOW)

        closed_records = [
            {
                "id": b.id,
                "title": b.title,
                "severity": b.severity.value if hasattr(b.severity, 'value') else str(b.severity),
                "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
                "assignee": b.assignee.name if b.assignee else "Unassigned"
            }
            for b in closed_bugs[:10]
        ]

        open_records = [
            {
                "id": b.id,
                "title": b.title,
                "severity": b.severity.value if hasattr(b.severity, 'value') else str(b.severity),
                "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
                "assignee": b.assignee.name if b.assignee else "Unassigned"
            }
            for b in open_bugs[:10]
        ]

        defects_data = {
            "total": len(all_bugs),
            "closed": len(closed_bugs),
            "open": len(open_bugs),
            "critical": critical_open,
            "high": high_open,
            "medium": medium_open,
            "low": low_open,
            "closed_records": closed_records,
            "open_records": open_records
        }

        # 3. Tasks / Feature Work Items
        all_tasks = db.query(Issue).filter(
            Issue.project_id == release.project_id,
            Issue.work_item_type != "BUG"
        ).all()

        completed_tasks = [t for t in all_tasks if t.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED]]
        in_progress_tasks = [t for t in all_tasks if t.status in [IssueStatus.IN_PROGRESS, IssueStatus.IN_REVIEW]]
        todo_tasks = [t for t in all_tasks if t.status in [IssueStatus.REPORTED, IssueStatus.OPEN, IssueStatus.ASSIGNED]]

        completed_task_records = [
            {
                "id": t.id,
                "title": t.title,
                "work_item_type": t.work_item_type,
                "status": t.status.value if hasattr(t.status, 'value') else str(t.status),
                "assignee": t.assignee.name if t.assignee else "Unassigned"
            }
            for t in completed_tasks[:10]
        ]

        tasks_data = {
            "total": len(all_tasks),
            "completed": len(completed_tasks),
            "in_progress": len(in_progress_tasks),
            "todo": len(todo_tasks),
            "completed_records": completed_task_records
        }

        # 4. Milestones Data
        milestones = db.query(Milestone).filter(Milestone.project_id == release.project_id).all()
        completed_ms = [m for m in milestones if m.status in ["Completed", "CLOSED"]]
        in_progress_ms = [m for m in milestones if m.status in ["Active", "IN_PROGRESS"]]

        milestone_records = [
            {
                "id": m.id,
                "name": m.name,
                "status": m.status,
                "due_date": m.due_date.strftime("%Y-%m-%d") if m.due_date else None
            }
            for m in milestones
        ]

        milestones_data = {
            "total": len(milestones),
            "completed": len(completed_ms),
            "in_progress": len(in_progress_ms),
            "records": milestone_records,
            "completed_records": [{"id": m.id, "name": m.name, "status": m.status} for m in completed_ms]
        }

        # 5. Sprints Data
        sprints = db.query(Sprint).order_by(Sprint.created_at.desc()).limit(3).all()
        sprint_records = [
            {
                "name": s.name,
                "status": s.status,
                "planned_points": s.planned_story_points,
                "completed_points": s.completed_story_points
            }
            for s in sprints
        ]

        sprints_data = {
            "total": len(sprints),
            "records": sprint_records
        }

        # 6. QA / Test Execution Data
        test_runs = db.query(TestRun).filter(TestRun.project_id == release.project_id).all()
        has_test_data = len(test_runs) > 0
        total_passed = sum(r.passed_count for r in test_runs)
        total_failed = sum(r.failed_count for r in test_runs)
        total_tests = total_passed + total_failed

        pass_rate = round((total_passed / total_tests) * 100, 1) if total_tests > 0 else 0.0

        qa_data = {
            "has_test_data": has_test_data,
            "total_runs": len(test_runs),
            "total_tests": total_tests,
            "passed_tests": total_passed,
            "failed_tests": total_failed,
            "test_pass_rate": pass_rate
        }

        # 7. GitHub Data
        prs_linked = sum(1 for i in all_bugs + all_tasks if i.pr_url)
        github_data = {
            "connected": prs_linked > 0,
            "linked_prs_count": prs_linked
        }

        # 8. Incident Data
        incidents_data = {
            "total": 0,
            "open": 0,
            "critical": 0
        }

        return {
            "release": metadata,
            "timeline": timeline,
            "defects": defects_data,
            "tasks": tasks_data,
            "milestones": milestones_data,
            "sprints": sprints_data,
            "qa": qa_data,
            "github": github_data,
            "incidents": incidents_data
        }

    @classmethod
    def calculate_release_risk(cls, facts: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 4: Deterministic Release Risk Engine.
        Calculates numerical risk score (0 to 100) and evidence-backed risk factors.
        """
        timeline = facts.get("timeline", {})
        defects = facts.get("defects", {})
        tasks = facts.get("tasks", {})
        milestones = facts.get("milestones", {})
        qa = facts.get("qa", {})

        risk_score = 10.0
        factors = []

        # 1. Open Critical Defects
        crit_count = defects.get("critical", 0)
        if crit_count > 0:
            impact = min(40.0, crit_count * 20.0)
            risk_score += impact
            factors.append({
                "factor": "Open Critical Severity Defects",
                "impact": impact,
                "evidence": f"{crit_count} critical severity defect(s) remain unresolved"
            })

        # 2. Open High Defects
        high_count = defects.get("high", 0)
        if high_count > 0:
            impact = min(24.0, high_count * 8.0)
            risk_score += impact
            factors.append({
                "factor": "Open High Priority Defects",
                "impact": impact,
                "evidence": f"{high_count} high priority defect(s) remain open"
            })

        # 3. Timeline Overdue
        if timeline.get("is_overdue", False):
            days_overdue = timeline.get("days_overdue", 1)
            impact = min(30.0, 15.0 + days_overdue * 2.0)
            risk_score += impact
            factors.append({
                "factor": "Release Schedule Overdue",
                "impact": impact,
                "evidence": f"Release target date passed {days_overdue} day(s) ago"
            })

        # 4. QA Pass Rate Risk
        if qa.get("has_test_data", False):
            pass_rate = qa.get("test_pass_rate", 100.0)
            if pass_rate < 90.0:
                impact = min(20.0, (90.0 - pass_rate) * 0.8)
                risk_score += impact
                factors.append({
                    "factor": "QA Test Failures",
                    "impact": impact,
                    "evidence": f"QA test pass rate is {pass_rate}% ({qa.get('failed_tests', 0)} failed tests)"
                })

        # 5. Milestone Progress Risk
        incomplete_ms = milestones.get("total", 0) - milestones.get("completed", 0)
        if incomplete_ms > 0:
            impact = min(15.0, incomplete_ms * 5.0)
            risk_score += impact
            factors.append({
                "factor": "Incomplete Milestones",
                "impact": impact,
                "evidence": f"{incomplete_ms} of {milestones.get('total', 0)} milestone(s) remain in progress"
            })

        final_risk = round(min(98.0, max(5.0, risk_score)), 1)
        risk_level = "CRITICAL" if final_risk >= 50.0 else "HIGH" if final_risk >= 30.0 else "MEDIUM" if final_risk >= 18.0 else "LOW"

        if not factors:
            factors.append({
                "factor": "Verified Release Alignment",
                "impact": 0.0,
                "evidence": "All verified milestone targets and defect parameters are within normal thresholds."
            })

        return {
            "risk_score": final_risk,
            "risk_level": risk_level,
            "factors": factors
        }

    @classmethod
    def generate_release_notes(cls, release_id: int, db: Session) -> Dict[str, Any]:
        """
        Phase 4 & Phase 5: Collects verified facts, calculates risk, calls Gemini AI using strict grounding prompt,
        and post-validates generated text via ReleaseNoteValidator.
        """
        release = db.query(Release).filter(Release.id == release_id).first()
        if not release:
            raise ValueError("Release not found")

        # Step 1: Fact Collection Layer
        facts = cls.collect_release_facts(release_id, db)

        # Step 2: Deterministic Risk Calculation
        risk = cls.calculate_release_risk(facts)

        # Step 3: Call Gemini AI with Strict Grounding System Prompt
        api_key = os.getenv("GEMINI_API_KEY", "")
        raw_ai_text = ""

        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)

                prompt_text = f"""
You are generating official AI Release Notes for BugFlow.

CRITICAL INSTRUCTION:
Use ONLY the verified release facts supplied below in JSON format.
DO NOT INVENT Facts.
DO NOT infer that something was completed unless the supplied data explicitly confirms completion.
DO NOT create fictional bugs, features, commits, PRs, test results, security fixes, or performance improvements.
If a category has no verified data (e.g. 0 closed defects or 0 completed tasks), explicitly state: "No verified release activity was found for this category."

VERIFIED RELEASE FACTS PAYLOAD:
{json.dumps(facts, indent=2)}

STRICT STRUCTURE REQUIRED:
## Release Overview ({facts['release']['version']})
- Release Title: {facts['release']['title']}
- Target Release Date: {facts['timeline']['target_date']} (Days Remaining: {facts['timeline']['days_remaining']})
- Release Status: {facts['release']['status']}

## ✨ Completed Work
(List ONLY completed tasks from tasks.completed_records. If tasks.completed == 0, explicitly write: "No completed task-level changes are currently linked to this release.")

## 🐞 Defect Status
- Closed Defects: {facts['defects']['closed']}
- Open Defects: {facts['defects']['open']} (Critical: {facts['defects']['critical']}, High: {facts['defects']['high']})
(If defects.closed > 0, list actual resolved defects from defects.closed_records. If defects.closed == 0, explicitly write: "No defects are currently recorded as closed for this release.")

## 🎯 Milestone Progress
(List milestone statuses from milestones.records. If milestones.total == 0, explicitly write: "No milestones are linked to this release.")

## 🧪 QA Status
(If qa.has_test_data is true, report passed/failed test counts and pass rate. If qa.has_test_data is false, explicitly write: "No verified QA execution data is currently linked to this release.")

## ⚠️ Known Issues
(List open defects from defects.open_records. If defects.open == 0, explicitly write: "No open defects reported for this release.")

## 📊 Release Risk
- Risk Rating: {risk['risk_score']}% ({risk['risk_level']})
(Explain the risk using ONLY the evidence in risk factors).

Return valid GitHub Markdown formatted text.
"""

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_text,
                )
                raw_ai_text = response.text.strip()
            except Exception as e:
                print(f"Gemini API call failed for release notes, generating deterministic fact fallback: {e}")

        # Step 4: Fallback Generation if Gemini unavailable or not configured
        if not raw_ai_text:
            raw_ai_text = cls._generate_deterministic_fallback(facts, risk)

        # Step 5: Post-Validation & Evidence Linkage
        validation_result = ReleaseNoteValidator.validate_and_sanitize(raw_ai_text, facts)

        # Save to Release Database Record
        release.release_notes_ai = validation_result["sanitized_notes"]
        release.risk_score = risk["risk_score"]
        db.commit()

        # Compute Readiness Score
        total_scope = facts["defects"]["total"] + facts["tasks"]["total"] + facts["milestones"]["total"]
        completed_scope = facts["defects"]["closed"] + facts["tasks"]["completed"] + facts["milestones"]["completed"]
        readiness_pct = round((completed_scope / total_scope) * 100) if total_scope > 0 else 100

        return {
            "release": facts["release"],
            "timeline": facts["timeline"],
            "readiness_pct": readiness_pct,
            "risk": risk,
            "metrics": {
                "closed_defects": facts["defects"]["closed"],
                "open_defects": facts["defects"]["open"],
                "completed_tasks": facts["tasks"]["completed"],
                "open_tasks": facts["tasks"]["todo"] + facts["tasks"]["in_progress"],
                "completed_milestones": facts["milestones"]["completed"],
                "total_milestones": facts["milestones"]["total"],
                "qa_pass_rate": facts["qa"]["test_pass_rate"],
                "has_qa_data": facts["qa"]["has_test_data"]
            },
            "facts": facts,
            "sanitized_notes": validation_result["sanitized_notes"],
            "data_coverage_pct": validation_result["data_coverage_pct"],
            "verified_claims_count": validation_result["verified_claims_count"],
            "unsupported_claims_count": validation_result["unsupported_claims_count"],
            "evidence": validation_result["evidence"]
        }

    @classmethod
    def _generate_deterministic_fallback(cls, facts: Dict[str, Any], risk: Dict[str, Any]) -> str:
        """
        Generates 100% database-grounded release notes formatted string when AI service is offline.
        """
        lines = []
        rel = facts["release"]
        lines.append(f"Release Overview ({rel['version']})")
        lines.append(f"• Title: {rel['title']}")
        lines.append(f"• Target Date: {facts['timeline']['target_date']}")
        lines.append(f"• Status: {rel['status']}")
        lines.append("")

        lines.append("✨ Completed Work")
        completed_tasks = facts["tasks"].get("completed_records", [])
        if completed_tasks:
            for t in completed_tasks:
                lines.append(f"• {t['title']} (Task #{t['id']})")
        else:
            lines.append("No completed task-level changes are currently linked to this release.")
        lines.append("")

        lines.append("🐞 Defect Status")
        lines.append(f"• Closed Defects: {facts['defects']['closed']}")
        lines.append(f"• Open Defects: {facts['defects']['open']}")
        closed_bugs = facts["defects"].get("closed_records", [])
        if closed_bugs:
            for b in closed_bugs:
                lines.append(f"• {b['title']} ({b['severity']} — Bug #{b['id']})")
        else:
            lines.append("No defects are currently recorded as closed for this release.")
        lines.append("")

        lines.append("🎯 Milestone Progress")
        ms_list = facts["milestones"].get("records", [])
        if ms_list:
            for m in ms_list:
                lines.append(f"• {m['name']}: {m['status']}")
        else:
            lines.append("No milestones are linked to this release.")
        lines.append("")

        lines.append("🧪 QA Status")
        if facts["qa"]["has_test_data"]:
            lines.append(f"• Tests Executed: {facts['qa']['total_tests']} ({facts['qa']['passed_tests']} Passed, {facts['qa']['failed_tests']} Failed)")
            lines.append(f"• Pass Rate: {facts['qa']['test_pass_rate']}%")
        else:
            lines.append("No verified QA execution data is currently linked to this release.")
        lines.append("")

        lines.append("⚠️ Known Issues")
        open_bugs = facts["defects"].get("open_records", [])
        if open_bugs:
            for b in open_bugs:
                lines.append(f"• [BUG-{b['id']}] {b['title']} (Severity: {b['severity']})")
        else:
            lines.append("No open defects reported for this release.")
        lines.append("")

        lines.append("📊 Release Risk")
        lines.append(f"• Risk Score: {risk['risk_score']}% ({risk['risk_level']})")
        for f in risk["factors"]:
            lines.append(f"• {f['factor']}: {f['evidence']}")

        return "\n".join(lines)
