"""Inventory Management CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.inventory import InventoryItem, InventoryTransaction, InventoryStatus, TransactionType


class InventoryCRUD:
    @staticmethod
    def create_inventory_item(db: Session, product_id: int, quantity_available: int = 0, **kwargs) -> InventoryItem:
        item = InventoryItem(product_id=product_id, quantity_available=quantity_available, **kwargs)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_inventory_item(db: Session, item_id: int) -> InventoryItem:
        return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

    @staticmethod
    def get_by_product_id(db: Session, product_id: int) -> InventoryItem:
        return db.query(InventoryItem).filter(InventoryItem.product_id == product_id).first()

    @staticmethod
    def update_quantity(db: Session, item_id: int, quantity_change: int, transaction_type: TransactionType) -> InventoryItem:
        item = InventoryCRUD.get_inventory_item(db, item_id)
        if item:
            item.quantity_available += quantity_change
            if item.quantity_available <= 0:
                item.status = InventoryStatus.OUT_OF_STOCK
            elif item.quantity_available <= item.minimum_level:
                item.status = InventoryStatus.LOW_STOCK
            else:
                item.status = InventoryStatus.IN_STOCK

            transaction = InventoryTransaction(
                inventory_item_id=item_id,
                transaction_type=transaction_type.value,
                quantity_change=quantity_change
            )
            db.add(transaction)
            db.commit()
            db.refresh(item)
        return item

    @staticmethod
    def reserve_inventory(db: Session, item_id: int, quantity: int) -> bool:
        item = InventoryCRUD.get_inventory_item(db, item_id)
        if item and item.quantity_usable >= quantity:
            item.quantity_reserved += quantity
            db.commit()
            return True
        return False

    @staticmethod
    def release_inventory(db: Session, item_id: int, quantity: int) -> bool:
        item = InventoryCRUD.get_inventory_item(db, item_id)
        if item and item.quantity_reserved >= quantity:
            item.quantity_reserved -= quantity
            db.commit()
            return True
        return False
