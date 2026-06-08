from fastapi import APIRouter

router = APIRouter(prefix="/api/members", tags=["member"])


@router.post("/signup")
def signup(email: str, password: str):
    """회원 가입."""
    return {"id": 1, "email": email}


@router.post("/login")
def login(email: str, password: str):
    """로그인 — 세션 토큰 발급."""
    return {"token": "demo-token"}


@router.get("/me")
def me():
    """현재 회원 프로필 조회 (인증 필요)."""
    return {"id": 1, "email": "demo@shop.a", "role": "member"}
