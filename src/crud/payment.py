"""
Payment System CRUD Operations
Payment processing and tracking operations
"""

from sqlalchemy.orm import Session
from src.models.payment import Payment, PaymentStatus
from datetime import datetime


class PaymentCRUD:
    """CRUD operations for payment system"""

    @staticmethod
    def create_payment(db: Session, order_id: int, amount: float, method: str, idempotency_key: str, **kwargs) -> Payment:
        """Create a new payment"""
        # Check if payment with same idempotency key already exists
        existing = db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()
        if existing:
            return existing

        payment = Payment(
            order_id=order_id,
            amount=amount,
            method=method,
            idempotency_key=idempotency_key,
            **kwargs
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def get_payment_by_id(db: Session, payment_id: int) -> Payment:
        """Get payment by ID"""
        return db.query(Payment).filter(Payment.id == payment_id).first()

    @staticmethod
    def get_payment_by_transaction_id(db: Session, transaction_id: str) -> Payment:
        """Get payment by transaction ID"""
        return db.query(Payment).filter(Payment.transaction_id == transaction_id).first()

    @staticmethod
    def get_payment_by_idempotency_key(db: Session, idempotency_key: str) -> Payment:
        """Get payment by idempotency key"""
        return db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()

    @staticmethod
    def list_payments_by_order(db: Session, order_id: int) -> list:
        """Get all payments for an order"""
        return db.query(Payment).filter(Payment.order_id == order_id).all()

    @staticmethod
    def update_payment_status(db: Session, payment_id: int, status: PaymentStatus, **kwargs) -> Payment:
        """Update payment status"""
        payment = PaymentCRUD.get_payment_by_id(db, payment_id)
        if payment:
            payment.status = status
            for key, value in kwargs.items():
                if hasattr(payment, key):
                    setattr(payment, key, value)
            if status == PaymentStatus.COMPLETED:
                payment.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(payment)
        return payment

    @staticmethod
    def mark_payment_completed(db: Session, payment_id: int, transaction_id: str = None) -> Payment:
        """Mark payment as completed"""
        return PaymentCRUD.update_payment_status(db, payment_id, PaymentStatus.COMPLETED, transaction_id=transaction_id)

    @staticmethod
    def mark_payment_failed(db: Session, payment_id: int, error_message: str = None) -> Payment:
        """Mark payment as failed"""
        return PaymentCRUD.update_payment_status(db, payment_id, PaymentStatus.FAILED, error_message=error_message)
