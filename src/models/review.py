"""
Review & Rating System Models
Product reviews and user ratings
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text, Boolean
from src.database import Base


class Review(Base):
    """
    Review Model
    User product reviews with detailed feedback
    """
    __tablename__ = "review"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    # Review content
    title = Column(String(255), nullable=False)
    content = Column(Text)

    # Verification
    verified_purchase = Column(Boolean, default=False)

    # Moderation
    status = Column(String(20), default="pending")  # pending, approved, rejected
    helpful_count = Column(Integer, default=0)
    unhelpful_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Review(id={self.id}, product_id={self.product_id}, status='{self.status}')>"


class Rating(Base):
    """
    Rating Model
    Numerical ratings for products
    """
    __tablename__ = "rating"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    # Rating
    score = Column(Integer, nullable=False)  # 1-5

    # Criteria ratings (optional)
    quality_rating = Column(Integer)
    value_rating = Column(Integer)
    delivery_rating = Column(Integer)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Rating(product_id={self.product_id}, score={self.score})>"
