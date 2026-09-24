import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import Base, get_db, SessionLocal, engine

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db():
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@pytest.fixture
def client():
    return TestClient(app)
