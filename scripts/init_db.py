"""
Database Initialization Script
Creates all tables and initial data
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import init_db, SessionLocal, drop_db
from src.crud.member import MemberCRUD
from src.models.member import RoleEnum
import hashlib


def hash_password(password: str) -> str:
    """Hash a password"""
    return hashlib.sha256(password.encode()).hexdigest()


def init():
    """Initialize database with tables and sample data"""
    print("🔄 Creating database tables...")
    init_db()
    print("✅ Tables created")

    print("\n🔄 Creating initial roles...")
    db = SessionLocal()

    # Create default roles
    admin_role = MemberCRUD.create_role(
        db,
        name="admin",
        description="Administrator with full access",
        permissions='["all"]',
    )
    print(f"✅ Admin role created (id={admin_role.id})")

    user_role = MemberCRUD.create_role(
        db,
        name="user",
        description="Regular user",
        permissions='["read:own_data", "write:own_data"]',
    )
    print(f"✅ User role created (id={user_role.id})")

    moderator_role = MemberCRUD.create_role(
        db,
        name="moderator",
        description="Moderator with content management",
        permissions='["moderate"]',
    )
    print(f"✅ Moderator role created (id={moderator_role.id})")

    print("\n🔄 Creating sample users...")

    # Create admin user
    admin_user = MemberCRUD.create_user(
        db,
        username="admin",
        email="admin@coolhan.local",
        password_hash=hash_password("admin123"),
        first_name="Admin",
        last_name="User",
    )
    MemberCRUD.assign_role_to_user(db, admin_user.id, admin_role.id)
    print(f"✅ Admin user created (id={admin_user.id}, email=admin@coolhan.local)")

    # Create test users
    for i in range(1, 4):
        test_user = MemberCRUD.create_user(
            db,
            username=f"user{i}",
            email=f"user{i}@coolhan.local",
            password_hash=hash_password(f"password{i}"),
            first_name=f"Test{i}",
            last_name="User",
        )
        MemberCRUD.assign_role_to_user(db, test_user.id, user_role.id)
        print(f"✅ Test user {i} created (id={test_user.id}, email=user{i}@coolhan.local)")

    db.close()

    print("\n✨ Database initialization complete!")
    print("\n📊 Sample Credentials:")
    print("  Admin:  admin@coolhan.local / admin123")
    print("  User 1: user1@coolhan.local / password1")
    print("  User 2: user2@coolhan.local / password2")
    print("  User 3: user3@coolhan.local / password3")


def reset():
    """Reset database (WARNING: deletes all data)"""
    confirm = input("⚠️  WARNING: This will delete ALL data. Continue? (yes/no): ")
    if confirm.lower() == "yes":
        print("🔄 Dropping all tables...")
        drop_db()
        print("✅ All tables dropped")
        print("\n🔄 Recreating database...")
        init()
    else:
        print("❌ Cancelled")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database initialization")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset database (WARNING: deletes all data)",
    )

    args = parser.parse_args()

    if args.reset:
        reset()
    else:
        init()
