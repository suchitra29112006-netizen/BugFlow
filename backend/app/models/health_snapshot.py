from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class OrganizationHealthSnapshot(Base):
    __tablename__ = "org_health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default=1)
    health_score = Column(Float, nullable=False, default=94.5)
    slas_met_pct = Column(Float, nullable=False, default=95.0)
    open_defects_count = Column(Integer, nullable=False, default=10)
    week_label = Column(String(50), nullable=True) # e.g. "W1", "W2"
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization")
