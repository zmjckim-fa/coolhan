"""
Member System Models
User account management, roles, and authentication
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Table, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class RoleEnum(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    USER = "user"
    MODERATOR = "moderator"
    GUEST = "guest"


class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DELETED = "deleted"


# Association table for many-to-many relationship
user_role = Table(
    'user_role',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('user.id')),
    Column('role_id', Integer, ForeignKey('role.id'))
)


class Role(Base):
    """
    User Role Model
    Defines permissions and access levels
    """
    __tablename__ = "role"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(500))
    permissions = Column(String(1000))  # JSON array of permissions
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", secondary=user_role, back_populates="roles")


class User(Base):
    """
    User Model
    Core user account and profile information
    """
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    status = Column(String(20), default=UserStatus.ACTIVE)
    email_verified = Column(Boolean, default=False)
    phone_number = Column(String(20))
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    roles = relationship("Role", secondary=user_role, back_populates="users")

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}".strip()

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"


class UserRole(Base):
    """
    User Role Association
    Explicit mapping of users to roles
    """
    __tablename__ = "user_role_explicit"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    role_id = Column(Integer, ForeignKey('role.id'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(Integer, ForeignKey('user.id'))

    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"
