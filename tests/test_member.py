"""
Member System Tests
Unit tests for member CRUD operations
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database import Base
from src.crud.member import MemberCRUD
from src.models.member import UserStatus


@pytest.fixture
def db():
    """Create in-memory SQLite database for tests"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


def test_create_user(db):
    """Test user creation"""
    user = MemberCRUD.create_user(
        db,
        username="testuser",
        email="test@example.com",
        password_hash="hashedpwd",
        first_name="Test",
        last_name="User",
    )

    assert user.id is not None
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.status == UserStatus.ACTIVE
    print("✅ test_create_user passed")


def test_get_user_by_username(db):
    """Test getting user by username"""
    MemberCRUD.create_user(
        db,
        username="testuser",
        email="test@example.com",
        password_hash="hashedpwd",
    )

    user = MemberCRUD.get_user_by_username(db, "testuser")
    assert user is not None
    assert user.username == "testuser"
    print("✅ test_get_user_by_username passed")


def test_get_user_by_email(db):
    """Test getting user by email"""
    MemberCRUD.create_user(
        db,
        username="testuser",
        email="test@example.com",
        password_hash="hashedpwd",
    )

    user = MemberCRUD.get_user_by_email(db, "test@example.com")
    assert user is not None
    assert user.email == "test@example.com"
    print("✅ test_get_user_by_email passed")


def test_update_user(db):
    """Test user update"""
    user = MemberCRUD.create_user(
        db,
        username="testuser",
        email="test@example.com",
        password_hash="hashedpwd",
        first_name="Test",
    )

    updated = MemberCRUD.update_user(db, user.id, first_name="Updated")
    assert updated.first_name == "Updated"
    print("✅ test_update_user passed")


def test_list_users(db):
    """Test listing users"""
    for i in range(3):
        MemberCRUD.create_user(
            db,
            username=f"user{i}",
            email=f"user{i}@example.com",
            password_hash="hashedpwd",
        )

    users = MemberCRUD.list_users(db, limit=10)
    assert len(users) == 3
    print("✅ test_list_users passed")


def test_create_role(db):
    """Test role creation"""
    role = MemberCRUD.create_role(db, name="admin", description="Administrator")
    assert role.id is not None
    assert role.name == "admin"
    print("✅ test_create_role passed")


def test_assign_role_to_user(db):
    """Test assigning role to user"""
    user = MemberCRUD.create_user(
        db,
        username="testuser",
        email="test@example.com",
        password_hash="hashedpwd",
    )
    role = MemberCRUD.create_role(db, name="admin")

    result = MemberCRUD.assign_role_to_user(db, user.id, role.id)
    assert result is True

    # Verify role was assigned
    updated_user = MemberCRUD.get_user_by_id(db, user.id)
    assert len(updated_user.roles) == 1
    assert updated_user.roles[0].name == "admin"
    print("✅ test_assign_role_to_user passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
