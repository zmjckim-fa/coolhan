from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Numeric, nullable=False)
    method = Column(String, default="card")  # card | bank_transfer
    status = Column(String, default="initiated")  # initiated | captured | refunded
    idempotency_key = Column(String, unique=True, nullable=False)
