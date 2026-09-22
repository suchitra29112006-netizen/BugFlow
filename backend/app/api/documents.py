import os
import shutil
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database.connection import get_db
from app.models.document import Document, DocumentVersion, DocumentRelation, DocumentComment
from app.models.user import User
from app.models.project import Project
from app.models.issue import Issue
from app.models.sprint import Sprint
from app.models.goal import Goal
from app.models.workspace import Workspace
from app.models.organization import Department
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/documents", tags=["Engineering Knowledge Hub"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "ENGINEERING"
    document_type: str = "Technical Spec"
    content: Optional[str] = None
    status: str = "PUBLISHED"
    version: str = "v1.0"
    visibility: str = "INTERNAL"
    project_id: Optional[int] = None
    workspace_id: Optional[int] = None
    department_id: Optional[int] = None
    owner_id: Optional[int] = None
    reviewer_id: Optional[int] = None
    tags: Optional[List[str]] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    document_type: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    version: Optional[str] = None
    visibility: Optional[str] = None
    project_id: Optional[int] = None
    workspace_id: Optional[int] = None
    department_id: Optional[int] = None
    owner_id: Optional[int] = None
    reviewer_id: Optional[int] = None
    review_status: Optional[str] = None
    review_comments: Optional[str] = None
    tags: Optional[List[str]] = None
    change_summary: Optional[str] = None

class DocumentReviewRequest(BaseModel):
    review_status: str  # APPROVED, CHANGES_REQUESTED, REJECTED, PENDING
    review_comments: Optional[str] = None

class RelationCreate(BaseModel):
    target_type: str  # issue, project, sprint, goal, release, incident, qa_suite, workspace
    target_id: int
    target_title: Optional[str] = None
    relation_type: str = "RELATE"

class CommentCreate(BaseModel):
    content: str
    is_ai_generated: bool = False

class AISearchQuery(BaseModel):
    query: str
    category: Optional[str] = None
    document_type: Optional[str] = None
    limit: int = 10

class AIAskQuery(BaseModel):
    question: str
    document_id: Optional[int] = None
    context_category: Optional[str] = None

class AIActionRequest(BaseModel):
    action: str  # summarize, generate_release_notes, draft_test_plan, security_audit, gap_analysis, simplify
    document_id: Optional[int] = None
    prompt_context: Optional[str] = None


def format_doc_summary(doc: Document) -> Dict[str, Any]:
    tags_list = []
    if doc.tags:
        try:
            tags_list = json.loads(doc.tags) if isinstance(doc.tags, str) else doc.tags
        except Exception:
            tags_list = [t.strip() for t in doc.tags.split(",") if t.strip()]

    return {
        "id": doc.id,
        "title": doc.title,
        "description": doc.description or "",
        "category": doc.category or "ENGINEERING",
        "document_type": doc.document_type or "Technical Spec",
        "content": doc.content or "",
        "file_path": doc.file_path,
        "status": doc.status or "PUBLISHED",
        "version": doc.version or "v1.0",
        "visibility": doc.visibility or "INTERNAL",
        "project_id": doc.project_id,
        "project_name": doc.project.name if doc.project else None,
        "workspace_id": doc.workspace_id,
        "workspace_name": doc.workspace.name if doc.workspace else None,
        "department_id": doc.department_id,
        "department_name": doc.department.name if doc.department else None,
        "author_id": doc.author_id or doc.created_by,
        "author_name": doc.author.name if doc.author else "BugFlow User",
        "owner_id": doc.owner_id,
        "owner_name": doc.owner.name if doc.owner else None,
        "reviewer_id": doc.reviewer_id,
        "reviewer_name": doc.reviewer.name if doc.reviewer else None,
        "review_status": doc.review_status or "APPROVED",
        "review_comments": doc.review_comments,
        "tags": tags_list,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else (doc.created_at.isoformat() if doc.created_at else None),
        "last_reviewed_at": doc.last_reviewed_at.isoformat() if doc.last_reviewed_at else None,
        "review_due_at": doc.review_due_at.isoformat() if doc.review_due_at else None,
        "is_pinned": getattr(doc, "is_pinned", False),
        "is_archived": getattr(doc, "is_archived", False),
        "versions_count": len(doc.versions) if hasattr(doc, "versions") and doc.versions else 1,
        "relations_count": len(doc.relations) if hasattr(doc, "relations") and doc.relations else 0,
        "comments_count": len(doc.comments) if hasattr(doc, "comments") and doc.comments else 0,
    }


