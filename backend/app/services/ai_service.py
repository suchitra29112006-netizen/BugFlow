import os
import json
import re
from typing import Dict, Any, List
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from app.models.issue import Issue, IssueSeverity, IssuePriority
from app.schemas.ai import AIBugGenerateResponse, AIPredictSeverityResponse


class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: Could not initialize Gemini client: {e}")

    def generate_bug_report(self, user_prompt: str, project_name: str = None) -> AIBugGenerateResponse:
        """
        Takes a short symptom description in any language or voice transcript and expands it into a structured bug report.
        """
        if self.client:
            try:
                prompt_text = f"""
You are an expert QA Automation Lead and Software Engineer.
A user provided the following issue description or voice transcript:
"{user_prompt}"

Target Project: {project_name or "General Application"}

Please translate if needed and expand into a complete professional bug report JSON object with exact keys:
1. "title": Concise English title summarizing the defect.
2. "description": Clear summary of the problem.
3. "expected_behavior": What should happen.
4. "actual_behavior": What actually happens.
5. "steps_to_reproduce": Step-by-step numbered instructions.
6. "environment": Suggested OS/Browser/Platform context.
7. "severity": One of ["Critical", "High", "Medium", "Low"].
8. "priority": One of ["Critical", "High", "Medium", "Low"].

Return ONLY valid JSON matching this schema without markdown codeblocks or commentary.
"""
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_text,
                )
                text = response.text.strip()
                clean_json = re.sub(r"^```(json)?\n|\n```$", "", text, flags=re.MULTILINE).strip()
                data = json.loads(clean_json)

                severity_str = data.get("severity", "Medium")
                priority_str = data.get("priority", "Medium")
                severity = IssueSeverity(severity_str) if severity_str in IssueSeverity._value2member_map_ else IssueSeverity.MEDIUM
                priority = IssuePriority(priority_str) if priority_str in IssuePriority._value2member_map_ else IssuePriority.MEDIUM

                return AIBugGenerateResponse(
                    title=data.get("title", f"Defect: {user_prompt}"),
                    description=data.get("description", user_prompt),
                    expected_behavior=data.get("expected_behavior", "System should operate smoothly without errors."),
                    actual_behavior=data.get("actual_behavior", user_prompt),
                    steps_to_reproduce=data.get("steps_to_reproduce", "1. Open application\n2. Trigger action: " + user_prompt),
                    environment=data.get("environment", "Web / Modern Browsers"),
                    suggested_severity=severity,
                    suggested_priority=priority,
                    raw_ai_text=text
                )
            except Exception as err:
                print(f"Gemini API call failed, falling back to local heuristic expansion: {err}")

        # Fallback multi-language & voice transcript heuristic engine
        prompt_lower = user_prompt.lower()
        if any(w in prompt_lower for w in ["crash", "fatal", "down", "outage", "security", "exploit", "unusable", "ಕ್ರಾಶ್", "खराब"]):
            sev = IssueSeverity.CRITICAL
            prio = IssuePriority.CRITICAL
        elif any(w in prompt_lower for w in ["fail", "error", "broken", "cannot", "can't", "bug", "ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ", "काम नहीं कर रहा"]):
            sev = IssueSeverity.HIGH
            prio = IssuePriority.HIGH
        elif any(w in prompt_lower for w in ["slow", "lag", "layout", "misaligned", "css"]):
            sev = IssueSeverity.LOW
            prio = IssuePriority.LOW
        else:
            sev = IssueSeverity.MEDIUM
            prio = IssuePriority.MEDIUM

        clean_title = user_prompt.strip().capitalize()
        if len(clean_title) > 60:
            clean_title = clean_title[:60] + "..."

        title = f"[Defect Report] {clean_title}"
        desc = (
            f"**Defect Analysis:**\n"
            f"Input Transcript: \"{user_prompt}\"\n\n"
            f"**Summary:** Functional disruption reported requiring investigation."
        )
        expected = "The feature should execute the operation without exceptions or failure states."
        actual = f"Current behavior fails with: '{user_prompt}'"
        steps = (
            "1. Open target application environment.\n"
            "2. Navigate to module.\n"
            f"3. Perform action: '{user_prompt}'.\n"
            "4. Observe defect behavior."
        )
        env = "Chrome / Firefox / Mobile Browsers"

        return AIBugGenerateResponse(
            title=title,
            description=desc,
            expected_behavior=expected,
            actual_behavior=actual,
            steps_to_reproduce=steps,
            environment=env,
            suggested_severity=sev,
            suggested_priority=prio,
            raw_ai_text="Local AI Engine"
        )

    def predict_severity(self, title: str, description: str) -> AIPredictSeverityResponse:
        """
        Analyzes bug title & description to predict severity score, confidence percentage, and reasoning.
        """
        full_text = (title + " " + description).lower().strip()
        
        if not full_text:
            return AIPredictSeverityResponse(
                severity=IssueSeverity.MEDIUM,
                confidence=80.0,
                reasoning="Default severity assigned based on standard triage protocol."
            )

        if any(k in full_text for k in ["crash", "unusable", "database down", "security breach", "data loss", "500 server error", "immediately after login", "app crashes"]):
            sev = IssueSeverity.CRITICAL
            conf = 96.0
            reason = "Application crash or critical system failure prevents all users from using the system."
        elif any(k in full_text for k in ["broken", "fail", "unable to login", "payment error", "exception", "cannot proceed", "timeout"]):
            sev = IssueSeverity.HIGH
            conf = 91.0
            reason = "Core feature or primary user workflow is impaired."
        elif any(k in full_text for k in ["slow", "warning", "incorrect label", "tooltip", "css", "formatting", "flicker"]):
            sev = IssueSeverity.LOW
            conf = 94.0
            reason = "Cosmetic or minor UI display issue with no loss of functional capability."
        else:
            sev = IssueSeverity.MEDIUM
            conf = 85.0
            reason = "Non-critical feature issue with working workaround available."

        return AIPredictSeverityResponse(
            severity=sev,
            confidence=conf,
            reasoning=reason
        )

    def check_duplicates(self, title: str, description: str, project_id: int, db: Session) -> Dict[str, Any]:
        """
        Compares input title & description against existing project issues in DB to detect duplicates.
        """
        if not title and not description:
            return {"has_duplicate": False, "duplicates": []}

        input_str = (title + " " + description).lower().strip()
        existing_issues = db.query(Issue).filter(Issue.project_id == project_id).all() if project_id else db.query(Issue).all()

        duplicates = []
        for issue in existing_issues:
            target_str = (issue.title + " " + issue.description).lower().strip()
            
            ratio = SequenceMatcher(None, input_str, target_str).ratio()
            title_ratio = SequenceMatcher(None, title.lower().strip(), issue.title.lower().strip()).ratio()
            max_similarity = max(ratio, title_ratio)
            
            if max_similarity >= 0.45:
                similarity_pct = round(max_similarity * 100, 1)
                duplicates.append({
                    "issue_id": issue.id,
                    "title": issue.title,
                    "status": issue.status.value,
                    "similarity": similarity_pct,
                    "reasoning": f"High text overlap ({similarity_pct}%) with existing Issue #{issue.id}"
                })

        duplicates.sort(key=lambda x: x["similarity"], reverse=True)
        top_duplicates = duplicates[:3]

        return {
            "has_duplicate": len(top_duplicates) > 0 and top_duplicates[0]["similarity"] >= 55.0,
            "duplicates": top_duplicates
        }

    def suggest_code_fix(self, title: str, description: str) -> Dict[str, Any]:
        """
        Analyzes bug description and predicts probable Root Cause & Code Fix Snippet.
        """
        full_text = (title + " " + description).lower()
        
        if "login" in full_text or "auth" in full_text or "token" in full_text:
            return {
                "root_cause": "Null Pointer or Unhandled Promise Rejection in Authentication Service when handling expired JWT tokens or missing user payload.",
                "fix_snippet": (
                    "// Fix: Validate JWT token payload & add null-safe user check\n"
                    "try {\n"
                    "  const payload = decodeAccessToken(token);\n"
                    "  if (!payload || !payload.sub) throw new AuthException('Invalid Token');\n"
                    "  return await fetchUserProfile(payload.sub);\n"
                    "} catch (err) {\n"
                    "  logger.error('Auth verification failed:', err);\n"
                    "  return res.status(401).json({ detail: 'Authentication token expired or invalid' });\n"
                    "}"
                ),
                "recommendation": "Check authentication middleware error handling and return 401 status instead of crashing worker thread."
            }
        elif "crash" in full_text or "500" in full_text or "database" in full_text:
            return {
                "root_cause": "Unhandled IntegrityError / Unique Constraint Violation on database transaction commit.",
                "fix_snippet": (
                    "# Fix: Wrap DB commit in try-except block to return 400 Bad Request\n"
                    "try:\n"
                    "    db.add(new_record)\n"
                    "    db.commit()\n"
                    "except IntegrityError:\n"
                    "    db.rollback()\n"
                    "    raise HTTPException(status_code=400, detail='Record with unique constraint already exists.')"
                ),
                "recommendation": "Implement database session rollback on IntegrityError to prevent container crash."
            }
        else:
            return {
                "root_cause": "Unhandled exception or undefined variable state during asynchronous API request.",
                "fix_snippet": (
                    "// Fix: Add defensive null check and fallback state\n"
                    "if (!data || typeof data !== 'object') {\n"
                    "  console.warn('Received empty response data');\n"
                    "  return defaultFallbackState;\n"
                    "}"
                ),
                "recommendation": "Enforce strict schema validation and null safety checks on consumer component."
            }


ai_service = AIService()
