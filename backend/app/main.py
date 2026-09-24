import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.connection import engine, Base, SessionLocal, get_db
from app.models import (
    User, UserRole, Project, Issue, IssueSeverity, IssueStatus, IssuePriority, Comment, Label,
    Milestone, TimeEntry, ActiveTimer, SLAPolicy, SLAEvent, AutomationRule, Document,
    DeveloperProfile, DeveloperSkill, DeveloperTechnology, DeveloperCertification,
    IssueIntelligence, AssignmentFeedback,
    UserProfile, Skill, UserSkill, UserDomain, UserProjectExperience,
    AssignmentRecommendation, AssignmentHistory,
    SprintObjective, SprintDependency, SprintRetrospective,
    DefectFingerprint, DefectRelationship, InvestigationWorkspace, InvestigationHypothesis,
    VerificationPlan, VerificationTestCase, SecurityFinding, SecurityAnomaly,
    AIRecommendationAudit, Incident, PreventiveAction
)
from app.auth.password import get_password_hash
from app.api import (
    auth, users, projects, issues, comments, dashboard, ai, attachments,
    websocket, sprints, notifications, labels, activity,
    milestones, time_entries, sla, automation, documents,
    developer_profiles, assignment, team_intelligence, sprint_intelligence,
    analytics, resolution, security, performance, intelligence, settings,
    organizations, teams, people, goals, ask_portal, qa_management,
    releases, incidents, knowledge_base, workspaces, boards, departments
)



# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)


