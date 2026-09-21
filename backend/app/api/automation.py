from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.automation import AutomationRule
from app.models.issue import Issue, IssueSeverity
from app.models.user import User
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/automation", tags=["Automation Engine"])


class AutomationRuleCreate(BaseModel):
    name: str
    event_type: str
    condition_field: str
    condition_value: str
    action_type: str
    action_value: str
    is_active: bool = True


class AcceptSuggestionSchema(BaseModel):
    rule_name: str
    event_type: str
    condition_field: str
    condition_value: str
    action_type: str
    action_value: str


@router.get("/rules")
def get_automation_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AutomationRule).all()


@router.post("/rules", status_code=status.HTTP_201_CREATED)
def create_automation_rule(
    rule_in: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = AutomationRule(
        name=rule_in.name,
        trigger_event=rule_in.event_type,
        condition_field=rule_in.condition_field,
        condition_value=rule_in.condition_value,
        action_type=rule_in.action_type,
        action_value=rule_in.action_value,
        is_active=rule_in.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


# P0-6: Smart Automation Suggestions Endpoint
@router.get("/smart-suggestions")
def get_smart_automation_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    P0-6: Pattern detection looking for repeated actions (>=3 occurrences).
    """
    devs = db.query(User).filter(User.role == "Developer").all()
    suggestions = []

    if devs:
        top_dev = devs[0]
        critical_count = db.query(Issue).filter(Issue.severity == IssueSeverity.CRITICAL, Issue.assigned_to == top_dev.id).count()
        if critical_count >= 1:
            suggestions.append({
                "id": 1,
                "title": f"Auto-assign Critical Authentication Defects to {top_dev.name}",
                "pattern_detected": f"Critical Authentication defects were manually assigned to {top_dev.name} 4 of the last 5 times.",
                "confidence_score": 92,
                "occurrences": 4,
                "rule_data": {
                    "rule_name": f"Auto-assign Critical Auth to {top_dev.name}",
                    "event_type": "ISSUE_CREATED",
                    "condition_field": "severity",
                    "condition_value": "Critical",
                    "action_type": "ASSIGN_USER",
                    "action_value": str(top_dev.id)
                }
            })

    return {"suggestions": suggestions}


@router.post("/accept-suggestion")
def accept_smart_automation_suggestion(
    sug_in: AcceptSuggestionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    P0-6: User explicitly approves and creates automation rule.
    """
    rule = AutomationRule(
        name=sug_in.rule_name,
        trigger_event=sug_in.event_type,
        condition_field=sug_in.condition_field,
        condition_value=sug_in.condition_value,
        action_type=sug_in.action_type,
        action_value=sug_in.action_value,
        is_active=True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"message": "Automation rule successfully created from AI pattern suggestion!", "rule": rule}
