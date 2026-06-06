"""Integration Tests - Full Workflow"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from src.database import Base, get_db


@pytest.fixture
def test_db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield db
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_db):
    """Create test client"""
    return TestClient(app)


def test_create_user_and_get(client):
    """Test creating and retrieving user"""
    response = client.post(
        "/api/members/",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password_hash": "hashed",
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == 200
    user_id = response.json()["id"]

    response = client.get(f"/api/members/{user_id}")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    print("✅ test_create_user_and_get passed")


def test_create_category_and_product(client):
    """Test creating category and product"""
    cat_response = client.post(
        "/api/shopping/categories/",
        json={"name": "Electronics", "description": "Electronic devices"},
    )
    assert cat_response.status_code == 200
    category_id = cat_response.json()["id"]

    prod_response = client.post(
        "/api/shopping/products/",
        json={
            "sku": "PROD001",
            "name": "Test Product",
            "price": 99.99,
            "category_id": category_id,
        },
    )
    assert prod_response.status_code == 200
    assert prod_response.json()["sku"] == "PROD001"
    print("✅ test_create_category_and_product passed")


def test_create_order_workflow(client):
    """Test order creation workflow"""
    # Create user
    user_response = client.post(
        "/api/members/",
        json={
            "username": "orderuser",
            "email": "order@example.com",
            "password_hash": "hashed",
        },
    )
    user_id = user_response.json()["id"]

    # Create order
    order_response = client.post(
        "/api/orders/",
        json={
            "user_id": user_id,
            "order_number": "ORD-001",
            "total_amount": 199.99,
            "items": [
                {"product_id": 1, "quantity": 2, "unit_price": 99.99}
            ],
        },
    )
    assert order_response.status_code == 200
    order_id = order_response.json()["id"]

    # Get order
    response = client.get(f"/api/orders/{order_id}")
    assert response.status_code == 200
    print("✅ test_create_order_workflow passed")


def test_payment_idempotency(client):
    """Test payment idempotency"""
    # Create first payment
    response1 = client.post(
        "/api/payments/",
        json={
            "order_id": 1,
            "amount": 99.99,
            "method": "credit_card",
            "idempotency_key": "unique-key-123",
        },
    )
    assert response1.status_code == 200
    payment_id_1 = response1.json()["id"]

    # Create with same idempotency key
    response2 = client.post(
        "/api/payments/",
        json={
            "order_id": 1,
            "amount": 99.99,
            "method": "credit_card",
            "idempotency_key": "unique-key-123",
        },
    )
    assert response2.status_code == 200
    payment_id_2 = response2.json()["id"]

    # Should be same payment
    assert payment_id_1 == payment_id_2
    print("✅ test_payment_idempotency passed")


def test_health_check(client):
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✅ test_health_check passed")


def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "CoolHan API"
    print("✅ test_root_endpoint passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
