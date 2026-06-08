"""
Shopping Mall Models
Products, categories, and catalog management
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text, Boolean
from src.database import Base


class Category(Base):
    """
    Category Model
    Product categorization and hierarchy
    """
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    parent_category_id = Column(Integer, ForeignKey('category.id'))

    # Display
    image_url = Column(String(500))
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"


class Product(Base):
    """
    Product Model
    Main product information for catalog
    """
    __tablename__ = "product"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)

    # Category
    category_id = Column(Integer, ForeignKey('category.id'))

    # Pricing
    price = Column(Float, nullable=False)
    cost = Column(Float)
    discount_price = Column(Float)

    # Product details
    weight = Column(Float)
    dimensions = Column(String(100))
    color = Column(String(50))
    size = Column(String(50))

    # Catalog
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    image_url = Column(String(500))

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}')>"
