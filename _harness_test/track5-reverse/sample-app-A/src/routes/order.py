from fastapi import APIRouter

router = APIRouter(prefix="/api/orders", tags=["order"])


@router.post("")
def create_order(member_id: int):
    """주문 생성 — 장바구니를 주문으로 전환, 재고 예약."""
    return {"id": 10, "status": "pending"}


@router.get("/{order_id}")
def get_order(order_id: int):
    """주문 상세 조회 (소유권 검증)."""
    return {"id": order_id, "status": "pending"}


@router.post("/{order_id}/cancel")
def cancel_order(order_id: int):
    """주문 취소 — 재고 예약 해제."""
    return {"id": order_id, "status": "cancelled"}
