"""
Member System CRUD Operations
User account management operations
"""

from sqlalchemy.orm import Session
from src.models.member import User, Role, UserStatus


class MemberCRUD:
    """CRUD operations for member system"""

    @staticmethod
    def create_user(db: Session, username: str, email: str, password_hash: str, **kwargs) -> User:
        """Create a new user"""
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            **kwargs
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def list_users(db: Session, skip: int = 0, limit: int = 100) -> list:
        """List all users with pagination"""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> User:
        """Update user information"""
        user = MemberCRUD.get_user_by_id(db, user_id)
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Soft delete user (mark as deleted)"""
        user = MemberCRUD.get_user_by_id(db, user_id)
        if user:
            user.status = UserStatus.DELETED
            db.commit()
            return True
        return False

    @staticmethod
    def create_role(db: Session, name: str, description: str = "", permissions: str = "") -> Role:
        """Create a new role"""
        role = Role(name=name, description=description, permissions=permissions)
        db.add(role)
        db.commit()
        db.refresh(role)
        return role

    @staticmethod
    def get_role_by_id(db: Session, role_id: int) -> Role:
        """Get role by ID"""
        return db.query(Role).filter(Role.id == role_id).first()

    @staticmethod
    def assign_role_to_user(db: Session, user_id: int, role_id: int) -> bool:
        """Assign role to user"""
        user = MemberCRUD.get_user_by_id(db, user_id)
        role = MemberCRUD.get_role_by_id(db, role_id)
        if user and role and role not in user.roles:
            user.roles.append(role)
            db.commit()
            return True
        return False
