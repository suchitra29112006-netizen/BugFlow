import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.connection import engine, Base, SessionLocal
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

    except Exception as e:
        print(f"Notice: Migration check info: {e}")


apply_schema_migrations()

app = FastAPI(
    title="BugFlow API",
    description="Intelligent Defect Lifecycle Intelligence & Resolution Engineering Platform",
    version="4.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    """Seed initial demo users, project, skills catalog, milestones, and user intelligence if DB is fresh."""
    db: Session = SessionLocal()
    try:
        label_count = db.query(Label).count()
        if label_count == 0:
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

            # Seed Demo User Profiles
            prof1 = UserProfile(
                user_id=developer.id,
                department="Backend Engineering",
                highest_qualification="B.Tech Computer Science",
                specialization="Backend & API Architecture",
                graduation_year=2020,
                years_experience=4.5,
                experience_level="Senior",
                availability_status="Available"
            )
            prof2 = UserProfile(
                user_id=admin.id,
                department="Architecture & Systems",
                highest_qualification="M.Tech Software Engineering",
                specialization="Full Stack System Architecture",
                graduation_year=2018,
                years_experience=6.0,
                experience_level="Expert",
                availability_status="Available"
            )
            db.add_all([prof1, prof2])
            db.commit()

            # Seed Skills Catalog
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

            # Seed User Skills
            py_skill = db.query(Skill).filter(Skill.name == "Python").first()
            fa_skill = db.query(Skill).filter(Skill.name == "FastAPI").first()
            if py_skill and fa_skill:
                db.add_all([
                    UserSkill(user_id=developer.id, skill_id=py_skill.id, proficiency_level=5, years_experience=4.5, certification="Python Professional"),
                    UserSkill(user_id=developer.id, skill_id=fa_skill.id, proficiency_level=5, years_experience=4.0, certification="FastAPI Expert")
                ])
                db.commit()

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
            db.add(issue1)
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
        "app": "BugFlow API",
        "version": "4.0.0",
        "architecture": "Defect Intelligence + Engineering Knowledge + Security + Predictive Analytics"
    }
