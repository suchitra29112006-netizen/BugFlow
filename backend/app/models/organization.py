from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="BugFlow Technologies")
    logo_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True, default="AI-Powered Engineering & Defect Intelligence Platform")
    industry = Column(String(150), nullable=True, default="Software Engineering & Technology")
    company_size = Column(String(100), nullable=True, default="50-200 Employees")
    timezone = Column(String(100), nullable=True, default="UTC (Coordinated Universal Time)")
    working_hours = Column(String(100), nullable=True, default="09:00 - 18:00 MON-FRI")
    currency = Column(String(50), nullable=True, default="USD ($)")
    country = Column(String(100), nullable=True, default="United States")
    state_region = Column(String(100), nullable=True, default="California")
    city = Column(String(100), nullable=True, default="San Francisco")
    website = Column(String(255), nullable=True, default="https://bugflow.io")
    plan = Column(String(50), nullable=True, default="Enterprise / AI Tier")
    sla_settings_json = Column(Text, nullable=True)
    working_schedule_json = Column(Text, nullable=True)
    regional_settings_json = Column(Text, nullable=True)
    ai_settings_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="organization", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="departments")
    teams = relationship("Team", back_populates="department")
