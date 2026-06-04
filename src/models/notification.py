"""
Notification System Models
Email, SMS, and push notification management
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Boolean
from src.database import Base


class NotificationType(str, Enum):
    """Notification type enumeration"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    WEBHOOK = "webhook"


class NotificationStatus(str, Enum):
    """Notification status enumeration"""
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"
    OPENED = "opened"
    CLICKED = "clicked"


class Notification(Base):
    """
    Notification Model
    Track all notifications sent to users
    """
    __tablename__ = "notification"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    # Notification details
    notification_type = Column(String(20), nullable=False)
    status = Column(String(20), default=NotificationStatus.PENDING)

    # Content
    subject = Column(String(255))
    message = Column(Text, nullable=False)
    recipient = Column(String(255), nullable=False)  # Email, phone, or endpoint

    # Reference
    reference_id = Column(String(100))  # Order ID, etc.
    template_id = Column(String(100))

    # Delivery tracking
    sent_at = Column(DateTime)
    opened_at = Column(DateTime)
    failed_at = Column(DateTime)
    failure_reason = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.notification_type}', status='{self.status}')>"
