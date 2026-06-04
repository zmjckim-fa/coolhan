"""
Shipping & Logistics Models
Shipment tracking and delivery management
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from src.database import Base


class ShipmentStatus(str, Enum):
    """Shipment status enumeration"""
    CREATED = "created"
    PICKED = "picked"
    PACKED = "packed"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETURNED = "returned"


class Shipment(Base):
    """
    Shipment Model
    Tracking and delivery information for orders
    """
    __tablename__ = "shipment"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('order.id'), nullable=False)

    # Tracking
    tracking_number = Column(String(100), unique=True, index=True)
    carrier = Column(String(50))  # FedEx, UPS, DHL, etc.
    status = Column(String(20), default=ShipmentStatus.CREATED)

    # Addresses
    origin_address = Column(Text)
    destination_address = Column(Text)

    # Dimensions & weight
    weight = Column(String(50))
    dimensions = Column(String(100))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)
    estimated_delivery = Column(DateTime)

    # Signature required
    signature_required = Column(String(50), default="no")

    def __repr__(self):
        return f"<Shipment(tracking='{self.tracking_number}', status='{self.status}')>"
