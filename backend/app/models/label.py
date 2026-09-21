from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

issue_labels = Table(
    "issue_labels",
    Base.metadata,
    Column("issue_id", Integer, ForeignKey("issues.id"), primary_key=True),
    Column("label_id", Integer, ForeignKey("labels.id"), primary_key=True)
)


class Label(Base):
    __tablename__ = "labels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    color = Column(String(20), default="#10b981", nullable=False)

    issues = relationship("Issue", secondary=issue_labels, back_populates="labels")
