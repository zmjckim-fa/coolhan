"""
Order Management API Routes
Order creation and management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.order import OrderCRUD
from src.models.order import OrderStatus
from pydantic import BaseModel
from typing import List


router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderCreate(BaseModel):
    user_id: int
    order_number: str
    total_amount: float
    items: List[OrderItemCreate] = []


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: int
    status: str
    total_amount: float
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order"""
    order = OrderCRUD.create_order(
        db,
        user_id=order_data.user_id,
        order_number=order_data.order_number,
        total_amount=order_data.total_amount,
    )

    # Add items to order
    for item in order_data.items:
        OrderCRUD.add_item_to_order(
            db,
            order.id,
            item.product_id,
            item.quantity,
            item.unit_price,
        )

    return order


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order by ID"""
    order = OrderCRUD.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/user/{user_id}")
def list_user_orders(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List orders for a user"""
    orders = OrderCRUD.list_orders_by_user(db, user_id, skip=skip, limit=limit)
    return orders


@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    """Update order status"""
    try:
        status_enum = OrderStatus[status.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    order = OrderCRUD.update_order_status(db, order_id, status_enum)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/cancel")
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    """Cancel an order"""
    order = OrderCRUD.cancel_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
