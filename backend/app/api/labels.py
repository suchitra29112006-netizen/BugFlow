from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.label import Label
from app.models.user import User
from app.schemas.label import LabelCreate, LabelResponse
from app.auth.deps import get_current_user

router = APIRouter(prefix="/api/labels", tags=["Labels"])


@router.get("", response_model=List[LabelResponse])
def list_labels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Label).all()


@router.post("", response_model=LabelResponse, status_code=status.HTTP_201_CREATED)
def create_label(
    label_in: LabelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Label).filter(Label.name == label_in.name).first()
    if existing:
        return existing

    label = Label(name=label_in.name, color=label_in.color)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label
