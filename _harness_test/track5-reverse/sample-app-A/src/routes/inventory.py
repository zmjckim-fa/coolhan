from fastapi import APIRouter

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/{product_id}")
def get_stock(product_id: int):
    """재고 조회."""
    return {"product_id": product_id, "on_hand": 100, "reserved": 5}


@router.post("/{product_id}/reserve")
def reserve_stock(product_id: int, quantity: int):
    """재고 예약 — 주문 생성 시 호출."""
    return {"product_id": product_id, "reserved": quantity}
