"""Test All CRUD Operations"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base
from src.crud.inventory import InventoryCRUD
from src.crud.shipping import ShippingCRUD
from src.crud.notification import NotificationCRUD
from src.crud.review import ReviewCRUD
from src.crud.admin import AdminCRUD
from src.crud.shopping import ShoppingCRUD
from src.crud.gdpr import GDPRCRUDsys
from src.models.shipping import ShipmentStatus
from src.models.inventory import TransactionType


@pytest.fixture
def db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


def test_inventory_crud(db):
    """Test inventory CRUD"""
    item = InventoryCRUD.create_inventory_item(db, product_id=1, quantity_available=100)
    assert item.id is not None
    assert item.quantity_available == 100

    retrieved = InventoryCRUD.get_inventory_item(db, item.id)
    assert retrieved.quantity_available == 100

    updated = InventoryCRUD.update_quantity(db, item.id, -10, TransactionType.SALE)
    assert updated.quantity_available == 90
    print("✅ test_inventory_crud passed")


def test_shipping_crud(db):
    """Test shipping CRUD"""
    shipment = ShippingCRUD.create_shipment(db, order_id=1, tracking_number="TRACK001", carrier="FedEx")
    assert shipment.id is not None
    assert shipment.tracking_number == "TRACK001"

    retrieved = ShippingCRUD.get_by_tracking(db, "TRACK001")
    assert retrieved is not None

    updated = ShippingCRUD.update_status(db, shipment.id, ShipmentStatus.SHIPPED)
    assert updated.status == ShipmentStatus.SHIPPED
    print("✅ test_shipping_crud passed")


def test_notification_crud(db):
    """Test notification CRUD"""
    notification = NotificationCRUD.create_notification(
        db, user_id=1, notification_type="email", recipient="test@example.com", message="Test message"
    )
    assert notification.id is not None

    retrieved = NotificationCRUD.get_notification(db, notification.id)
    assert retrieved.message == "Test message"

    updated = NotificationCRUD.mark_as_sent(db, notification.id)
    assert updated.status == "sent"
    print("✅ test_notification_crud passed")


def test_review_crud(db):
    """Test review CRUD"""
    review = ReviewCRUD.create_review(
        db, product_id=1, user_id=1, title="Great product", content="Very good"
    )
    assert review.id is not None

    retrieved = ReviewCRUD.get_review(db, review.id)
    assert retrieved.title == "Great product"
    print("✅ test_review_crud passed")


def test_admin_crud(db):
    """Test admin log CRUD"""
    log = AdminCRUD.create_log(
        db, admin_user_id=1, action="user_delete", resource_type="user", resource_id=5
    )
    assert log.id is not None
    assert log.action == "user_delete"

    retrieved = AdminCRUD.get_log(db, log.id)
    assert retrieved.resource_id == 5
    print("✅ test_admin_crud passed")


def test_shopping_crud(db):
    """Test shopping CRUD"""
    category = ShoppingCRUD.create_category(db, name="Electronics")
    assert category.id is not None

    product = ShoppingCRUD.create_product(
        db, sku="SKU001", name="Test Product", price=99.99, category_id=category.id
    )
    assert product.id is not None

    retrieved = ShoppingCRUD.get_by_sku(db, "SKU001")
    assert retrieved is not None
    print("✅ test_shopping_crud passed")


def test_gdpr_crud(db):
    """Test GDPR CRUD"""
    subject = GDPRCRUDsys.create_data_subject(db, user_id=1)
    assert subject.id is not None

    updated = GDPRCRUDsys.request_deletion(db, user_id=1)
    assert updated.deletion_requested is True

    log = GDPRCRUDsys.create_consent_log(db, user_id=1, consent_type="marketing", given=True)
    assert log.id is not None
    print("✅ test_gdpr_crud passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
