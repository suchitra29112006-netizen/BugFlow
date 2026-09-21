from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    department = Column(String(100), default="Engineering", nullable=False)
    highest_qualification = Column(String(150), default="B.Tech Computer Science", nullable=False)
    specialization = Column(String(150), default="Full Stack Software Engineering", nullable=False)
    graduation_year = Column(Integer, default=2021, nullable=False)
    years_experience = Column(Float, default=3.5, nullable=False)
    experience_level = Column(String(50), default="Mid-level", nullable=False) # Beginner, Junior, Mid-level, Senior, Expert
    availability_status = Column(String(50), default="Available", nullable=False) # Available, Partially Available, Busy, On Leave
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], backref="user_profile")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    category = Column(String(100), default="Backend", nullable=False) # Backend, Frontend, Database, DevOps, Testing, Security, ML


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    proficiency_level = Column(Integer, default=3, nullable=False) # 1 to 5 stars
    years_experience = Column(Float, default=2.0, nullable=False)
    certification = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], backref="user_skills")
    skill = relationship("Skill", foreign_keys=[skill_id])


class UserDomain(Base):
    __tablename__ = "user_domains"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain = Column(String(100), nullable=False) # FinTech, Healthcare, E-commerce, Cybersecurity, Mobile, Web, Cloud, Database
    experience_level = Column(String(50), default="Intermediate", nullable=False)

    user = relationship("User", foreign_keys=[user_id], backref="user_domains")


class UserProjectExperience(Base):
    __tablename__ = "user_project_experiences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    role = Column(String(100), default="Core Developer", nullable=False)
    years_experience = Column(Float, default=1.5, nullable=False)

    user = relationship("User", foreign_keys=[user_id], backref="user_project_experiences")
    project = relationship("Project", foreign_keys=[project_id])


class AssignmentRecommendation(Base):
    __tablename__ = "assignment_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    recommended_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False) # 0 to 100
    skill_score = Column(Float, default=0.0, nullable=False) # 30%
    experience_score = Column(Float, default=0.0, nullable=False) # 15%
    project_score = Column(Float, default=0.0, nullable=False) # 15%
    domain_score = Column(Float, default=0.0, nullable=False) # 10%
    workload_score = Column(Float, default=0.0, nullable=False) # 15%
    availability_score = Column(Float, default=0.0, nullable=False) # 5%
    historical_score = Column(Float, default=0.0, nullable=False) # 5%
    severity_fit_score = Column(Float, default=0.0, nullable=False) # 5%
    reasoning = Column(Text, nullable=True) # JSON or formatted string of positive reasons & concerns
    confidence = Column(String(50), default="High", nullable=False) # High, Medium, Low
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", foreign_keys=[issue_id])
    recommended_user = relationship("User", foreign_keys=[recommended_user_id])


class AssignmentHistory(Base):
    __tablename__ = "assignment_histories"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recommended_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recommendation_score = Column(Float, nullable=True)
    assignment_source = Column(String(100), default="manual_assignment", nullable=False) # ai_recommendation, manual_assignment, auto_assignment
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issue = relationship("Issue", foreign_keys=[issue_id])
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    recommended_user = relationship("User", foreign_keys=[recommended_user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
