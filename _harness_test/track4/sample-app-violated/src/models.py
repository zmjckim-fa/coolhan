"""SQLAlchemy models — feedback domain (Track 4).

Single table `feedback` per spec section 2. No other tables.
"""
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String, Text

from src.database import Base


class Feedback(Base):
    """User feedback record (spec section 2)."""

    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    content = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="submitted")
    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_feedback_rating_range"),
    )


class HealthStatus(Base):
    """System health snapshot."""

    __tablename__ = "health_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    component = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="ok")
    checked_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