def apply_schema_migrations(target_engine=None):
    """Dynamically add missing columns to SQLite database if created prior to schema additions."""
    eng = target_engine or engine
    try:
        with eng.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(issues);"))
            columns = [row[1] for row in result.fetchall()]
            
            if "sprint_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN sprint_id INTEGER REFERENCES sprints(id);"))
            if "milestone_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN milestone_id INTEGER REFERENCES milestones(id);"))
            if "due_date" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN due_date DATETIME;"))
            if "pr_url" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN pr_url VARCHAR(500);"))
            if "is_regression" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN is_regression BOOLEAN DEFAULT 0;"))
            if "reopen_count" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN reopen_count INTEGER DEFAULT 0;"))
            if "est_resolution_hours" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN est_resolution_hours FLOAT;"))
            if "sentiment_score" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN sentiment_score FLOAT;"))
            if "verification_checklist" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN verification_checklist TEXT;"))
            if "work_item_type" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN work_item_type VARCHAR(50) DEFAULT 'BUG';"))
            if "team_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN team_id INTEGER REFERENCES teams(id);"))
            if "goal_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN goal_id INTEGER REFERENCES goals(id);"))
            if "workspace_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id);"))
            if "board_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN board_id INTEGER REFERENCES boards(id);"))
            if "parent_task_id" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN parent_task_id INTEGER REFERENCES issues(id);"))
            if "start_date" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN start_date DATETIME;"))
            if "custom_fields_json" not in columns:
                conn.execute(text("ALTER TABLE issues ADD COLUMN custom_fields_json TEXT;"))

            # Check projects table columns
            result_proj = conn.execute(text("PRAGMA table_info(projects);"))
            columns_proj = [row[1] for row in result_proj.fetchall()]
            if "project_key" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN project_key VARCHAR(50);"))
            if "workspace_id" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id);"))
            if "department_id" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN department_id INTEGER REFERENCES departments(id);"))
            if "project_type" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN project_type VARCHAR(100) DEFAULT 'Software Development';"))
            if "status" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN status VARCHAR(50) DEFAULT 'Active';"))
            if "priority" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN priority VARCHAR(50) DEFAULT 'Medium';"))
            if "repository_url" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN repository_url VARCHAR(255);"))
            if "environment" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN environment VARCHAR(100) DEFAULT 'Production';"))
            if "start_date" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN start_date DATETIME;"))
            if "target_date" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN target_date DATETIME;"))
            if "visibility" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN visibility VARCHAR(50) DEFAULT 'Public';"))
            if "archived_at" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN archived_at DATETIME;"))
            if "health" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN health VARCHAR(50) DEFAULT 'Healthy';"))
            if "health_reasons_json" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN health_reasons_json TEXT DEFAULT '[]';"))
            if "updated_at" not in columns_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN updated_at DATETIME;"))

            # Check organizations table columns
            result_org = conn.execute(text("PRAGMA table_info(organizations);"))
            columns_org = [row[1] for row in result_org.fetchall()]
            if "country" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN country VARCHAR(100);"))
            if "state_region" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN state_region VARCHAR(100);"))
            if "city" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN city VARCHAR(100);"))
            if "website" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN website VARCHAR(255);"))
            if "sla_settings_json" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN sla_settings_json TEXT;"))
            if "working_schedule_json" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN working_schedule_json TEXT;"))
            if "regional_settings_json" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN regional_settings_json TEXT;"))
            if "ai_settings_json" not in columns_org:
                conn.execute(text("ALTER TABLE organizations ADD COLUMN ai_settings_json TEXT;"))

            # Check departments table columns
            result_dept = conn.execute(text("PRAGMA table_info(departments);"))
            columns_dept = [row[1] for row in result_dept.fetchall()]
            if "code" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN code VARCHAR(50);"))
            if "department_type" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN department_type VARCHAR(100) DEFAULT 'Engineering';"))
            if "lead_id" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN lead_id INTEGER REFERENCES users(id);"))
            if "timezone" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC (Coordinated Universal Time)';"))
            if "working_hours" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN working_hours VARCHAR(100) DEFAULT '09:00 - 18:00 MON-FRI';"))
            if "default_sla_policy_id" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN default_sla_policy_id INTEGER;"))
            if "status" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN status VARCHAR(50) DEFAULT 'Active';"))
            if "updated_at" not in columns_dept:
                conn.execute(text("ALTER TABLE departments ADD COLUMN updated_at DATETIME;"))

            # Check goals table columns
            result_goals = conn.execute(text("PRAGMA table_info(goals);"))
            columns_goals = [row[1] for row in result_goals.fetchall()]
            if "department_id" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN department_id INTEGER REFERENCES departments(id);"))
            if "workspace_id" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id);"))
            if "goal_type" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN goal_type VARCHAR(50) DEFAULT 'Engineering';"))
            if "time_period" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN time_period VARCHAR(50) DEFAULT 'Q4 2026';"))
            if "start_date" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN start_date DATETIME;"))
            if "target_date" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN target_date DATETIME;"))
            if "expected_progress" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN expected_progress FLOAT DEFAULT 0.0;"))
            if "health_summary" not in columns_goals:
                conn.execute(text("ALTER TABLE goals ADD COLUMN health_summary TEXT;"))

            # Check workspaces table columns
            result_ws = conn.execute(text("PRAGMA table_info(workspaces);"))
            columns_ws = [row[1] for row in result_ws.fetchall()]
            if "key" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN key VARCHAR(20);"))
            if "workspace_type" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN workspace_type VARCHAR(50) DEFAULT 'Engineering';"))
            if "lead_id" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN lead_id INTEGER REFERENCES users(id);"))
            if "status" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN status VARCHAR(50) DEFAULT 'Active';"))
            if "timezone" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';"))
            if "working_hours" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN working_hours VARCHAR(100) DEFAULT '09:00 - 17:00';"))
            if "default_sprint_length" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN default_sprint_length INTEGER DEFAULT 14;"))
            if "repositories_json" not in columns_ws:
                conn.execute(text("ALTER TABLE workspaces ADD COLUMN repositories_json TEXT;"))

            # Check comments table columns
            result_comm = conn.execute(text("PRAGMA table_info(comments);"))
            columns_comm = [row[1] for row in result_comm.fetchall()]
            if "is_ai_generated" not in columns_comm:
                conn.execute(text("ALTER TABLE comments ADD COLUMN is_ai_generated BOOLEAN DEFAULT 0;"))

            # Check sprints table columns
            result_sprints = conn.execute(text("PRAGMA table_info(sprints);"))
            columns_sprints = [row[1] for row in result_sprints.fetchall()]
            if "description" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN description TEXT;"))
            if "goal" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN goal TEXT;"))
            if "status" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';"))
            if "planned_story_points" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN planned_story_points INTEGER DEFAULT 30;"))
            if "completed_story_points" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN completed_story_points INTEGER DEFAULT 0;"))
            if "velocity" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN velocity FLOAT DEFAULT 5.0;"))
            if "team_capacity" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN team_capacity INTEGER DEFAULT 40;"))
            if "capacity_utilization" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN capacity_utilization FLOAT DEFAULT 85.0;"))
            if "health_score" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN health_score FLOAT DEFAULT 85.0;"))
            if "risk_score" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN risk_score FLOAT DEFAULT 15.0;"))
            if "completion_probability" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN completion_probability FLOAT DEFAULT 85.0;"))
            if "expected_completion_date" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN expected_completion_date DATETIME;"))
            if "carryover_issues_count" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN carryover_issues_count INTEGER DEFAULT 0;"))
            if "created_by" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN created_by INTEGER REFERENCES users(id);"))
            if "updated_at" not in columns_sprints:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN updated_at DATETIME;"))

            # Check documents table columns
            result_docs = conn.execute(text("PRAGMA table_info(documents);"))
            columns_docs = [row[1] for row in result_docs.fetchall()]
            if "description" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN description TEXT;"))
            if "document_type" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN document_type VARCHAR(100) DEFAULT 'Technical Spec';"))
            if "category" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN category VARCHAR(50) DEFAULT 'ENGINEERING';"))
            if "status" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN status VARCHAR(50) DEFAULT 'PUBLISHED';"))
            if "version" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN version VARCHAR(20) DEFAULT 'v1.0';"))
            if "visibility" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN visibility VARCHAR(50) DEFAULT 'INTERNAL';"))
            if "author_id" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN author_id INTEGER REFERENCES users(id);"))
            if "owner_id" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN owner_id INTEGER REFERENCES users(id);"))
            if "reviewer_id" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN reviewer_id INTEGER REFERENCES users(id);"))
            if "review_status" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN review_status VARCHAR(50) DEFAULT 'APPROVED';"))
            if "review_comments" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN review_comments TEXT;"))
            if "workspace_id" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id);"))
            if "department_id" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN department_id INTEGER REFERENCES departments(id);"))
            if "tags" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN tags TEXT DEFAULT '[]';"))
            if "last_reviewed_at" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN last_reviewed_at DATETIME;"))
            if "review_due_at" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN review_due_at DATETIME;"))
            if "updated_at" not in columns_docs:
                conn.execute(text("ALTER TABLE documents ADD COLUMN updated_at DATETIME;"))

            # Check time_entries table columns
            result_time = conn.execute(text("PRAGMA table_info(time_entries);"))
            columns_time = [row[1] for row in result_time.fetchall()]
            if "duration_seconds" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN duration_seconds INTEGER DEFAULT 0;"))
            if "work_type" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN work_type VARCHAR(50) DEFAULT 'Development';"))
            if "logged_date" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN logged_date DATETIME;"))
            if "project_id" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN project_id INTEGER REFERENCES projects(id);"))
            if "squad_id" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN squad_id INTEGER REFERENCES teams(id);"))
            if "sprint_id" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN sprint_id INTEGER REFERENCES sprints(id);"))
            if "billable" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN billable BOOLEAN DEFAULT 1;"))
            if "updated_at" not in columns_time:
                conn.execute(text("ALTER TABLE time_entries ADD COLUMN updated_at DATETIME;"))

            # Check active_timers table columns
            result_timer = conn.execute(text("PRAGMA table_info(active_timers);"))
            columns_timer = [row[1] for row in result_timer.fetchall()]
            if "paused_at" not in columns_timer:
                conn.execute(text("ALTER TABLE active_timers ADD COLUMN paused_at DATETIME;"))
            if "elapsed_seconds" not in columns_timer:
                conn.execute(text("ALTER TABLE active_timers ADD COLUMN elapsed_seconds INTEGER DEFAULT 0;"))
            if "work_type" not in columns_timer:
                conn.execute(text("ALTER TABLE active_timers ADD COLUMN work_type VARCHAR(50) DEFAULT 'Debugging';"))
            if "work_notes" not in columns_timer:
                conn.execute(text("ALTER TABLE active_timers ADD COLUMN work_notes TEXT;"))

    except Exception as e:
        print(f"Notice: Migration check info: {e}")


