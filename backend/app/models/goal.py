from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True) # Squad
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(String(50), default="Engineering", nullable=False) # Engineering, Product, Quality, Reliability, Security, Delivery, Operational, Customer Experience, Data & AI, Other
    time_period = Column(String(50), default="Q4 2026", nullable=False)
    target_metric = Column(String(255), nullable=True, default="Reduce defects by 30%")
    current_progress = Column(Float, default=0.0) # 0.0 to 100.0
    expected_progress = Column(Float, default=0.0) # 0.0 to 100.0
    status = Column(String(50), default="ON_TRACK") # NOT_STARTED, ON_TRACK, AT_RISK, BEHIND, COMPLETED
    health_summary = Column(Text, nullable=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    target_date = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User")
    team = relationship("Team")
    department = relationship("Department", back_populates="goals")
    workspace = relationship("Workspace")

    key_results = relationship("KeyResult", back_populates="goal", cascade="all, delete-orphan")
    links = relationship("GoalLink", back_populates="goal", cascade="all, delete-orphan")
    progress_history = relationship("GoalProgressHistory", back_populates="goal", cascade="all, delete-orphan")
    activities = relationship("GoalActivity", back_populates="goal", cascade="all, delete-orphan")
    project_links = relationship("GoalProjectLink", back_populates="goal", cascade="all, delete-orphan")


class KeyResult(Base):
    __tablename__ = "key_results"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    metric_type = Column(String(50), default="PERCENTAGE") # NUMERIC, PERCENTAGE, DURATION, COUNT, BOOLEAN
    direction = Column(String(50), default="HIGHER_IS_BETTER") # HIGHER_IS_BETTER, LOWER_IS_BETTER, MAINTAIN
    start_value = Column(Float, default=0.0)
    current_value = Column(Float, default=0.0)
    target_value = Column(Float, default=100.0)
    unit = Column(String(50), default="%")
    data_source = Column(String(50), default="MANUAL") # MANUAL, BUGS_TASKS, SLA_ENGINE, QA_TEST_MGMT, RELEASES, INCIDENTS, PROJECTS, SPRINTS, TIME_TRACKING
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="ON_TRACK") # NOT_STARTED, ON_TRACK, AT_RISK, BEHIND, COMPLETED
    progress_pct = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    goal = relationship("Goal", back_populates="key_results")
    owner = relationship("User")
    updates = relationship("KeyResultUpdateHistory", back_populates="key_result", cascade="all, delete-orphan")


class KeyResultUpdateHistory(Base):
    __tablename__ = "key_result_update_histories"

    id = Column(Integer, primary_key=True, index=True)
    key_result_id = Column(Integer, ForeignKey("key_results.id", ondelete="CASCADE"), nullable=False)
    value = Column(Float, nullable=False)
    update_note = Column(Text, nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    key_result = relationship("KeyResult", back_populates="updates")
    updated_by = relationship("User")


class GoalLink(Base):
    __tablename__ = "goal_links"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(50), nullable=False) # PROJECT, SQUAD, WORKSPACE, SPRINT, ISSUE, MILESTONE, RELEASE, INCIDENT
    entity_id = Column(Integer, nullable=False)
    contribution_weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="links")


class GoalProgressHistory(Base):
    __tablename__ = "goal_progress_histories"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    recorded_date = Column(DateTime, default=datetime.utcnow)
    progress_pct = Column(Float, default=0.0)
    status = Column(String(50), default="ON_TRACK")

    goal = relationship("Goal", back_populates="progress_history")


class GoalActivity(Base):
    __tablename__ = "goal_activities"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="activities")
    user = relationship("User")


class GoalProjectLink(Base):
    __tablename__ = "goal_project_links"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    goal = relationship("Goal", back_populates="project_links")
    project = relationship("Project")
