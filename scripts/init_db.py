"""
Database Initialization Script
Creates all tables and initial data
"""

import sys
import os
from pathlib import Path

# Windows: Force UTF-8 output
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import init_db, SessionLocal, drop_db
from src.crud.member import MemberCRUD
from src.crud.shopping import ShoppingCRUD
from src.crud.inventory import InventoryCRUD
from src.auth import hash_password


def get_or_create_role(db, name, description, permissions):
    """Get existing role or create new one (idempotent)."""
    from src.models.member import Role
    existing = db.query(Role).filter(Role.name == name).first()
    if existing:
        print(f"[SKIP] Role '{name}' already exists (id={existing.id})")
        return existing
    return MemberCRUD.create_role(db, name=name, description=description, permissions=permissions)


def get_or_create_user(db, username, email, password, first_name, last_name, role):
    """Get existing user or create new one (idempotent)."""
    existing = MemberCRUD.get_user_by_username(db, username)
    if existing:
        print(f"[SKIP] User '{username}' already exists (id={existing.id})")
        return existing
    user = MemberCRUD.create_user(db, username=username, email=email,
                                   password_hash=hash_password(password),
                                   first_name=first_name, last_name=last_name)
    MemberCRUD.assign_role_to_user(db, user.id, role.id)
    return user


def get_or_create_category(db, name, description):
    from src.models.shopping import Category
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        print(f"[SKIP] Category '{name}' already exists")
        return existing
    return ShoppingCRUD.create_category(db, name=name, description=description)


def get_or_create_product(db, sku, name, price, category_id):
    from src.models.shopping import Product
    existing = db.query(Product).filter(Product.sku == sku).first()
    if existing:
        print(f"[SKIP] Product '{sku}' already exists")
        return existing
    return ShoppingCRUD.create_product(db, sku=sku, name=name, price=price, category_id=category_id)


def init():
    """Initialize database with tables and sample data (idempotent)."""
    print("[DB] Creating database tables...")
    init_db()
    print("[OK] Tables created")

    db = SessionLocal()

    print("\n[DB] Seeding roles...")
    admin_role = get_or_create_role(db, "admin", "Administrator with full access", '["all"]')
    print(f"[OK] admin role id={admin_role.id}")
    user_role = get_or_create_role(db, "user", "Regular user", '["read:own_data", "write:own_data"]')
    print(f"[OK] user role id={user_role.id}")
    moderator_role = get_or_create_role(db, "moderator", "Moderator", '["moderate"]')
    print(f"[OK] moderator role id={moderator_role.id}")

    print("\n[DB] Seeding users...")
    admin_user = get_or_create_user(db, "admin", "admin@coolhan.local", "admin123", "Admin", "User", admin_role)
    print(f"[OK] admin id={admin_user.id}")

    for i in range(1, 4):
        u = get_or_create_user(db, f"user{i}", f"user{i}@coolhan.local", f"password{i}", f"Test{i}", "User", user_role)
        print(f"[OK] user{i} id={u.id}")

    print("\n[DB] Seeding categories...")
    cat1 = get_or_create_category(db, "Electronics", "Electronic devices")
    cat2 = get_or_create_category(db, "Clothing", "Apparel and accessories")
    cat3 = get_or_create_category(db, "Books", "Books and media")
    print(f"[OK] Categories: Electronics(id={cat1.id}), Clothing(id={cat2.id}), Books(id={cat3.id})")

    print("\n[DB] Seeding products...")
    products_data = [
        ("ELEC-001", "Wireless Headphones", 79.99, cat1.id, 50),
        ("ELEC-002", "USB-C Hub", 49.99, cat1.id, 30),
        ("CLTH-001", "Cotton T-Shirt", 19.99, cat2.id, 100),
        ("CLTH-002", "Denim Jeans", 59.99, cat2.id, 75),
        ("BOOK-001", "Python Programming", 39.99, cat3.id, 200),
    ]
    from src.models.inventory import InventoryItem
    for sku, name, price, cat_id, qty in products_data:
        p = get_or_create_product(db, sku=sku, name=name, price=price, category_id=cat_id)
        print(f"[OK] Product '{name}' id={p.id}")
        # Idempotent inventory
        existing_inv = db.query(InventoryItem).filter(InventoryItem.product_id == p.id).first()
        if not existing_inv:
            inv = InventoryCRUD.create_inventory_item(db, product_id=p.id, quantity_available=qty, minimum_level=10)
            print(f"[OK] Inventory: product_id={p.id} qty={qty} status={inv.status}")
        else:
            print(f"[SKIP] Inventory for product_id={p.id} already exists")

    db.close()

    print("\n" + "="*50)
    print("DATABASE INITIALIZATION COMPLETE")
    print("="*50)
    print("\nSample Credentials:")
    print("  Admin:  admin@coolhan.local / admin123")
    print("  User1:  user1@coolhan.local / password1")
    print("  User2:  user2@coolhan.local / password2")
    print("  User3:  user3@coolhan.local / password3")
    print("\nProducts: 5 items seeded")
    print("Inventory: 5 items stocked")
    print(f"\nDatabase: {Path('coolhan.db').resolve()}")


def reset():
    """Reset database (WARNING: deletes all data)"""
    confirm = input("WARNING: This will delete ALL data. Continue? (yes/no): ")
    if confirm.lower() == "yes":
        print("[DB] Dropping all tables...")
        drop_db()
        print("[OK] All tables dropped")
        init()
    else:
        print("[CANCELLED]")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database initialization")
    parser.add_argument("--reset", action="store_true", help="Reset database")
    args = parser.parse_args()

    if args.reset:
        reset()
    else:
        init()
