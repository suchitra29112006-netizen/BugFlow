from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.knowledge_base import KnowledgeArticle, TechnicalDebtItem
from app.models.project import Project

router = APIRouter(prefix="/api/v1/knowledge-base", tags=["Knowledge Base & Tech Debt"])

class ArticleCreate(BaseModel):
    title: str
    category: Optional[str] = "Architecture"
    content_markdown: str
    tags: Optional[str] = None

class DebtCreate(BaseModel):
    project_id: int
    module: str
    description: str
    estimated_effort_hours: Optional[float] = 16.0

@router.get("/articles")
def get_articles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    articles = db.query(KnowledgeArticle).all()
    if not articles:
        a1 = KnowledgeArticle(
            title="Authentication & JWT Token Rotation Architecture",
            category="Architecture",
            content_markdown="## BugFlow Token Lifecycle\nBugFlow uses dual-layer JWT access tokens & refresh tokens stored securely with PBKDF2 hash validation.",
            tags="auth, jwt, security",
            author_id=current_user.id
        )
        a2 = KnowledgeArticle(
            title="Defect DNA Fingerprinting Engine Guide",
            category="AI Intelligence",
            content_markdown="## Defect DNA\nFingerprints normalize exception trace tokens, components, and pattern signatures to calculate recurrence probabilities.",
            tags="defect-dna, ai, similarity",
            author_id=current_user.id
        )
        db.add_all([a1, a2])
        db.commit()
        articles = db.query(KnowledgeArticle).all()

    return articles

@router.post("/articles", status_code=status.HTTP_201_CREATED)
def create_article(payload: ArticleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    art = KnowledgeArticle(
        title=payload.title,
        category=payload.category or "Architecture",
        content_markdown=payload.content_markdown,
        tags=payload.tags,
        author_id=current_user.id
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art

@router.get("/technical-debt")
def get_technical_debt(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    debt_items = db.query(TechnicalDebtItem).all()
    if not debt_items:
        proj = db.query(Project).first()
        if proj:
            d1 = TechnicalDebtItem(
                project_id=proj.id,
                module="Authentication Middleware",
                description="Legacy session validation middleware lacks connection pooling logic, causing occasional timeouts under burst load.",
                impact_score=68.0,
                estimated_effort_hours=24.0,
                status="IDENTIFIED"
            )
            d2 = TechnicalDebtItem(
                project_id=proj.id,
                module="Dashboard Analytics Cache",
                description="Direct SQL query aggregation in dashboard requires redis caching decorator to reduce query latency.",
                impact_score=42.0,
                estimated_effort_hours=12.0,
                status="IDENTIFIED"
            )
            db.add_all([d1, d2])
            db.commit()
            debt_items = db.query(TechnicalDebtItem).all()

    return debt_items

@router.post("/technical-debt", status_code=status.HTTP_201_CREATED)
def create_technical_debt(payload: DebtCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = TechnicalDebtItem(
        project_id=payload.project_id,
        module=payload.module,
        description=payload.description,
        estimated_effort_hours=payload.estimated_effort_hours or 16.0,
        impact_score=65.0,
        status="IDENTIFIED"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

class DebtStatusUpdate(BaseModel):
    status: str

@router.put("/technical-debt/{debt_id}/status")
def update_technical_debt_status(debt_id: int, payload: DebtStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(TechnicalDebtItem).filter(TechnicalDebtItem.id == debt_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Technical Debt item not found")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return item

@router.delete("/technical-debt/{debt_id}")
def delete_technical_debt(debt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(TechnicalDebtItem).filter(TechnicalDebtItem.id == debt_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Technical Debt item not found")
    db.delete(item)
    db.commit()
    return {"success": True}

@router.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    art = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(art)
    db.commit()
    return {"success": True}
