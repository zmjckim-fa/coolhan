"""Sample App A — mini shopping mall (Python/FastAPI).

역방향 하네스 검증용 분석 대상. 회원/주문/결제/재고 4개 도메인.
"""
from fastapi import FastAPI

from src.routes import member, order, payment, inventory

app = FastAPI(title="Sample Shop A")

app.include_router(member.router)
app.include_router(order.router)
app.include_router(payment.router)
app.include_router(inventory.router)


@app.get("/")
def root():
    return {"app": "Sample Shop A", "version": "1.0.0"}
