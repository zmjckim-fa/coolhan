from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, unique=True, nullable=False)
    on_hand = Column(Integer, default=0)
    reserved = Column(Integer, default=0)
