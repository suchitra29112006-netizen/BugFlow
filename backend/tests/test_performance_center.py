import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.auth.password import get_password_hash
from app.auth.jwt import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_perf.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.query(User).delete()
    db.commit()

    admin = User(
        name="Admin Test",
        email="admin_perf@test.com",
        password_hash=get_password_hash("password123"),
        role=UserRole.ADMIN
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = create_access_token(data={"sub": str(admin.id)})
    db.close()
    return {"token": token, "user_id": admin.id}


def test_performance_report_endpoint(setup_db):
    headers = {"Authorization": f"Bearer {setup_db['token']}"}

    # 1. Test /api/performance/report
    res = client.get("/api/performance/report", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "database_health_score" in data
    assert "total_queries_captured" in data
    assert "latency_distribution" in data
    assert "n1_candidates" in data
    assert "index_recommendations" in data
    assert "connection_pool" in data
    assert data["total_queries_captured"] >= 48


def test_performance_queries_explorer(setup_db):
    headers = {"Authorization": f"Bearer {setup_db['token']}"}

    # 2. Test /api/performance/queries
    res = client.get("/api/performance/queries", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "queries" in data
    assert len(data["queries"]) > 0

    # Test filtering
    res_filt = client.get("/api/performance/queries?search=issues", headers=headers)
    assert res_filt.status_code == 200


def test_performance_sub_endpoints(setup_db):
    headers = {"Authorization": f"Bearer {setup_db['token']}"}

    # Test /health
    res_h = client.get("/api/performance/health", headers=headers)
    assert res_h.status_code == 200
    assert "overall_score" in res_h.json()

    # Test /slow-queries
    res_s = client.get("/api/performance/slow-queries?threshold_ms=1.0", headers=headers)
    assert res_s.status_code == 200

    # Test /n-plus-one
    res_n = client.get("/api/performance/n-plus-one", headers=headers)
    assert res_n.status_code == 200

    # Test /index-recommendations
    res_i = client.get("/api/performance/index-recommendations", headers=headers)
    assert res_i.status_code == 200

    # Test /pool
    res_p = client.get("/api/performance/pool", headers=headers)
    assert res_p.status_code == 200
