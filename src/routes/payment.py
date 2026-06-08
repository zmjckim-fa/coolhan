"""
Payment System API Routes
Payment processing and tracking endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.payment import PaymentCRUD
from src.models.payment import PaymentStatus
from pydantic import BaseModel
from typing import Optional


router = APIRouter(prefix="/api/payments", tags=["payments"])


class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    method: str
    idempotency_key: str


def _serialize_payment(payment) -> dict:
    """Serialize payment ORM object to dict."""
    return {
        "id": payment.id,
        "order_id": payment.order_id,
        "amount": float(payment.amount),
        "method": payment.method,
        "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
        "idempotency_key": payment.idempotency_key,
        "transaction_id": payment.transaction_id,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "completed_at": payment.completed_at.isoformat() if payment.completed_at else None,
    }


@router.post("/")
def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
    """Create a new payment (idempotent)"""
    payment = PaymentCRUD.create_payment(
        db,
        order_id=payment_data.order_id,
        amount=payment_data.amount,
        method=payment_data.method,
        idempotency_key=payment_data.idempotency_key,
    )
    return _serialize_payment(payment)


@router.get("/{payment_id}")
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Get payment by ID"""
    payment = PaymentCRUD.get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _serialize_payment(payment)


@router.get("/order/{order_id}")
def list_order_payments(order_id: int, db: Session = Depends(get_db)):
    """List payments for an order"""
    payments = PaymentCRUD.list_payments_by_order(db, order_id)
    return payments


@router.post("/{payment_id}/complete")
def complete_payment(payment_id: int, transaction_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Mark payment as completed"""
    payment = PaymentCRUD.mark_payment_completed(db, payment_id, transaction_id=transaction_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _serialize_payment(payment)


@router.post("/{payment_id}/fail")
def fail_payment(payment_id: int, error_message: Optional[str] = None, db: Session = Depends(get_db)):
    """Mark payment as failed"""
    payment = PaymentCRUD.mark_payment_failed(db, payment_id, error_message=error_message)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _serialize_payment(payment)
