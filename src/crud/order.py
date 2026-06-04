"""
Order Management CRUD Operations
Order creation and management operations
"""

from sqlalchemy.orm import Session
from src.models.order import Order, OrderItem, OrderStatus
from datetime import datetime


class OrderCRUD:
    """CRUD operations for order management"""

    @staticmethod
    def create_order(db: Session, user_id: int, order_number: str, total_amount: float, **kwargs) -> Order:
        """Create a new order"""
        order = Order(
            user_id=user_id,
            order_number=order_number,
            total_amount=total_amount,
            **kwargs
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Order:
        """Get order by ID"""
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_order_by_number(db: Session, order_number: str) -> Order:
        """Get order by order number"""
        return db.query(Order).filter(Order.order_number == order_number).first()

    @staticmethod
    def list_orders_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list:
        """Get all orders for a user"""
        return db.query(Order).filter(Order.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def update_order_status(db: Session, order_id: int, status: OrderStatus) -> Order:
        """Update order status"""
        order = OrderCRUD.get_order_by_id(db, order_id)
        if order:
            order.status = status
            if status == OrderStatus.SHIPPED:
                order.shipped_at = datetime.utcnow()
            elif status == OrderStatus.DELIVERED:
                order.delivered_at = datetime.utcnow()
            db.commit()
            db.refresh(order)
        return order

    @staticmethod
    def add_item_to_order(db: Session, order_id: int, product_id: int, quantity: int, unit_price: float) -> OrderItem:
        """Add item to order"""
        total_price = quantity * unit_price
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def cancel_order(db: Session, order_id: int) -> Order:
        """Cancel an order"""
        return OrderCRUD.update_order_status(db, order_id, OrderStatus.CANCELLED)

    @staticmethod
    def get_order_items(db: Session, order_id: int) -> list:
        """Get all items in an order"""
        return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
