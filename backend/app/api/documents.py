from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.document import Document
from app.models.user import User
from app.auth.deps import get_current_user
import os, shutil

router = APIRouter(prefix="/api/documents", tags=["Project Documents"])
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("")
def get_documents(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    docs = query.order_by(Document.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "content": d.content,
            "file_path": d.file_path,
            "project_id": d.project_id,
            "project_name": d.project.name if d.project else "",
            "author_name": d.author.name if d.author else "",
            "created_at": d.created_at
        }
        for d in docs
    ]


@router.post("")
def create_document(
    title: str = Form(...),
    category: str = Form("Requirements"),
    project_id: int = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_rel_path = None
    if file:
        file_filename = f"doc_{file.filename}"
        file_dest = os.path.join(UPLOAD_DIR, file_filename)
        with open(file_dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_rel_path = f"/uploads/documents/{file_filename}"

    doc = Document(
        title=title,
        category=category,
        content=content,
        file_path=file_rel_path,
        project_id=project_id,
        created_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "title": doc.title,
        "category": doc.category,
        "content": doc.content,
        "file_path": doc.file_path,
        "project_id": doc.project_id,
        "created_at": doc.created_at
    }
