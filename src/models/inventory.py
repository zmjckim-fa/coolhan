"""
Inventory Management Models
Stock levels, reservations, and transaction tracking
"""

from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text
from src.database import Base


class InventoryStatus(str, Enum):
    """Inventory status enumeration"""
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"


class TransactionType(str, Enum):
    """Inventory transaction type"""
    PURCHASE = "purchase"
    SALE = "sale"
    ADJUSTMENT = "adjustment"
    RETURN = "return"
    DAMAGE = "damage"
    RESTOCK = "restock"


class InventoryItem(Base):
    """
    Inventory Item Model
    Product stock level tracking and reservations
    """
    __tablename__ = "inventory_item"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False, unique=True)

    # Stock levels
    quantity_available = Column(Integer, default=0)
    quantity_reserved = Column(Integer, default=0)
    quantity_damaged = Column(Integer, default=0)

    # Min/Max thresholds
    minimum_level = Column(Integer, default=10)
    maximum_level = Column(Integer, default=1000)

    # Status
    status = Column(String(20), default=InventoryStatus.OUT_OF_STOCK)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_restocked = Column(DateTime)

    @property
    def quantity_usable(self) -> int:
        """Calculate usable quantity (available - reserved)"""
        return max(0, self.quantity_available - self.quantity_reserved)

    def __repr__(self):
        return f"<InventoryItem(product_id={self.product_id}, available={self.quantity_available})>"


class InventoryTransaction(Base):
    """
    Inventory Transaction Model
    Record of all inventory movements for audit trail
    """
    __tablename__ = "inventory_transaction"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey('inventory_item.id'), nullable=False)

    # Transaction details
    transaction_type = Column(String(20), nullable=False)
    quantity_change = Column(Integer, nullable=False)
    reference_id = Column(String(100))  # Order ID, Return ID, etc.

    # Notes
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def __repr__(self):
        return f"<InventoryTransaction(type='{self.transaction_type}', qty_change={self.quantity_change})>"
