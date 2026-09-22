import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app, apply_schema_migrations
from app.database.connection import Base, get_db
from app.auth.jwt import create_access_token
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.project import Project
from app.models.document import Document, DocumentVersion, DocumentRelation, DocumentComment

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
apply_schema_migrations(target_engine=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture
def auth_headers():
    db = TestingSessionLocal()
    org = db.query(Organization).first()
    if not org:
        org = Organization(id=1, name="NovaTech Engineering")
        db.add(org)
        db.commit()

    user = db.query(User).filter(User.email == "docadmin@bugflow.io").first()
    if not user:
        user = User(
            name="Doc Admin User",
            email="docadmin@bugflow.io",
            password_hash="hashed_pw",
            role=UserRole.ADMIN
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "id": user.id, "role": str(user.role.value) if hasattr(user.role, 'value') else str(user.role)})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_get_documents_kpis(auth_headers):
    response = client.get("/api/documents/kpis", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert "published_documents" in data
    assert "draft_documents" in data
    assert "recently_updated" in data
    assert "requiring_review" in data


def test_create_and_get_document(auth_headers):
    doc_payload = {
        "title": "Core Architecture Specification",
        "description": "System architecture diagram and microservices communication contracts.",
        "category": "ENGINEERING",
        "document_type": "Technical Spec",
        "content": "# BugFlow Core Architecture\n\n- Frontend: React Vite\n- Backend: FastAPI SQLite",
        "status": "PUBLISHED",
        "version": "v1.0",
        "tags": ["Architecture", "Core", "API"]
    }

    create_resp = client.post("/api/documents", json=doc_payload, headers=auth_headers)
    assert create_resp.status_code == 200
    doc_data = create_resp.json()
    assert doc_data["title"] == "Core Architecture Specification"
    assert doc_data["category"] == "ENGINEERING"
    assert doc_data["document_type"] == "Technical Spec"
    assert doc_data["version"] == "v1.0"
    doc_id = doc_data["id"]

    # Test GET detail
    get_resp = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    detail = get_resp.json()
    assert detail["title"] == "Core Architecture Specification"
    assert len(detail["versions"]) >= 1


def test_update_document_creates_version(auth_headers):
    # First create doc
    doc_payload = {
        "title": "API Authentication Specification",
        "description": "OAuth2 + JWT auth mechanism.",
        "category": "ENGINEERING",
        "document_type": "API Docs",
        "content": "Initial JWT spec."
    }
    create_resp = client.post("/api/documents", json=doc_payload, headers=auth_headers)
    doc_id = create_resp.json()["id"]

    # Update doc content
    update_payload = {
        "title": "API Authentication & RBAC Spec",
        "content": "Updated JWT spec with Role Based Access Control.",
        "version": "v1.1",
        "change_summary": "Added RBAC role specs"
    }
    put_resp = client.put(f"/api/documents/{doc_id}", json=update_payload, headers=auth_headers)
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["title"] == "API Authentication & RBAC Spec"

    # Verify detail has 2 versions now
    detail_resp = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    detail = detail_resp.json()
    assert len(detail["versions"]) >= 2


def test_document_review_workflow(auth_headers):
    doc_payload = {
        "title": "Sprint 42 Release Notes",
        "category": "DELIVERY",
        "document_type": "Release Note",
        "status": "DRAFT",
        "content": "Draft release notes for v3.5."
    }
    create_resp = client.post("/api/documents", json=doc_payload, headers=auth_headers)
    doc_id = create_resp.json()["id"]

    review_payload = {
        "review_status": "APPROVED",
        "review_comments": "Looks ready for release publication."
    }
    rev_resp = client.post(f"/api/documents/{doc_id}/review", json=review_payload, headers=auth_headers)
    assert rev_resp.status_code == 200
    rev_data = rev_resp.json()
    assert rev_data["review_status"] == "APPROVED"
    assert rev_data["status"] == "PUBLISHED"


def test_document_relations_and_comments(auth_headers):
    doc_payload = {
        "title": "Database Schema ADR",
        "category": "ENGINEERING",
        "document_type": "Engineering Decision",
        "content": "ADR 001: SQLite with dynamic schema migrations."
    }
    create_resp = client.post("/api/documents", json=doc_payload, headers=auth_headers)
    doc_id = create_resp.json()["id"]

    # Add relation
    rel_payload = {
        "target_type": "project",
        "target_id": 1,
        "target_title": "BugFlow Core Platform",
        "relation_type": "RELATE"
    }
    rel_resp = client.post(f"/api/documents/{doc_id}/relations", json=rel_payload, headers=auth_headers)
    assert rel_resp.status_code == 200
    rel_data = rel_resp.json()
    assert rel_data["target_type"] == "project"

    # Add comment
    comm_payload = {
        "content": "Great architectural decision!",
        "is_ai_generated": False
    }
    comm_resp = client.post(f"/api/documents/{doc_id}/comments", json=comm_payload, headers=auth_headers)
    assert comm_resp.status_code == 200
    comm_data = comm_resp.json()
    assert comm_data["content"] == "Great architectural decision!"


def test_ai_search_and_ask(auth_headers):
    # Search
    search_resp = client.post(
        "/api/documents/ai/search",
        json={"query": "Architecture", "limit": 5},
        headers=auth_headers
    )
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert "results" in search_data

    # Ask AI
    ask_resp = client.post(
        "/api/documents/ai/ask",
        json={"question": "What is the authentication architecture?"},
        headers=auth_headers
    )
    assert ask_resp.status_code == 200
    ask_data = ask_resp.json()
    assert "answer" in ask_data
    assert "citations" in ask_data
