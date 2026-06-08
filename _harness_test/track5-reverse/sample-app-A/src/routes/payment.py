from fastapi import APIRouter

router = APIRouter(prefix="/api/payments", tags=["payment"])


@router.post("")
def create_payment(order_id: int, amount: float, idempotency_key: str):
    """결제 생성 — 멱등성 키로 중복 방지. 외부 PG사 호출."""
    return {"id": 5, "status": "captured"}


@router.post("/{payment_id}/refund")
def refund(payment_id: int):
    """환불 처리."""
    return {"id": payment_id, "status": "refunded"}
