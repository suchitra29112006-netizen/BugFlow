from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.connection import Base


class DeveloperProfile(Base):
    __tablename__ = "developer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    years_experience = Column(Float, default=1.0, nullable=False)
    primary_specialization = Column(String(100), default="Full Stack", nullable=False)
    qualification = Column(String(150), default="B.Tech / B.E. Computer Science", nullable=False)
    availability_status = Column(String(50), default="AVAILABLE", nullable=False) # AVAILABLE, BUSY, ON_LEAVE
    max_capacity = Column(Integer, default=5, nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="developer_profile")
    skills = relationship("DeveloperSkill", back_populates="profile", cascade="all, delete-orphan")
    technologies = relationship("DeveloperTechnology", back_populates="profile", cascade="all, delete-orphan")
    certifications = relationship("DeveloperCertification", back_populates="profile", cascade="all, delete-orphan")


class DeveloperSkill(Base):
    __tablename__ = "developer_skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("developer_profiles.id"), nullable=False)
    skill_name = Column(String(100), nullable=False) # e.g. Python, FastAPI, React, SQL
    proficiency_level = Column(Integer, default=3, nullable=False) # 1 (Beginner) to 5 (Expert)
    category = Column(String(50), default="Backend", nullable=False)

    profile = relationship("DeveloperProfile", back_populates="skills")


class DeveloperTechnology(Base):
    __tablename__ = "developer_technologies"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("developer_profiles.id"), nullable=False)
    tech_name = Column(String(100), nullable=False) # e.g. Docker, PostgreSQL, Redis

    profile = relationship("DeveloperProfile", back_populates="technologies")


class DeveloperCertification(Base):
    __tablename__ = "developer_certifications"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("developer_profiles.id"), nullable=False)
    title = Column(String(150), nullable=False) # e.g. AWS Certified Developer
    issuer = Column(String(100), nullable=True)

    profile = relationship("DeveloperProfile", back_populates="certifications")
