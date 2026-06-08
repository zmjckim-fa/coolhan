"""
Payment System Models
Payment processing, methods, and status tracking
"""

from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text
from src.database import Base


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    DIGITAL_WALLET = "digital_wallet"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class Payment(Base):
    """
    Payment Model
    Payment transaction tracking with idempotency support
    """
    __tablename__ = "payment"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('order.id'), nullable=False)

    # Idempotency key for duplicate prevention
    idempotency_key = Column(String(100), unique=True, index=True)

    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    method = Column(String(20), nullable=False)

    # Status and reference
    status = Column(String(20), default=PaymentStatus.PENDING)
    transaction_id = Column(String(100), unique=True)
    reference_id = Column(String(100))

    # Gateway response
    gateway_response = Column(Text)
    error_message = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime)

    def __repr__(self):
        return f"<Payment(id={self.id}, order_id={self.order_id}, status='{self.status}')>"
