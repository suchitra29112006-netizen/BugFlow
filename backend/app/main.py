import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database.connection import engine, Base, SessionLocal
from app.models import User, UserRole, Project, Issue, IssueSeverity, IssueStatus, IssuePriority, Comment
from app.auth.password import get_password_hash
from app.api import auth, users, projects, issues, comments, dashboard, ai, attachments, websocket

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BugFlow API",
    description="Software Issue Tracking & Resolution Platform Backend API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for screenshots, videos, and crash logs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(issues.router)
app.include_router(comments.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(attachments.router)
app.include_router(websocket.router)


@app.on_event("startup")
def seed_initial_data():
    """Seed initial demo users and project if DB is fresh."""
    db: Session = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Seeding initial BugFlow demo data...")
            admin = User(
                name="System Administrator",
                email="admin@bugflow.io",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN
            )
            developer = User(
                name="Sarah Developer",
                email="dev@bugflow.io",
                password_hash=get_password_hash("dev123"),
                role=UserRole.DEVELOPER
            )
            qa = User(
                name="Alex QA",
                email="qa@bugflow.io",
                password_hash=get_password_hash("qa123"),
                role=UserRole.QA
            )
            reporter = User(
                name="David Reporter",
                email="reporter@bugflow.io",
                password_hash=get_password_hash("reporter123"),
                role=UserRole.REPORTER
            )
            db.add_all([admin, developer, qa, reporter])
            db.commit()
            db.refresh(admin)
            db.refresh(developer)
            db.refresh(qa)
            db.refresh(reporter)

            # Seed Demo Project
            project = Project(
                name="BugFlow Core Platform",
                description="Primary repository for BugFlow tracking app & AI engine.",
                owner_id=admin.id
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            # Seed Demo Issues
            issue1 = Issue(
                title="Login page crashes immediately after login",
                description="Application crashes immediately after user submits login form with 500 error in auth handler.",
                severity=IssueSeverity.CRITICAL,
                status=IssueStatus.OPEN,
                priority=IssuePriority.CRITICAL,
                reporter_id=reporter.id,
                assigned_to=developer.id,
                project_id=project.id
            )
            issue2 = Issue(
                title="Unhandled 500 error on duplicate user registration",
                description="Database constraint error crashes container instead of returning 400 Bad Request.",
                severity=IssueSeverity.HIGH,
                status=IssueStatus.IN_PROGRESS,
                priority=IssuePriority.HIGH,
                reporter_id=qa.id,
                assigned_to=developer.id,
                project_id=project.id
            )
            issue3 = Issue(
                title="Dark mode theme toggle flickering on page load",
                description="Minor aesthetic issue where light theme flashes briefly before dark mode activates.",
                severity=IssueSeverity.LOW,
                status=IssueStatus.RESOLVED,
                priority=IssuePriority.LOW,
                reporter_id=developer.id,
                assigned_to=developer.id,
                project_id=project.id
            )
            db.add_all([issue1, issue2, issue3])
            db.commit()

            print("Initial demo data successfully seeded!")
    except Exception as e:
        print(f"Error seeding initial data: {e}")
    finally:
        db.close()


@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "BugFlow Software Issue Tracking Platform API",
        "docs": "/docs"
    }
