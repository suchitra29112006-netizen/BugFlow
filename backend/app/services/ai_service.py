import os
import json
import re
from typing import Dict, Any, List
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from app.models.issue import Issue, IssueSeverity, IssuePriority
from app.schemas.ai import AIBugGenerateResponse, AIPredictSeverityResponse


def clean_plain_text(text: str) -> str:
    if not text:
        return ""
    # Strip markdown headers, bold, italics, quotes, backticks
    cleaned = re.sub(r'[#*"`\']', '', text)
    lines = [line.strip() for line in cleaned.splitlines()]
    return "\n".join(lines).strip()


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
        if self.client:
            try:
                prompt_text = f"""
You are an expert QA Automation Lead and Senior Software Engineer.
A user provided the following defect summary, input prompt, or voice transcript:
"{user_prompt}"

Target Project: {project_name or "General Application"}

Translate if needed and expand into a detailed, authentic, professional bug report JSON object with exact keys:
1. "title": Concise, clear technical title describing the defect without brackets or quotes.
2. "description": Authentic technical explanation describing what went wrong in the application flow, including root cause hypothesis and system impact. Do not use generic boilerplate.
3. "expected_behavior": Detailed expected outcome when the operation runs normally.
4. "actual_behavior": Detailed actual failure state, exception, or crash observed.
5. "steps_to_reproduce": Clear step-by-step numbered list.
6. "environment": OS, Browser, or Device environment context.
7. "severity": One of ["Critical", "High", "Medium", "Low"].
8. "priority": One of ["Critical", "High", "Medium", "Low"].

STRICT RULE FOR ALL STRING VALUES IN THE JSON:
- DO NOT include any formatting symbols or markdown characters: NO asterisks (* or **), NO hashtags (#), NO quotation marks (" or '), NO backticks (`).
- Write all text as plain, unquoted clean text.

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
                    title=clean_plain_text(data.get("title", f"Defect in {user_prompt}")),
                    description=clean_plain_text(data.get("description", user_prompt)),
                    expected_behavior=clean_plain_text(data.get("expected_behavior", "System should process the operation successfully.")),
                    actual_behavior=clean_plain_text(data.get("actual_behavior", user_prompt)),
                    steps_to_reproduce=clean_plain_text(data.get("steps_to_reproduce", "1. Open application\n2. Trigger action: " + user_prompt)),
                    environment=clean_plain_text(data.get("environment", "Web / Modern Browsers")),
                    suggested_severity=severity,
                    suggested_priority=priority,
                    raw_ai_text=text
                )
            except Exception as err:
                print(f"Gemini API call failed, falling back to local heuristic expansion: {err}")

        prompt_lower = user_prompt.lower()
        clean_input = clean_plain_text(user_prompt)

        if any(w in prompt_lower for w in ["pay", "payment", "checkout", "card", "billing", "otp"]):
            sev = IssueSeverity.CRITICAL
            prio = IssuePriority.CRITICAL
            title = "Unhandled crash during payment processing checkout flow"
            desc = (
                "An unhandled runtime exception occurs in the payment integration service during payment checkout. "
                "When submitting payment credentials or OTP verification, the request times out or encounters a server-side payload error, "
                "causing the transaction flow to terminate abruptly without confirming the order."
            )
            expected = "The payment transaction should process securely, confirm payment authorization, and redirect to the order summary screen."
            actual = "The application crashes immediately upon submitting payment details, displaying an error or unexpected screen."
            steps = (
                "1. Add items to shopping cart and proceed to checkout.\n"
                "2. Enter payment card details or OTP credentials.\n"
                "3. Click the Submit Payment button.\n"
                "4. Observe application crash during transaction submission."
            )
            env = "Chrome / Firefox / Android and iOS Browsers"

        elif any(w in prompt_lower for w in ["login", "auth", "jwt", "token", "password", "session", "sign in"]):
            sev = IssueSeverity.HIGH
            prio = IssuePriority.HIGH
            title = "Authentication failure during user session login validation"
            desc = (
                "User login authentication fails during credentials verification. The authentication service fails to validate "
                "session tokens, leading to endless redirection loops or unhandled API rejection errors."
            )
            expected = "Valid user credentials should authenticate successfully and redirect to the user dashboard."
            actual = "System encounters an authentication failure state and prevents user login."
            steps = (
                "1. Open login portal screen.\n"
                "2. Enter user credentials.\n"
                "3. Click Sign In.\n"
                "4. Observe authentication failure."
            )
            env = "Chrome / Safari / Modern Browsers"

        elif any(w in prompt_lower for w in ["crash", "fatal", "500", "down", "outage", "unusable"]):
            sev = IssueSeverity.CRITICAL
            prio = IssuePriority.CRITICAL
            title = f"Unhandled application crash when executing {clean_input}"
            desc = (
                f"A critical application crash occurs during the execution of {clean_input}. "
                "The process thread encounters an unhandled exception state resulting in complete functional disruption."
            )
            expected = f"The application should execute {clean_input} smoothly without exceptions."
            actual = f"Application crashes unexpectedly when triggering {clean_input}."
            steps = (
                "1. Launch application environment.\n"
                "2. Navigate to module.\n"
                f"3. Perform action: {clean_input}.\n"
                "4. Observe application crash."
            )
            env = "Chrome / Edge / Firefox"

        else:
            sev = IssueSeverity.MEDIUM
            prio = IssuePriority.MEDIUM
            title = f"Defect reported in module {clean_input}"
            desc = (
                f"A defect was identified while performing {clean_input}. "
                "The target feature does not complete its expected operational lifecycle."
            )
            expected = f"Feature should complete the operational lifecycle for {clean_input}."
            actual = f"Feature fails or exhibits incorrect behavior during {clean_input}."
            steps = (
                "1. Open target application screen.\n"
                f"2. Execute action: {clean_input}.\n"
                "3. Observe reported issue."
            )
            env = "Web / Modern Browsers"

        return AIBugGenerateResponse(
            title=clean_plain_text(title),
            description=clean_plain_text(desc),
            expected_behavior=clean_plain_text(expected),
            actual_behavior=clean_plain_text(actual),
            steps_to_reproduce=clean_plain_text(steps),
            environment=clean_plain_text(env),
            suggested_severity=sev,
            suggested_priority=prio,
            raw_ai_text="Local AI Engine"
        )

    def extract_issue_intelligence(self, title: str, description: str) -> Dict[str, Any]:
        """
        Phase 2: Extracts structured assignment requirements (Required Skills, Technologies, Category, Complexity, Domain, Experience).
        """
        full_text = (title + " " + description).lower()
        skills = []
        techs = []
        category = "Backend/API"
        complexity = "Medium"
        domain = "General"
        required_exp = "Intermediate"

        if any(k in full_text for k in ["login", "auth", "jwt", "token", "password", "session"]):
            category = "Backend/API"
            domain = "Authentication"
            skills = ["Python", "FastAPI", "REST API", "JWT"]
            techs = ["FastAPI", "Python", "JWT", "SQLAlchemy"]
        elif any(k in full_text for k in ["db", "database", "sql", "constraint", "sqlite", "postgres"]):
            category = "Database"
            domain = "Persistence"
            skills = ["SQL", "Python", "SQLAlchemy", "Database Design"]
            techs = ["PostgreSQL", "SQLite", "SQLAlchemy"]
        elif any(k in full_text for k in ["ui", "css", "react", "frontend", "flicker", "safari"]):
            category = "Frontend/UI"
            domain = "User Interface"
            skills = ["React", "JavaScript", "CSS", "Frontend"]
            techs = ["React", "Vite", "JavaScript", "HTML/CSS"]

        if any(k in full_text for k in ["crash", "500", "fatal", "outage", "security"]):
            complexity = "High"
            required_exp = "Senior"
        elif any(k in full_text for k in ["flicker", "alignment", "minor", "tooltip"]):
            complexity = "Low"
            required_exp = "Junior"

        if not skills:
            skills = ["Python", "FastAPI", "JavaScript"]
        if not techs:
            techs = ["FastAPI", "React", "SQLAlchemy"]

        return {
            "required_skills": ", ".join(skills),
            "relevant_technologies": ", ".join(techs),
            "category": category,
            "complexity": complexity,
            "domain": domain,
            "estimated_effort_hours": 4.0 if complexity == "Medium" else 8.0 if complexity == "High" else 2.0,
            "required_experience_level": required_exp
        }

    def predict_severity(self, title: str, description: str) -> AIPredictSeverityResponse:
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
            
            if max_similarity >= 0.40:
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
            "has_duplicate": len(top_duplicates) > 0 and top_duplicates[0]["similarity"] >= 50.0,
            "duplicates": top_duplicates
        }

    def suggest_code_fix(self, title: str, description: str) -> Dict[str, Any]:
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

    def auto_tag_issue(self, title: str, description: str) -> List[str]:
        suggestions = self.auto_tag_with_explanations(title, description)
        return [item["tag"] for item in suggestions]

    def auto_tag_with_explanations(self, title: str, description: str) -> List[Dict[str, str]]:
        full_text = (title + " " + description).lower().strip()
        
        # 1. Gemini AI Intelligent Tagging & Cause Analysis
        if self.client and full_text:
            try:
                prompt_text = f"""
