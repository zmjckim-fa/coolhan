"""Inventory Management API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.inventory import InventoryCRUD
from pydantic import BaseModel

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

class InventoryItemCreate(BaseModel):
    product_id: int
    quantity_available: int = 0
    minimum_level: int = 10

@router.post("/items/")
def create_inventory_item(data: InventoryItemCreate, db: Session = Depends(get_db)):
    item = InventoryCRUD.create_inventory_item(db, data.product_id, data.quantity_available, minimum_level=data.minimum_level)
    return item

@router.get("/items/{item_id}")
def get_inventory(item_id: int, db: Session = Depends(get_db)):
    item = InventoryCRUD.get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.get("/product/{product_id}")
def get_by_product(product_id: int, db: Session = Depends(get_db)):
    item = InventoryCRUD.get_by_product_id(db, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory not found for product")
    return item

@router.post("/{item_id}/reserve")
def reserve(item_id: int, quantity: int, db: Session = Depends(get_db)):
    success = InventoryCRUD.reserve_inventory(db, item_id, quantity)
    if not success:
        raise HTTPException(status_code=400, detail="Insufficient inventory")
    return {"message": "Reserved"}

@router.post("/{item_id}/release")
def release(item_id: int, quantity: int, db: Session = Depends(get_db)):
    success = InventoryCRUD.release_inventory(db, item_id, quantity)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid release")
    return {"message": "Released"}
