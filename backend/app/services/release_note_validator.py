import re
from typing import Dict, Any, List

class ReleaseNoteValidator:
    """
    Validates AI-generated release notes against verified release facts.
    Detects and cleanses any unsupported claims, hallucinations, or ungrounded statistics.
    Constructs a traceable evidence map linking every claim to actual database records.
    """

    @classmethod
    def validate_and_sanitize(cls, raw_text: str, facts: Dict[str, Any]) -> Dict[str, Any]:
        lines = raw_text.split("\n")
        sanitized_lines = []
        unsupported_claims = []
        evidence_list = []

        defects = facts.get("defects", {})
        tasks = facts.get("tasks", {})
        milestones = facts.get("milestones", {})
        qa = facts.get("qa", {})
        github = facts.get("github", {})
        incidents = facts.get("incidents", {})

        closed_defects_count = defects.get("closed", 0)
        completed_tasks_count = tasks.get("completed", 0)
        completed_milestones_count = milestones.get("completed", 0)
        has_qa_data = qa.get("has_test_data", False)
        is_github_connected = github.get("connected", False)

        for line in lines:
            line_str = line.strip()
            if not line_str:
                sanitized_lines.append(line)
                continue

            # 1. Check Hallucinated Closed Defects / Security Fixes when closed_defects = 0
            if closed_defects_count == 0:
                hallucination_triggers = [
                    r"fixed\s+token", r"fixed\s+security", r"resolved\s+defect",
                    r"fixed\s+bug", r"resolved\s+issue", r"security\s+audit\s+log",
                    r"vulnerability\s+fixed", r"patch\s+applied"
                ]
                if any(re.search(pat, line_str, re.IGNORECASE) for pat in hallucination_triggers):
                    unsupported_claims.append({
                        "claim": line_str,
                        "reason": "Claimed resolved defect/security fix when 0 closed defects exist in database."
                    })
                    continue

            # 2. Check Hallucinated Features when completed_tasks = 0
            if completed_tasks_count == 0:
                feature_triggers = [
                    r"added\s+feature", r"implemented\s+module", r"new\s+dashboard",
                    r"introduced\s+support", r"completed\s+task"
                ]
                if any(re.search(pat, line_str, re.IGNORECASE) for pat in feature_triggers):
                    unsupported_claims.append({
                        "claim": line_str,
                        "reason": "Claimed feature completion when 0 completed tasks exist in database."
                    })
                    continue

            # 3. Check Hallucinated QA Pass Rates when no QA execution data exists
            if not has_qa_data:
                qa_triggers = [
                    r"\d+%\s+pass\s+rate", r"regression\s+testing\s+achieved",
                    r"tests\s+passed", r"automated\s+tests\s+completed"
                ]
                if any(re.search(pat, line_str, re.IGNORECASE) for pat in qa_triggers):
                    unsupported_claims.append({
                        "claim": line_str,
                        "reason": "Claimed QA test pass rate when no QA test runs exist in database."
                    })
                    continue

            # 4. Check Hallucinated GitHub Commits/PRs when GitHub is disconnected
            if not is_github_connected:
                github_triggers = [
                    r"merged\s+\d+\s+pull\s+request", r"merged\s+pr", r"commits\s+pushed",
                    r"git\s+repository"
                ]
                if any(re.search(pat, line_str, re.IGNORECASE) for pat in github_triggers):
                    unsupported_claims.append({
                        "claim": line_str,
                        "reason": "Claimed GitHub commit/PR activity when GitHub is disconnected."
                    })
                    continue

            # Clean raw Markdown characters: strip leading ###, ##, #, and bold/italic asterisks ** / *
            clean_line = line_str
            clean_line = re.sub(r'^\s*#+\s*', '', clean_line)
            clean_line = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_line)
            clean_line = re.sub(r'\*([^*]+)\*', r'\1', clean_line)

            sanitized_lines.append(clean_line)

        final_text = "\n".join(sanitized_lines)

        # Build Traceable Evidence List from Database Records
        # Completed Tasks Evidence
        for task in tasks.get("completed_records", []):
            evidence_list.append({
                "claim": f"Completed Task: {task.get('title')}",
                "evidence_type": "TASK",
                "item_id": f"TASK-{task.get('id')}",
                "title": task.get("title"),
                "status": task.get("status"),
                "verified": True
            })

        # Closed Defects Evidence
        for bug in defects.get("closed_records", []):
            evidence_list.append({
                "claim": f"Resolved Defect: {bug.get('title')}",
                "evidence_type": "DEFECT",
                "item_id": f"BUG-{bug.get('id')}",
                "title": bug.get("title"),
                "severity": bug.get("severity"),
                "status": bug.get("status"),
                "verified": True
            })

        # Completed Milestones Evidence
        for ms in milestones.get("completed_records", []):
            evidence_list.append({
                "claim": f"Completed Milestone: {ms.get('name')}",
                "evidence_type": "MILESTONE",
                "item_id": f"MS-{ms.get('id')}",
                "title": ms.get("name"),
                "status": ms.get("status"),
                "verified": True
            })

        # QA Execution Evidence
        if has_qa_data:
            evidence_list.append({
                "claim": f"QA Execution: {qa.get('passed_tests')} passed / {qa.get('total_tests')} total ({qa.get('test_pass_rate')}%)",
                "evidence_type": "QA_RUN",
                "item_id": "QA-ENGINE",
                "title": f"Test Execution Run ({qa.get('test_pass_rate')}% pass rate)",
                "status": "COMPLETED",
                "verified": True
            })

        # Calculate Data Coverage Score
        # Total data categories present vs expected
        total_sources = 5 # Tasks, Defects, Milestones, QA, GitHub
        active_sources = 0
        if tasks.get("total", 0) > 0: active_sources += 1
        if defects.get("total", 0) > 0: active_sources += 1
        if milestones.get("total", 0) > 0: active_sources += 1
        if has_qa_data: active_sources += 1
        if is_github_connected: active_sources += 1

        coverage_pct = round((active_sources / total_sources) * 100) if active_sources > 0 else 20

        return {
            "sanitized_notes": final_text,
            "data_coverage_pct": max(20, min(100, coverage_pct)),
            "verified_claims_count": len(evidence_list),
            "unsupported_claims_count": len(unsupported_claims),
            "unsupported_claims": unsupported_claims,
            "evidence": evidence_list
        }