apply_schema_migrations()

app = FastAPI(
    title="BugFlow API",
    description="Intelligent Defect Lifecycle Intelligence & Resolution Engineering Platform",
    version="4.0.0"
)

# CORS Middleware
raw_cors = os.getenv("CORS_ORIGINS", "")
if raw_cors.strip():
    allowed_origins = [o.strip() for o in raw_cors.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://bugflow-nine.vercel.app"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if allowed_origins != ["*"] else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "app": "BugFlow API",
        "version": "4.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": db_status
    }

# Mount static uploads directory for screenshots, videos, documents, and crash logs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(resolution.router)
app.include_router(team_intelligence.router)
app.include_router(sprint_intelligence.router)
app.include_router(security.router)
app.include_router(performance.router)
app.include_router(intelligence.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(issues.router)
app.include_router(comments.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(attachments.router)
app.include_router(websocket.router)
app.include_router(sprints.router)
app.include_router(notifications.router)
app.include_router(labels.router)
app.include_router(activity.router)
app.include_router(activity.audit_router)
app.include_router(milestones.router)
app.include_router(time_entries.router)
app.include_router(sla.router)
app.include_router(automation.router)
app.include_router(documents.router)
app.include_router(developer_profiles.router)
app.include_router(assignment.router)
app.include_router(settings.router)
app.include_router(organizations.router)
app.include_router(teams.router)

app.include_router(people.router)
app.include_router(goals.router)
app.include_router(ask_portal.router)
app.include_router(qa_management.router)
app.include_router(releases.router)
app.include_router(incidents.router)
app.include_router(knowledge_base.router)
app.include_router(workspaces.router)
app.include_router(boards.router)
app.include_router(departments.router)



@app.on_event("startup")
def seed_initial_data():
    """Seed initial demo users, projects, departments, squads, workspaces, goals, documents, sprints, milestones, SLAs, and incidents if DB is fresh."""
    seed_enabled = os.getenv("SEED_DEMO_DATA", "true").lower() in ["true", "1", "yes"]
    if not seed_enabled:
        return

    db: Session = SessionLocal()
    try:
        from datetime import datetime, timedelta
        # 1. Seed Labels
        if db.query(Label).count() == 0:
            default_labels = [
                Label(name="Security", color="#ef4444"),
                Label(name="Authentication", color="#a855f7"),
                Label(name="Backend", color="#3b82f6"),
                Label(name="Frontend", color="#10b981"),
                Label(name="API", color="#f97316"),
                Label(name="Database", color="#06b6d4"),
                Label(name="UI", color="#ec4899")
            ]
            db.add_all(default_labels)
            db.commit()

        # 2. Seed Users
        if db.query(User).count() == 0:
            print("Seeding initial BugFlow demo users...")
            admin = User(name="System Administrator", email="admin@bugflow.io", password_hash=get_password_hash("admin123"), role=UserRole.ADMIN)
            george = User(name="George Dev", email="george@gmail.com", password_hash=get_password_hash("dev123"), role=UserRole.ADMIN)
            sarah = User(name="Sarah Jenkins", email="sarah@bugflow.io", password_hash=get_password_hash("dev123"), role=UserRole.DEVELOPER)
            alex = User(name="Alex Rivera", email="alex@bugflow.io", password_hash=get_password_hash("qa123"), role=UserRole.QA)
            reporter = User(name="David Reporter", email="reporter@bugflow.io", password_hash=get_password_hash("reporter123"), role=UserRole.REPORTER)
            db.add_all([admin, george, sarah, alex, reporter])
            db.commit()
            for u in [admin, george, sarah, alex, reporter]:
                db.refresh(u)

            prof1 = UserProfile(user_id=sarah.id, department="Engineering", highest_qualification="B.Tech Computer Science", specialization="Backend & API Architecture", graduation_year=2020, years_experience=4.5, experience_level="Senior", availability_status="Available")
            prof2 = UserProfile(user_id=george.id, department="Cloud Infrastructure", highest_qualification="M.Tech Software Engineering", specialization="Full Stack System Architecture", graduation_year=2018, years_experience=6.0, experience_level="Expert", availability_status="Available")
            prof3 = UserProfile(user_id=alex.id, department="Quality Assurance", highest_qualification="B.Sc IT", specialization="Automated QA & Security", graduation_year=2021, years_experience=3.0, experience_level="Mid", availability_status="Available")
            prof4 = UserProfile(user_id=admin.id, department="Product & Security", highest_qualification="M.Sc Security", specialization="Product Governance & InfoSec", graduation_year=2017, years_experience=7.0, experience_level="Expert", availability_status="Available")
            db.add_all([prof1, prof2, prof3, prof4])
            db.commit()

            skills_catalog = [
                Skill(name="Python", category="Backend"),
                Skill(name="FastAPI", category="Backend"),
                Skill(name="REST API", category="Backend"),
                Skill(name="React", category="Frontend"),
                Skill(name="JavaScript", category="Frontend"),
                Skill(name="PostgreSQL", category="Database"),
                Skill(name="Docker", category="DevOps"),
                Skill(name="Security", category="Security")
            ]
            db.add_all(skills_catalog)
            db.commit()

            py_skill = db.query(Skill).filter(Skill.name == "Python").first()
            fa_skill = db.query(Skill).filter(Skill.name == "FastAPI").first()
            if py_skill and fa_skill:
                db.add_all([
                    UserSkill(user_id=sarah.id, skill_id=py_skill.id, proficiency_level=5, years_experience=4.5, certification="Python Professional"),
                    UserSkill(user_id=sarah.id, skill_id=fa_skill.id, proficiency_level=5, years_experience=4.0, certification="FastAPI Expert")
                ])
                db.commit()

        admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first() or db.query(User).first()
        dev_user = db.query(User).filter(User.role == UserRole.DEVELOPER).first() or admin_user
        qa_user = db.query(User).filter(User.role == UserRole.QA).first() or admin_user

        # 3. Seed Organization
        if db.query(Organization).count() == 0:
            org = Organization(name="BugFlow Technologies", description="AI-Powered Engineering Platform", logo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150")
            db.add(org)
            db.commit()

        org_id = (db.query(Organization).first()).id

        # 4. Seed Departments
        if db.query(Department).count() == 0:
            deps = [
                Department(organization_id=org_id, name="Engineering", code="ENG", department_type="Engineering", description="Core backend and frontend software development."),
                Department(organization_id=org_id, name="Quality Assurance", code="QA", department_type="QA & Quality", description="Test automation, manual testing, and defect verification."),
                Department(organization_id=org_id, name="Cloud Infrastructure", code="SECOPS", department_type="DevOps & Security", description="CI/CD, Kubernetes, cloud infrastructure, and security."),
                Department(organization_id=org_id, name="Product & Security", code="PROD", department_type="Product & Design", description="Product roadmap, UX research, and application security.")
            ]
            db.add_all(deps)
            db.commit()

        eng_dept = db.query(Department).filter(Department.name == "Engineering").first() or db.query(Department).first()

        # 5. Seed Teams (Squads)
        if db.query(Team).count() == 0:
            squads = [
                Team(organization_id=org_id, department_id=eng_dept.id, name="Alpha Squad", description="Core feature squad.", lead_id=dev_user.id),
                Team(organization_id=org_id, department_id=eng_dept.id, name="Core Backend", description="Backend APIs and DB performance.", lead_id=dev_user.id),
                Team(organization_id=org_id, department_id=eng_dept.id, name="Mobile QA Guild", description="QA testing for mobile applications.", lead_id=qa_user.id),
                Team(organization_id=org_id, department_id=eng_dept.id, name="Infrastructure & Security", description="DevOps and security audits.", lead_id=admin_user.id)
            ]
            db.add_all(squads)
            db.commit()

        # 6. Seed Workspaces
        if db.query(Workspace).count() == 0:
            workspaces = [
                Workspace(organization_id=org_id, name="Enterprise Engineering Workspace", description="Main engineering workspace for core microservices.", key="EEW", owner_id=admin_user.id, lead_id=dev_user.id),
                Workspace(organization_id=org_id, name="Core Infrastructure Workspace", description="Cloud architecture, Terraform, and Render configuration.", key="CIW", owner_id=admin_user.id, lead_id=dev_user.id),
                Workspace(organization_id=org_id, name="Mobile Testing Hub", description="Mobile QA automation suite and release verification.", key="MTH", owner_id=admin_user.id, lead_id=qa_user.id)
            ]
            db.add_all(workspaces)
            db.commit()

        ws1 = db.query(Workspace).first()

        # 7. Seed Projects
        if db.query(Project).count() == 0:
            projects = [
                Project(name="BugFlow Core Platform", key="BUG", description="AI-native defect tracking & engineering platform.", owner_id=admin_user.id, workspace_id=ws1.id),
                Project(name="Cloud Infrastructure Setup", key="INFRA", description="Vercel + Render + PostgreSQL production stack.", owner_id=admin_user.id, workspace_id=ws1.id),
                Project(name="Mobile App Redesign", key="MOB", description="React Native mobile client for QA field testing.", owner_id=qa_user.id, workspace_id=ws1.id),
                Project(name="AI Intelligence Engine", key="AI", description="Gemini AI resolution & copilot assistant suite.", owner_id=admin_user.id, workspace_id=ws1.id)
            ]
            db.add_all(projects)
            db.commit()

        proj1 = db.query(Project).first()

        # 8. Seed Issues
        if db.query(Issue).count() == 0:
            issues = [
                Issue(title="Verify Vercel SPA routing fallback for direct link refresh", description="Ensure client side routing rewrites work on all nested routes.", severity=IssueSeverity.HIGH, status=IssueStatus.IN_PROGRESS, priority=IssuePriority.HIGH, reporter_id=qa_user.id, assigned_to=dev_user.id, project_id=proj1.id),
                Issue(title="Configure PostgreSQL connection pooling", description="Set pool_pre_ping and connection limits in connection.py.", severity=IssueSeverity.MEDIUM, status=IssueStatus.RESOLVED, priority=IssuePriority.MEDIUM, reporter_id=dev_user.id, assigned_to=dev_user.id, project_id=proj1.id),
                Issue(title="Optimize Recharts dashboard chunk bundle size", description="Code split dynamic imports to optimize Vite bundle size.", severity=IssueSeverity.LOW, status=IssueStatus.OPEN, priority=IssuePriority.LOW, reporter_id=admin_user.id, assigned_to=dev_user.id, project_id=proj1.id),
                Issue(title="Enforce RBAC permissions on SLA escalation endpoint", description="Verify JWT role claims before modifying SLA escalation rules.", severity=IssueSeverity.CRITICAL, status=IssueStatus.OPEN, priority=IssuePriority.CRITICAL, reporter_id=qa_user.id, assigned_to=admin_user.id, project_id=proj1.id)
            ]
            db.add_all(issues)
            db.commit()

        # 9. Seed Goals / OKRs
        if db.query(Goal).count() == 0:
            goals = [
                Goal(organization_id=org_id, department_id=eng_dept.id, owner_id=admin_user.id, title="Achieve 99.99% Production Uptime", goal_type="Quality", time_period="Q4 2026", target_metric="Zero critical downtime incidents", current_progress=85.0, expected_progress=90.0, status="ON_TRACK"),
                Goal(organization_id=org_id, department_id=eng_dept.id, owner_id=qa_user.id, title="Reduce Critical Defect Resolution Time to < 4 Hours", goal_type="Quality", time_period="Q4 2026", target_metric="MTTR under 4 hours", current_progress=92.0, expected_progress=95.0, status="ON_TRACK"),
                Goal(organization_id=org_id, department_id=eng_dept.id, owner_id=dev_user.id, title="Launch BugFlow v4.0 AI Intelligence Suite", goal_type="Engineering", time_period="Q3 2026", target_metric="Complete deployment on Vercel + Render", current_progress=100.0, expected_progress=100.0, status="COMPLETED")
            ]
            db.add_all(goals)
            db.commit()

        # 10. Seed Documents
        if db.query(Document).count() == 0:
            docs = [
                Document(title="Architecture & Deployment Specification v4.0", description="Comprehensive architecture guide for Vercel + Render deployment.", content="# BugFlow v4.0 Architecture Specification", document_type="Technical Specification", category="ENGINEERING", status="APPROVED", version="v4.0", visibility="ORGANIZATION", author_id=admin_user.id, project_id=proj1.id),
                Document(title="Vercel + Render + PostgreSQL Production Setup Guide", description="Step by step deployment setup guide.", content="# Setup Guide", document_type="Deployment Guide", category="ENGINEERING", status="APPROVED", version="v1.0", visibility="ORGANIZATION", author_id=dev_user.id, project_id=proj1.id),
                Document(title="Security Governance & Vulnerability Playbook", description="Security governance guidelines and RBAC enforcement.", content="# Security Playbook", document_type="Policy Document", category="ENGINEERING", status="APPROVED", version="v1.0", visibility="ORGANIZATION", author_id=admin_user.id, project_id=proj1.id)
            ]
            db.add_all(docs)
            db.commit()

        # 11. Seed Sprints
        if db.query(Sprint).count() == 0:
            now = datetime.utcnow()
            sprint = Sprint(name="Sprint 24 - Production Release", description="Deployment and validation sprint", goal="Deploy Vercel + Render production stack", start_date=now - timedelta(days=7), end_date=now + timedelta(days=7), status="ACTIVE", planned_story_points=30, completed_story_points=24, health_score=95.0)
            db.add(sprint)
            db.commit()

        # 12. Seed Milestones
        if db.query(Milestone).count() == 0:
            milestone = Milestone(name="v4.0 Production Launch", description="Complete production release", due_date=datetime.utcnow() + timedelta(days=7), status="Active", project_id=proj1.id)
            db.add(milestone)
            db.commit()

        # 13. Seed SLA Policies
        if db.query(SLAPolicy).count() == 0:
            sla_policies = [
                SLAPolicy(name="Critical Defect SLA", severity="Critical", target_hours=4.0, escalate_role="Engineering Director", is_active=True),
                SLAPolicy(name="High Severity Defect SLA", severity="High", target_hours=24.0, escalate_role="Lead Developer", is_active=True)
            ]
            db.add_all(sla_policies)
            db.commit()

        # 14. Seed Automation Rules
        if db.query(AutomationRule).count() == 0:
            rule = AutomationRule(name="Auto-assign Critical Security Defects", trigger_event="ISSUE_CREATED", condition_field="severity", condition_value="Critical", action_type="AUTO_ASSIGN", action_value=str(admin_user.id), is_active=True)
            db.add(rule)
            db.commit()

        # 15. Seed Incidents
        if db.query(Incident).count() == 0:
            inc = Incident(incident_code="INC-001", title="Database Pool Connection Spike", severity=FindingSeverity.HIGH, status="RESOLVED", affected_components="Database / Backend API", postmortem_text="Connection pool exhaustion resolved by enabling pool pre-ping.")
            db.add(inc)
            db.commit()

        # 16. Seed Realistic Time Entries (Work Logs)
        if db.query(TimeEntry).count() == 0:
            all_issues = db.query(Issue).all()
            all_squads = db.query(Team).all()
            all_sprints = db.query(Sprint).all()
            now = datetime.utcnow()

            sample_logs = [
                {
                    "issue": all_issues[0] if len(all_issues) > 0 else None,
                    "user": dev_user,
                    "duration_seconds": 4800, # 1h 20m
                    "work_type": "Debugging",
                    "note": "Investigated payment gateway timeout, identified retry-handling defect and implemented retry logic.",
                    "days_ago": 0,
                    "billable": True
                },
                {
                    "issue": all_issues[1] if len(all_issues) > 1 else (all_issues[0] if len(all_issues) > 0 else None),
                    "user": admin_user,
                    "duration_seconds": 7800, # 2h 10m
                    "work_type": "Development",
                    "note": "Implemented validation for malformed API payloads and added error handling.",
                    "days_ago": 1,
                    "billable": True
                },
                {
                    "issue": all_issues[2] if len(all_issues) > 2 else (all_issues[0] if len(all_issues) > 0 else None),
                    "user": qa_user,
                    "duration_seconds": 2700, # 45m
                    "work_type": "Testing",
                    "note": "Performed regression testing for checkout and payment failure scenarios.",
                    "days_ago": 2,
                    "billable": True
                },
                {
                    "issue": all_issues[3] if len(all_issues) > 3 else (all_issues[0] if len(all_issues) > 0 else None),
                    "user": dev_user,
                    "duration_seconds": 4500, # 1h 15m
                    "work_type": "Code Review",
                    "note": "Reviewed authentication changes and suggested improvements to token validation.",
                    "days_ago": 3,
                    "billable": True
                }
            ]

            for sl in sample_logs:
                if sl["issue"]:
                    te = TimeEntry(
                        issue_id=sl["issue"].id,
                        user_id=sl["user"].id,
                        duration_seconds=sl["duration_seconds"],
                        hours_logged=round(sl["duration_seconds"] / 3600.0, 2),
                        work_type=sl["work_type"],
                        note=sl["note"],
                        logged_date=now - timedelta(days=sl["days_ago"]),
                        project_id=sl["issue"].project_id,
                        squad_id=sl["issue"].team_id or (all_squads[0].id if all_squads else None),
                        sprint_id=sl["issue"].sprint_id or (all_sprints[0].id if all_sprints else None),
                        billable=sl["billable"]
                    )
                    db.add(te)
            db.commit()

        print("Comprehensive BugFlow v4.0 demo dataset successfully seeded!")
    except Exception as e:
        print(f"Error seeding initial data: {e}")
    finally:
        db.close()


from fastapi.responses import FileResponse

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return {"detail": "Not found"}
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "app": "BugFlow API",
            "version": "4.0.0",
            "architecture": "Defect Intelligence + Engineering Knowledge + Security + Predictive Analytics"
        }
