import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.issue import Issue
from app.models.attachment import Attachment
from app.models.user import User
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/issues/{issue_id}/attachments", tags=["Attachments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    issue_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    relative_url = f"/uploads/{unique_filename}"

    attachment = Attachment(
        issue_id=issue_id,
        file_name=file.filename,
        file_path=relative_url,
        uploaded_by=current_user.id
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return {
        "id": attachment.id,
        "issue_id": attachment.issue_id,
        "file_name": attachment.file_name,
        "file_path": attachment.file_path,
        "created_at": attachment.created_at
    }


@router.get("")
def get_attachments(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    attachments = db.query(Attachment).filter(Attachment.issue_id == issue_id).all()
    return [
        {
            "id": a.id,
            "issue_id": a.issue_id,
            "file_name": a.file_name,
            "file_path": a.file_path,
            "created_at": a.created_at
        } for a in attachments
    ]
