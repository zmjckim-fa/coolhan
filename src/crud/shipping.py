"""Shipping & Logistics CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.shipping import Shipment, ShipmentStatus
from datetime import datetime


class ShippingCRUD:
    @staticmethod
    def create_shipment(db: Session, order_id: int, tracking_number: str, **kwargs) -> Shipment:
        shipment = Shipment(order_id=order_id, tracking_number=tracking_number, **kwargs)
        db.add(shipment)
        db.commit()
        db.refresh(shipment)
        return shipment

    @staticmethod
    def get_shipment(db: Session, shipment_id: int) -> Shipment:
        return db.query(Shipment).filter(Shipment.id == shipment_id).first()

    @staticmethod
    def get_by_tracking(db: Session, tracking_number: str) -> Shipment:
        return db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()

    @staticmethod
    def get_by_order(db: Session, order_id: int) -> list:
        return db.query(Shipment).filter(Shipment.order_id == order_id).all()

    @staticmethod
    def update_status(db: Session, shipment_id: int, status: ShipmentStatus) -> Shipment:
        shipment = ShippingCRUD.get_shipment(db, shipment_id)
        if shipment:
            shipment.status = status
            if status == ShipmentStatus.SHIPPED:
                shipment.shipped_at = datetime.utcnow()
            elif status == ShipmentStatus.DELIVERED:
                shipment.delivered_at = datetime.utcnow()
            db.commit()
            db.refresh(shipment)
        return shipment

    @staticmethod
    def list_shipments(db: Session, skip: int = 0, limit: int = 100) -> list:
        return db.query(Shipment).offset(skip).limit(limit).all()
