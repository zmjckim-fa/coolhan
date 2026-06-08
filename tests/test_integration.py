"""
CoolHan Integration Tests
Full API flow testing: auth → orders → payments → reviews → inventory
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.auth import hash_password
from src.crud.member import MemberCRUD
from main import app


# --- Test DB Fixture ---
@pytest.fixture(scope="function")
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    db = TestSession()

    # Seed: roles
    admin_role = MemberCRUD.create_role(db, name="admin", description="Admin", permissions='["all"]')
    user_role = MemberCRUD.create_role(db, name="user", description="User", permissions='["read"]')

    # Seed: admin user
    admin = MemberCRUD.create_user(db, username="admin", email="admin@test.com",
                                   password_hash=hash_password("admin123"),
                                   first_name="Admin", last_name="User")
    MemberCRUD.assign_role_to_user(db, admin.id, admin_role.id)
    db.close()

    yield TestSession

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(test_db):
    return TestClient(app)


# --- Auth Tests ---
class TestAuth:
    def test_admin_login(self, client):
        r = client.post("/api/auth/login",
                        data={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["username"] == "admin"

    def test_register_user(self, client):
        r = client.post("/api/auth/register", json={
            "username": "newuser", "email": "new@test.com",
            "password": "pass1234", "first_name": "New", "last_name": "User"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["username"] == "newuser"
        assert "access_token" in data

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "username": "u1", "email": "dup@test.com", "password": "pass"
        })
        r = client.post("/api/auth/register", json={
            "username": "u2", "email": "dup@test.com", "password": "pass"
        })
        assert r.status_code == 400

    def test_get_me_with_token(self, client):
        reg = client.post("/api/auth/register", json={
            "username": "me_user", "email": "me@test.com", "password": "mepass"
        })
        token = reg.json()["access_token"]
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["username"] == "me_user"
        assert "user" in data["roles"]

    def test_get_me_no_token(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_wrong_password(self, client):
        r = client.post("/api/auth/login",
                        data={"username": "admin", "password": "wrongpass"})
        assert r.status_code == 401

    def test_logout(self, client):
        reg = client.post("/api/auth/register", json={
            "username": "logout_user", "email": "logout@test.com", "password": "pass"
        })
        token = reg.json()["access_token"]
        r = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200


# --- Order Tests ---
class TestOrders:
    def _get_user(self, client, suffix=""):
        reg = client.post("/api/auth/register", json={
            "username": f"order_user{suffix}", "email": f"order{suffix}@test.com",
            "password": "orderpass", "first_name": "Order", "last_name": "User"
        })
        return reg.json()["user_id"], reg.json()["access_token"]

    def test_create_order(self, client):
        user_id, _ = self._get_user(client, "1")
        r = client.post("/api/orders/", json={
            "user_id": user_id,
            "order_number": "ORD-IT-001",
            "total_amount": 99.99,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["order_number"] == "ORD-IT-001"
        assert data["status"] == "pending"
        assert data["total_amount"] == 99.99

    def test_duplicate_order_number(self, client):
        user_id, _ = self._get_user(client, "2")
        client.post("/api/orders/", json={
            "user_id": user_id, "order_number": "ORD-DUP", "total_amount": 10.0
        })
        r = client.post("/api/orders/", json={
            "user_id": user_id, "order_number": "ORD-DUP", "total_amount": 10.0
        })
        assert r.status_code == 409

    def test_get_order(self, client):
        user_id, _ = self._get_user(client, "3")
        create = client.post("/api/orders/", json={
            "user_id": user_id, "order_number": "ORD-GET-001", "total_amount": 50.0
        })
        order_id = create.json()["id"]
        r = client.get(f"/api/orders/{order_id}")
        assert r.status_code == 200
        assert r.json()["id"] == order_id

    def test_cancel_order(self, client):
        user_id, _ = self._get_user(client, "4")
        create = client.post("/api/orders/", json={
            "user_id": user_id, "order_number": "ORD-CANCEL-001", "total_amount": 50.0
        })
        order_id = create.json()["id"]
        r = client.post(f"/api/orders/{order_id}/cancel")
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"


# --- Payment Tests ---
class TestPayments:
    def _setup(self, client, suffix=""):
        user_reg = client.post("/api/auth/register", json={
            "username": f"pay{suffix}_user", "email": f"pay{suffix}@test.com",
            "password": "paypass"
        })
        uid = user_reg.json()["user_id"]
        order = client.post("/api/orders/", json={
            "user_id": uid, "order_number": f"ORD-PAY-{suffix}", "total_amount": 79.99
        })
        return uid, order.json()["id"]

    def test_create_payment_idempotent(self, client):
        uid, oid = self._setup(client, "1")

        r1 = client.post("/api/payments/", json={
            "order_id": oid, "amount": 79.99,
            "method": "credit_card", "idempotency_key": f"pay-{oid}-001"
        })
        assert r1.status_code == 200
        pid = r1.json()["id"]

        # Duplicate key → same payment
        r2 = client.post("/api/payments/", json={
            "order_id": oid, "amount": 79.99,
            "method": "credit_card", "idempotency_key": f"pay-{oid}-001"
        })
        assert r2.status_code == 200
        assert r2.json()["id"] == pid

    def test_complete_payment(self, client):
        uid, oid = self._setup(client, "2")
        pay = client.post("/api/payments/", json={
            "order_id": oid, "amount": 49.99,
            "method": "paypal", "idempotency_key": f"pay-{oid}-002"
        })
        pid = pay.json()["id"]

        r = client.post(f"/api/payments/{pid}/complete",
                        params={"transaction_id": "TXN-TEST-001"})
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "completed"
        assert data["transaction_id"] == "TXN-TEST-001"
        assert data["completed_at"] is not None

    def test_fail_payment(self, client):
        uid, oid = self._setup(client, "3")
        pay = client.post("/api/payments/", json={
            "order_id": oid, "amount": 49.99,
            "method": "bank_transfer", "idempotency_key": f"pay-{oid}-003"
        })
        pid = pay.json()["id"]

        r = client.post(f"/api/payments/{pid}/fail",
                        params={"error_message": "Insufficient funds"})
        assert r.status_code == 200
        assert r.json()["status"] == "failed"


# --- Shopping Tests ---
class TestShopping:
    def test_list_products_empty(self, client):
        r = client.get("/api/shopping/products/")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_category_and_product(self, client):
        r = client.post("/api/shopping/categories/", json={
            "name": "Electronics", "description": "Electronic devices"
        })
        assert r.status_code == 200
        cat_id = r.json()["id"]

        r = client.post("/api/shopping/products/", json={
            "sku": "ELEC-TEST-001", "name": "Test Headphones",
            "price": 89.99, "category_id": cat_id
        })
        assert r.status_code == 200
        data = r.json()
        assert data["sku"] == "ELEC-TEST-001"
        assert data["price"] == 89.99


# --- Health Tests ---
class TestHealth:
    def test_health_check(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "running"
