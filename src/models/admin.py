"""
Admin System Models
Administration, audit logs, and system actions
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from src.database import Base


class AdminAction(str, Enum):
    """Admin action type enumeration"""
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    PRODUCT_CREATE = "product_create"
    PRODUCT_UPDATE = "product_update"
    PRODUCT_DELETE = "product_delete"
    ORDER_CANCEL = "order_cancel"
    ORDER_REFUND = "order_refund"
    PAYMENT_MANUAL = "payment_manual"
    DISCOUNT_APPLY = "discount_apply"
    ANALYTICS_EXPORT = "analytics_export"
    SYSTEM_CONFIG = "system_config"
    OTHER = "other"


class AdminLog(Base):
    """
    Admin Log Model
    Audit trail of all administrative actions
    """
    __tablename__ = "admin_log"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    # Action details
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(Integer)

    # Changes
    changes = Column(Text)  # JSON of what changed
    previous_value = Column(Text)
    new_value = Column(Text)

    # Metadata
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    status = Column(String(20), default="success")  # success, failed, pending
    error_message = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<AdminLog(action='{self.action}', resource_id={self.resource_id})>"