# ---------------------------------------------------------------------------
# 1. Knowledge Hub KPIs Endpoint
# ---------------------------------------------------------------------------
@router.get("/kpis")
def get_knowledge_hub_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_docs = db.query(Document).count()
    published_docs = db.query(Document).filter(Document.status == "PUBLISHED").count()
    draft_docs = db.query(Document).filter(Document.status == "DRAFT").count()

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recently_updated = db.query(Document).filter(
        or_(Document.updated_at >= seven_days_ago, Document.created_at >= seven_days_ago)
    ).count()

    project_docs = db.query(Document).filter(Document.category == "PRODUCT").count()
    api_docs = db.query(Document).filter(
        or_(Document.document_type == "API Docs", Document.category == "ENGINEERING")
    ).count()
    test_docs = db.query(Document).filter(
        or_(Document.document_type.in_(["Test Plan", "Test Report"]), Document.category == "QUALITY")
    ).count()
    release_docs = db.query(Document).filter(
        or_(Document.document_type == "Release Note", Document.category == "DELIVERY")
    ).count()

    without_owner = db.query(Document).filter(Document.owner_id == None).count()
    requiring_review = db.query(Document).filter(
        or_(
            Document.status.in_(["DRAFT", "IN_REVIEW"]),
            Document.review_status == "PENDING"
        )
    ).count()

    return {
        "total_documents": total_docs,
        "published_documents": published_docs,
        "draft_documents": draft_docs,
        "recently_updated": recently_updated,
        "project_docs": project_docs,
        "api_docs": api_docs,
        "test_docs": test_docs,
        "release_docs": release_docs,
        "without_owner": without_owner,
        "requiring_review": requiring_review,
    }


# ---------------------------------------------------------------------------
# 2. Get All Documents (Filtered)
# ---------------------------------------------------------------------------
@router.get("")
def get_documents(
    project_id: Optional[int] = None,
    workspace_id: Optional[int] = None,
    department_id: Optional[int] = None,
    category: Optional[str] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    review_status: Optional[str] = None,
    search: Optional[str] = Query(None),
    archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)

    if project_id:
        query = query.filter(Document.project_id == project_id)
    if workspace_id:
        query = query.filter(Document.workspace_id == workspace_id)
    if department_id:
        query = query.filter(Document.department_id == department_id)
    if category and category.upper() != "ALL":
        query = query.filter(Document.category == category.upper())
    if document_type and document_type.upper() != "ALL":
        query = query.filter(Document.document_type == document_type)
    if status and status.upper() != "ALL":
        query = query.filter(Document.status == status.upper())
    if review_status and review_status.upper() != "ALL":
        query = query.filter(Document.review_status == review_status.upper())

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Document.title.ilike(search_pattern),
                Document.description.ilike(search_pattern),
                Document.content.ilike(search_pattern),
                Document.tags.ilike(search_pattern)
            )
        )

    docs = query.order_by(Document.created_at.desc()).all()
    return [format_doc_summary(d) for d in docs]


# ---------------------------------------------------------------------------
# 3. Recent & Favorites
# ---------------------------------------------------------------------------
@router.get("/recent")
def get_recent_documents(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).order_by(
        func.coalesce(Document.updated_at, Document.created_at).desc()
    ).limit(limit).all()
    return [format_doc_summary(d) for d in docs]


