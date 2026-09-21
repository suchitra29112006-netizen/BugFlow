from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.developer_profile import DeveloperProfile, DeveloperSkill, DeveloperTechnology, DeveloperCertification
from app.models.user import User, UserRole
from app.auth.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["Developer Intelligence Profiles"])


class SkillInput(BaseModel):
    skill_name: str
    proficiency_level: int = 3
    category: str = "Backend"


class ProfileUpdate(BaseModel):
    years_experience: Optional[float] = None
    primary_specialization: Optional[str] = None
    qualification: Optional[str] = None
    availability_status: Optional[str] = None # AVAILABLE, BUSY, ON_LEAVE
    max_capacity: Optional[int] = None
    skills: Optional[List[SkillInput]] = None
    technologies: Optional[List[str]] = None
    certifications: Optional[List[str]] = None


@router.get("/{user_id}/profile")
def get_developer_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == user_id).first()
    if not profile:
        # Create default profile if user is a developer/admin
        profile = DeveloperProfile(
            user_id=user_id,
            years_experience=3.0 if target_user.role == UserRole.DEVELOPER else 1.0,
            primary_specialization="Full Stack Engineering",
            qualification="B.Tech Computer Science",
            availability_status="AVAILABLE",
            max_capacity=5
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Seed default skills
        default_skills = [
            DeveloperSkill(profile_id=profile.id, skill_name="Python", proficiency_level=4, category="Backend"),
            DeveloperSkill(profile_id=profile.id, skill_name="FastAPI", proficiency_level=4, category="Backend"),
            DeveloperSkill(profile_id=profile.id, skill_name="React", proficiency_level=3, category="Frontend"),
            DeveloperSkill(profile_id=profile.id, skill_name="SQL", proficiency_level=4, category="Database")
        ]
        default_techs = [
            DeveloperTechnology(profile_id=profile.id, tech_name="FastAPI"),
            DeveloperTechnology(profile_id=profile.id, tech_name="PostgreSQL"),
            DeveloperTechnology(profile_id=profile.id, tech_name="Docker")
        ]
        db.add_all(default_skills + default_techs)
        db.commit()
        db.refresh(profile)

    return {
        "user_id": target_user.id,
        "name": target_user.name,
        "email": target_user.email,
        "role": target_user.role.value,
        "years_experience": profile.years_experience,
        "primary_specialization": profile.primary_specialization,
        "qualification": profile.qualification,
        "availability_status": profile.availability_status,
        "max_capacity": profile.max_capacity,
        "skills": [
            {
                "id": s.id,
                "skill_name": s.skill_name,
                "proficiency_level": s.proficiency_level,
                "category": s.category
            }
            for s in profile.skills
        ],
        "technologies": [t.tech_name for t in profile.technologies],
        "certifications": [c.title for c in profile.certifications]
    }


@router.put("/{user_id}/profile")
def update_developer_profile(
    user_id: int,
    p_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied to update profile.")

    profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == user_id).first()
    if not profile:
        profile = DeveloperProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    if p_in.years_experience is not None:
        profile.years_experience = p_in.years_experience
    if p_in.primary_specialization is not None:
        profile.primary_specialization = p_in.primary_specialization
    if p_in.qualification is not None:
        profile.qualification = p_in.qualification
    if p_in.availability_status is not None:
        profile.availability_status = p_in.availability_status
    if p_in.max_capacity is not None:
        profile.max_capacity = p_in.max_capacity

    if p_in.skills is not None:
        db.query(DeveloperSkill).filter(DeveloperSkill.profile_id == profile.id).delete()
        for s in p_in.skills:
            db.add(DeveloperSkill(
                profile_id=profile.id,
                skill_name=s.skill_name,
                proficiency_level=s.proficiency_level,
                category=s.category
            ))

    if p_in.technologies is not None:
        db.query(DeveloperTechnology).filter(DeveloperTechnology.profile_id == profile.id).delete()
        for t in p_in.technologies:
            db.add(DeveloperTechnology(profile_id=profile.id, tech_name=t))

    db.commit()
    return get_developer_profile(user_id, db, current_user)