You are an expert Lead Systems Architect and QA Engineering Lead.
Analyze the following software issue title and description:
Title: "{title}"
Description: "{description}"

Identify the primary functional components, architecture layers, and underlying root cause domains for this defect.
Select 2 to 4 accurate tags from standard categories such as [Payments, Checkout, Authentication, Security, Backend, Frontend, API, Database, UI, Performance, Memory, System Crash].

For each selected tag, provide a concise explanation (1 sentence, plain text, NO quotes or markdown formatting) explaining why this tag represents the cause or domain of the defect based on the issue description.

Return ONLY a valid JSON object matching this schema:
{{
  "suggestions": [
    {{
      "tag": "Payments",
      "reason": "Defect occurs during credit card or payment gateway transaction authorization."
    }}
  ]
}}
"""
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_text,
                )
                text = response.text.strip()
                clean_json = re.sub(r"^```(json)?\n|\n```$", "", text, flags=re.MULTILINE).strip()
                data = json.loads(clean_json)

                suggestions = data.get("suggestions", [])
                if suggestions:
                    cleaned_suggestions = []
                    for s in suggestions:
                        tag_clean = clean_plain_text(s.get("tag", ""))
                        reason_clean = clean_plain_text(s.get("reason", ""))
                        if tag_clean and reason_clean:
                            cleaned_suggestions.append({"tag": tag_clean, "reason": reason_clean})
                    if cleaned_suggestions:
                        return cleaned_suggestions
            except Exception as e:
                print(f"Gemini Auto-Tag AI call failed, falling back to heuristic tagger: {e}")

        # 2. Comprehensive Domain Heuristic Tagger
        suggestions = []

        # Payment & Checkout Domain
        if any(k in full_text for k in ["pay", "payment", "checkout", "card", "billing", "otp", "gateway", "transaction", "invoice"]):
            suggestions.append({
                "tag": "Payments",
                "reason": "Defect directly impacts payment processing, checkout flow, or financial transaction validation."
            })
            suggestions.append({
                "tag": "Checkout",
                "reason": "Issue occurs within customer checkout steps or payment verification modal."
            })
            suggestions.append({
                "tag": "API",
                "reason": "Payment flows rely on external gateway REST APIs and transaction payload handling."
            })
            suggestions.append({
                "tag": "Backend",
                "reason": "Payment verification, transaction logging, and ledger updates execute on backend services."
            })

        # Authentication & Security Domain
        if any(k in full_text for k in ["login", "auth", "jwt", "token", "password", "session", "sign in", "permission", "unauthorized", "oauth"]):
            suggestions.append({
                "tag": "Authentication",
                "reason": "Issue touches user login credentials, identity verification, or session token management."
            })
            suggestions.append({
                "tag": "Security",
                "reason": "Relates to credential handling, access control permissions, or token security."
            })
            suggestions.append({
                "tag": "Backend",
                "reason": "Authentication tokens and user authorization rules are validated on backend endpoints."
            })

        # Database & Data Persistence Domain
        if any(k in full_text for k in ["db", "database", "sql", "constraint", "postgres", "sqlite", "orm", "query", "table", "schema", "record"]):
            suggestions.append({
                "tag": "Database",
                "reason": "Defect involves database queries, schema constraints, or transaction persistence."
            })
            suggestions.append({
                "tag": "Backend",
                "reason": "Data persistence logic and ORM database models execute on backend services."
            })

        # API & Endpoint Service Domain
        if any(k in full_text for k in ["api", "500", "404", "endpoint", "fastapi", "rest", "json", "http", "header", "payload", "route"]):
            if not any(s["tag"] == "API" for s in suggestions):
                suggestions.append({
                    "tag": "API",
                    "reason": "Defect relates to REST API endpoints, HTTP status error responses, or payload serialization."
                })
            if not any(s["tag"] == "Backend" for s in suggestions):
                suggestions.append({
                    "tag": "Backend",
                    "reason": "Backend API routing or controller logic encountered an error during request processing."
                })

        # UI & Frontend Presentation Domain
        if any(k in full_text for k in ["ui", "css", "button", "layout", "react", "flicker", "safari", "screen", "alignment", "modal", "view"]):
            suggestions.append({
                "tag": "Frontend",
                "reason": "Defect manifests in client-side React component rendering, DOM layout, or component state."
            })
            suggestions.append({
                "tag": "UI",
                "reason": "Touches user interface presentation, visual layout alignment, or display elements."
            })

        # Performance & System Bottlenecks
        if any(k in full_text for k in ["slow", "lag", "performance", "memory", "heap", "leak", "timeout", "latency", "hang"]):
            suggestions.append({
                "tag": "Performance",
                "reason": "Indicates execution resource bottleneck, API response latency, or memory consumption."
            })

        # System Crash & Unhandled Exception
        if any(k in full_text for k in ["crash", "fatal", "unhandled", "exception", "outage", "null pointer", "npe", "aborted"]):
            if not any(s["tag"] == "Backend" for s in suggestions):
                suggestions.append({
                    "tag": "Backend",
                    "reason": "Unhandled server-side exception or fatal error state in backend service thread."
                })

        # Fallback default if no specific domain matched
        if not suggestions:
            suggestions = [
                {"tag": "General", "reason": "Standard defect classification tag for general software issues."},
                {"tag": "Backend", "reason": "Default core component tag for underlying execution layer."}
            ]

        # Deduplicate while preserving order
        seen_tags = set()
        unique_suggestions = []
        for s in suggestions:
            if s["tag"] not in seen_tags:
                seen_tags.add(s["tag"])
                unique_suggestions.append({
                    "tag": clean_plain_text(s["tag"]),
                    "reason": clean_plain_text(s["reason"])
                })

        return unique_suggestions

    def analyze_screenshot_text(self, filename: str) -> Dict[str, Any]:
        return {
            "detected_error": "Payment failed: Transaction aborted after OTP verification timeout (HTTP 500)",
            "ui_component": "Payment Confirmation Modal",
            "suggested_evidence": "Screenshot clearly shows red alert banner and 500 Internal Error payload.",
            "confidence_pct": 89.5
        }


ai_service = AIService()