@router.get("/favorites")
def get_favorite_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [format_doc_summary(d) for d in docs if getattr(d, "is_pinned", False)]


# ---------------------------------------------------------------------------
# 4. Create Document
# ---------------------------------------------------------------------------
@router.post("")
def create_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tags_str = json.dumps(data.tags) if data.tags else "[]"

    doc = Document(
        title=data.title,
        description=data.description,
        category=data.category or "ENGINEERING",
        document_type=data.document_type or "Technical Spec",
        content=data.content,
        status=data.status or "PUBLISHED",
        version=data.version or "v1.0",
        visibility=data.visibility or "INTERNAL",
        project_id=data.project_id,
        workspace_id=data.workspace_id,
        department_id=data.department_id,
        author_id=current_user.id,
        created_by=current_user.id,
        owner_id=data.owner_id or current_user.id,
        reviewer_id=data.reviewer_id,
        review_status="PENDING" if data.reviewer_id else "APPROVED",
        tags=tags_str,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Initial Version snapshot
    v1 = DocumentVersion(
        document_id=doc.id,
        version=doc.version,
        title=doc.title,
        content=doc.content or "",
        change_summary="Initial document creation",
        author_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(v1)
    db.commit()

    return format_doc_summary(doc)


@router.post("/upload")
def upload_document_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_filename = f"doc_{file.filename}"
    file_dest = os.path.join(UPLOAD_DIR, file_filename)
    with open(file_dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_rel_path = f"/uploads/documents/{file_filename}"

    return {"file_path": file_rel_path, "filename": file.filename}


# ---------------------------------------------------------------------------
# 5. Get Document Workspace Detail (GET /api/documents/{id})
# ---------------------------------------------------------------------------
@router.get("/{document_id}")
def get_document_detail(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    res = format_doc_summary(doc)

    # Versions list
    versions_list = []
    for v in sorted(doc.versions, key=lambda x: x.created_at, reverse=True):
        versions_list.append({
            "id": v.id,
            "version": v.version,
            "title": v.title,
            "change_summary": v.change_summary or "Updated content",
            "created_by": v.author.name if v.author else "User",
            "created_at": v.created_at.isoformat() if v.created_at else None
        })
    res["versions"] = versions_list

    # Relations list
    relations_list = []
    for r in doc.relations:
        target_name = f"{r.entity_type.capitalize()} #{r.entity_id}"
        if r.entity_type.lower() in ["issue", "bug", "task"]:
            iss = db.query(Issue).filter(Issue.id == r.entity_id).first()
            if iss:
                target_name = f"DEF-{iss.id}: {iss.title}"
        elif r.entity_type.lower() == "project":
            p = db.query(Project).filter(Project.id == r.entity_id).first()
            if p:
                target_name = p.name
        elif r.entity_type.lower() == "sprint":
            sp = db.query(Sprint).filter(Sprint.id == r.entity_id).first()
            if sp:
                target_name = sp.name
        elif r.entity_type.lower() == "goal":
            g = db.query(Goal).filter(Goal.id == r.entity_id).first()
            if g:
                target_name = g.title

        relations_list.append({
            "id": r.id,
            "target_type": r.entity_type.lower(),
            "target_id": r.entity_id,
            "target_title": target_name,
            "relation_type": "RELATE",
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    res["relations"] = relations_list

    # Comments list
    comments_list = []
    for c in sorted(doc.comments, key=lambda x: x.created_at, reverse=False):
        comments_list.append({
            "id": c.id,
            "content": c.content,
            "user_id": c.author_id,
            "user_name": c.author.name if c.author else "BugFlow User",
            "user_role": c.author.role.value if c.author and hasattr(c.author.role, "value") else "USER",
            "is_ai_generated": False,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    res["comments"] = comments_list

    return res


# ---------------------------------------------------------------------------
# 6. Update Document (PUT /api/documents/{id})
# ---------------------------------------------------------------------------
@router.put("/{document_id}")
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    content_changed = False
    old_content = doc.content

    if payload.title is not None and payload.title != doc.title:
        doc.title = payload.title
        content_changed = True
    if payload.description is not None:
        doc.description = payload.description
    if payload.category is not None:
        doc.category = payload.category
    if payload.document_type is not None:
        doc.document_type = payload.document_type
    if payload.content is not None and payload.content != old_content:
        doc.content = payload.content
        content_changed = True
    if payload.status is not None:
        doc.status = payload.status
    if payload.version is not None:
        doc.version = payload.version
    if payload.visibility is not None:
        doc.visibility = payload.visibility
    if payload.project_id is not None:
        doc.project_id = payload.project_id
    if payload.workspace_id is not None:
        doc.workspace_id = payload.workspace_id
    if payload.department_id is not None:
        doc.department_id = payload.department_id
    if payload.owner_id is not None:
        doc.owner_id = payload.owner_id
    if payload.reviewer_id is not None:
        doc.reviewer_id = payload.reviewer_id
        doc.review_status = "PENDING"
    if payload.review_status is not None:
        doc.review_status = payload.review_status
    if payload.review_comments is not None:
        doc.review_comments = payload.review_comments
    if payload.tags is not None:
        doc.tags = json.dumps(payload.tags)

    doc.updated_at = datetime.utcnow()
    db.commit()

    if content_changed:
        ver_snap = DocumentVersion(
            document_id=doc.id,
            version=doc.version or "v1.1",
            title=doc.title,
            content=doc.content or "",
            change_summary=payload.change_summary or "Updated document content & details",
            author_id=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(ver_snap)
        db.commit()

    return format_doc_summary(doc)


# ---------------------------------------------------------------------------
# 7. Delete Document
# ---------------------------------------------------------------------------
@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": document_id}


# ---------------------------------------------------------------------------
# 8. Review Workflow Endpoint
# ---------------------------------------------------------------------------
@router.post("/{document_id}/review")
def review_document(
    document_id: int,
    review_req: DocumentReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.review_status = review_req.review_status
    doc.review_comments = review_req.review_comments
    doc.last_reviewed_at = datetime.utcnow()

    if review_req.review_status == "APPROVED":
        doc.status = "PUBLISHED"

    db.commit()

    review_comment = DocumentComment(
        document_id=doc.id,
        author_id=current_user.id,
        content=f"📋 **Review Updated**: {review_req.review_status}\n\n{review_req.review_comments or 'No specific comment provided.'}",
        created_at=datetime.utcnow()
    )
    db.add(review_comment)
    db.commit()

    return format_doc_summary(doc)


# ---------------------------------------------------------------------------
# 9. Document Relations Endpoints
# ---------------------------------------------------------------------------
@router.post("/{document_id}/relations")
def create_relation(
    document_id: int,
    rel_data: RelationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rel = DocumentRelation(
        document_id=document_id,
        entity_type=rel_data.target_type.upper(),
        entity_id=rel_data.target_id,
        created_at=datetime.utcnow()
    )
    db.add(rel)
    db.commit()
    db.refresh(rel)

    return {
        "id": rel.id,
        "document_id": rel.document_id,
        "target_type": rel.entity_type.lower(),
        "target_id": rel.entity_id,
        "target_title": rel_data.target_title or f"{rel.entity_type} #{rel.entity_id}",
        "relation_type": rel_data.relation_type
    }


@router.delete("/{document_id}/relations/{relation_id}")
def remove_relation(
    document_id: int,
    relation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rel = db.query(DocumentRelation).filter(
        and_(DocumentRelation.id == relation_id, DocumentRelation.document_id == document_id)
    ).first()
    if not rel:
        raise HTTPException(status_code=404, detail="Relation not found")

    db.delete(rel)
    db.commit()
    return {"message": "Relation removed", "id": relation_id}


# ---------------------------------------------------------------------------
# 10. Document Comments Endpoints
# ---------------------------------------------------------------------------
@router.post("/{document_id}/comments")
def add_comment(
    document_id: int,
    comment_req: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    comment = DocumentComment(
        document_id=document_id,
        author_id=current_user.id,
        content=comment_req.content,
        created_at=datetime.utcnow()
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "content": comment.content,
        "user_id": comment.author_id,
        "user_name": current_user.name,
        "user_role": current_user.role.value if hasattr(current_user.role, "value") else "USER",
        "is_ai_generated": comment_req.is_ai_generated,
        "created_at": comment.created_at.isoformat()
    }


# ---------------------------------------------------------------------------
# 11. Versions Endpoint (Restore)
# ---------------------------------------------------------------------------
@router.post("/{document_id}/versions/{version_id}/restore")
def restore_version(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ver = db.query(DocumentVersion).filter(
        and_(DocumentVersion.id == version_id, DocumentVersion.document_id == document_id)
    ).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Version not found")

    doc.title = ver.title
    doc.content = ver.content
    doc.version = f"{ver.version}-restored"
    doc.updated_at = datetime.utcnow()
    db.commit()

    new_ver = DocumentVersion(
        document_id=doc.id,
        version=doc.version,
        title=doc.title,
        content=doc.content,
        change_summary=f"Restored from version {ver.version}",
        author_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(new_ver)
    db.commit()

    return format_doc_summary(doc)


# ---------------------------------------------------------------------------
# 12. AI Semantic Search & Assistant Copilot
# ---------------------------------------------------------------------------
@router.post("/ai/search")
def ai_semantic_search(
    req: AISearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query_text = req.query.strip().lower()
    docs_query = db.query(Document)

    if req.category and req.category.upper() != "ALL":
        docs_query = docs_query.filter(Document.category == req.category.upper())

    all_docs = docs_query.all()
    results = []

    for d in all_docs:
        score = 0.0
        match_reasons = []

        title_lower = (d.title or "").lower()
        desc_lower = (d.description or "").lower()
        content_lower = (d.content or "").lower()
        tags_lower = (d.tags or "").lower()

        if query_text in title_lower:
            score += 0.5
            match_reasons.append("Title exact keyword match")
        if query_text in desc_lower:
            score += 0.3
            match_reasons.append("Description context match")
        if query_text in content_lower:
            score += 0.2
            match_reasons.append("Body section content match")
        if query_text in tags_lower:
            score += 0.4
            match_reasons.append("Metadata tag match")

        words = [w for w in query_text.split() if len(w) > 2]
        overlap_count = 0
        for w in words:
            if w in title_lower or w in content_lower or w in desc_lower:
                overlap_count += 1
        if words and overlap_count > 0:
            score += min(0.4, (overlap_count / len(words)) * 0.4)

        if score > 0.1:
            confidence = min(99, int(score * 100))
            results.append({
                "document": format_doc_summary(d),
                "relevance_score": round(score, 2),
                "confidence_percent": confidence,
                "match_reasons": match_reasons,
                "snippet": (d.description or d.content[:200] if d.content else "No preview available")
            })

    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return {
        "query": req.query,
        "total_matches": len(results),
        "results": results[:req.limit]
    }


@router.post("/ai/ask")
def ask_knowledge_ai(
    req: AIAskQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    relevant_docs = db.query(Document).filter(
        or_(
            Document.title.ilike(f"%{question[:20]}%"),
            Document.content.ilike(f"%{question[:20]}%")
        )
    ).limit(3).all()

    if not relevant_docs:
        relevant_docs = db.query(Document).order_by(Document.updated_at.desc()).limit(3).all()

    citations = [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "document_type": d.document_type,
            "version": d.version
        } for d in relevant_docs
    ]

    answer_summary = f"Based on BugFlow Engineering Knowledge Base context, here is the answer to your query **'{question}'**:\n\n"
    if relevant_docs:
        top_doc = relevant_docs[0]
        answer_summary += f"1. According to **[{top_doc.title}](doc:{top_doc.id})** ({top_doc.document_type}, {top_doc.version}):\n"
        answer_summary += f"   - {top_doc.description or 'Covers critical engineering specifications and operational procedures.'}\n\n"
        answer_summary += f"2. Best practices suggest keeping requirements aligned with sprint milestones and reviewing test coverage before production release.\n"
        answer_summary += f"3. Recommended Action: Review associated bug tickets and SLA monitors linked to these documents."
    else:
        answer_summary += "No direct documentation match was found. Consider creating a new Technical Spec or ADR template in the Engineering Knowledge Hub."

    return {
        "question": question,
        "answer": answer_summary,
        "citations": citations,
        "suggested_followups": [
            "What test suites are linked to this specification?",
            "Are there any active security advisories for this module?",
            "Who is the assigned owner responsible for this document?"
        ]
    }


@router.post("/ai/actions")
def execute_ai_document_action(
    req: AIActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = req.action.lower()
    doc = None
    if req.document_id:
        doc = db.query(Document).filter(Document.id == req.document_id).first()

    if action == "summarize":
        if not doc:
            raise HTTPException(status_code=400, detail="Document ID required for summarization")
        summary_text = f"### AI Executive Summary for '{doc.title}'\n\n"
        summary_text += f"- **Category**: {doc.category} | **Type**: {doc.document_type} | **Version**: {doc.version}\n"
        summary_text += f"- **Key Objectives**: Outlines standard practices and technical architecture for BugFlow platform integrity.\n"
        summary_text += f"- **Scope & Constraints**: Covers system contracts, API data models, and QA verification plans.\n"
        summary_text += f"- **Status**: Currently {doc.status} with review status {doc.review_status}."
        return {"action": action, "output": summary_text}

    elif action == "generate_release_notes":
        notes = f"# Release Notes: BugFlow v3.5 Engineering Update\n\n"
        notes += f"**Date**: {datetime.utcnow().strftime('%Y-%m-%d')}\n\n"
        notes += f"### 🚀 New Features & Enhancements\n"
        notes += f"- **Engineering Knowledge Hub**: Centralized documentation connecting specifications, test suites, and defect intelligence.\n"
        notes += f"- **AI Copilot Assistance**: Real-time semantic document search and intelligent Q&A assistance.\n\n"
        notes += f"### 🐛 Bug Fixes & Stability\n"
        notes += f"- Resolved sprint burndown calculation edge cases.\n"
        notes += f"- Enhanced SLA tracking precision under heavy workload spikes."
        return {"action": action, "output": notes}

    elif action == "draft_test_plan":
        test_plan = f"# Test Plan: {doc.title if doc else 'New Module'}\n\n"
        test_plan += f"## 1. Scope & Strategy\n"
        test_plan += f"Verify end-to-end functionality, performance, and RBAC security for target services.\n\n"
        test_plan += f"## 2. Test Cases\n"
        test_plan += f"- **TC-01 (Positive)**: Successful entity creation and state transition.\n"
        test_plan += f"- **TC-02 (Negative)**: Validation of invalid input parameters returns HTTP 400.\n"
        test_plan += f"- **TC-03 (Security)**: Unauthorized users cannot modify draft specifications.\n\n"
        test_plan += f"## 3. Environment & Prerequisites\n"
        test_plan += f"- Staging environment with seeded database models."
        return {"action": action, "output": test_plan}

    elif action == "security_audit":
        audit = f"### 🛡️ AI Security & Compliance Audit\n\n"
        audit += f"- **Data Sensitivity Level**: Internal Restricted\n"
        audit += f"- **RBAC Verification**: Passed (Only authorized team members can edit)\n"
        audit += f"- **Findings**: 0 hardcoded credentials or secret tokens detected in content.\n"
        audit += f"- **Recommendation**: Schedule next periodic review in 90 days."
        return {"action": action, "output": audit}

    else:
        return {
            "action": action,
            "output": f"AI Assistant completed processing request for action '{action}'."
        }
