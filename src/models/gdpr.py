"""
GDPR & Privacy Models
Data subject rights and consent management
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Boolean
from src.database import Base


class ConsentType(str, Enum):
    """Consent type enumeration"""
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    DATA_PROCESSING = "data_processing"
    THIRD_PARTY = "third_party"
    PROFILING = "profiling"


class DataSubject(Base):
    """
    Data Subject Model
    Track user data privacy preferences and rights
    """
    __tablename__ = "data_subject"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False, unique=True)

    # Right to be forgotten
    deletion_requested = Column(Boolean, default=False)
    deletion_requested_at = Column(DateTime)

    # Data access requests
    data_export_requested = Column(Boolean, default=False)
    data_export_requested_at = Column(DateTime)
    last_data_export = Column(DateTime)

    # Marketing preferences
    marketing_consent = Column(Boolean, default=False)
    analytics_consent = Column(Boolean, default=False)
    profiling_consent = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<DataSubject(user_id={self.user_id})>"


class ConsentLog(Base):
    """
    Consent Log Model
    Audit trail of all consent decisions
    """
    __tablename__ = "consent_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    # Consent details
    consent_type = Column(String(50), nullable=False)
    given = Column(Boolean, nullable=False)

    # Context
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    method = Column(String(50))  # email, web-form, api, etc.

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<ConsentLog(user_id={self.user_id}, type='{self.consent_type}', given={self.given})>"
