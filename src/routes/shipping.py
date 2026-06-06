"""Shipping & Logistics API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.shipping import ShippingCRUD
from src.models.shipping import ShipmentStatus
from pydantic import BaseModel

router = APIRouter(prefix="/api/shipments", tags=["shipments"])

class ShipmentCreate(BaseModel):
    order_id: int
    tracking_number: str
    carrier: str = ""

@router.post("/")
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db)):
    shipment = ShippingCRUD.create_shipment(db, data.order_id, data.tracking_number, carrier=data.carrier)
    return shipment

@router.get("/{shipment_id}")
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    shipment = ShippingCRUD.get_shipment(db, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.get("/tracking/{tracking_number}")
def track_shipment(tracking_number: str, db: Session = Depends(get_db)):
    shipment = ShippingCRUD.get_by_tracking(db, tracking_number)
    if not shipment:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return shipment

@router.get("/order/{order_id}")
def get_order_shipments(order_id: int, db: Session = Depends(get_db)):
    shipments = ShippingCRUD.get_by_order(db, order_id)
    return shipments

@router.put("/{shipment_id}/status")
def update_status(shipment_id: int, status: str, db: Session = Depends(get_db)):
    try:
        status_enum = ShipmentStatus[status.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    shipment = ShippingCRUD.update_status(db, shipment_id, status_enum)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment
