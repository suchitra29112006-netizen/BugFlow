import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.board import Board

router = APIRouter(prefix="/api/v1/boards", tags=["Boards"])

class BoardCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    board_type: Optional[str] = "Kanban"
    columns_json: Optional[str] = None

class BoardOut(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str]
    board_type: str
    columns_json: Optional[str]

    class Config:
        from_attributes = True

DEFAULT_COLUMNS = json.dumps([
    {"id": "todo", "name": "TODO", "color": "#64748b", "wip_limit": 10},
    {"id": "in_progress", "name": "IN PROGRESS", "color": "#3b82f6", "wip_limit": 5},
    {"id": "code_review", "name": "CODE REVIEW", "color": "#8b5cf6", "wip_limit": 5},
    {"id": "testing", "name": "TESTING", "color": "#f59e0b", "wip_limit": 5},
    {"id": "done", "name": "DONE", "color": "#10b981", "wip_limit": 0}
])

@router.get("/project/{project_id}", response_model=List[BoardOut])
def get_project_boards(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    boards = db.query(Board).filter(Board.project_id == project_id).all()
    if not boards:
        # Create default board for project
        default_board = Board(
            project_id=project_id,
            name="Default Project Board",
            board_type="Kanban",
            columns_json=DEFAULT_COLUMNS,
            created_by=current_user.id
        )
        db.add(default_board)
        db.commit()
        db.refresh(default_board)
        boards = [default_board]

    return boards

@router.post("", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(
    data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = Board(
        project_id=data.project_id,
        name=data.name,
        description=data.description,
        board_type=data.board_type or "Kanban",
        columns_json=data.columns_json or DEFAULT_COLUMNS,
        created_by=current_user.id
    )
    db.add(board)
    db.commit()
    db.refresh(board)
    return board

@router.put("/{board_id}", response_model=BoardOut)
def update_board(
    board_id: int,
    data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    board.name = data.name
    if data.description is not None:
        board.description = data.description
    if data.board_type:
        board.board_type = data.board_type
    if data.columns_json:
        board.columns_json = data.columns_json
    db.commit()
    db.refresh(board)
    return board
