"""Shopping Mall API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.shopping import ShoppingCRUD
from pydantic import BaseModel

router = APIRouter(prefix="/api/shopping", tags=["shopping"])

class CategoryCreate(BaseModel):
    name: str
    description: str = ""

class ProductCreate(BaseModel):
    sku: str
    name: str
    price: float
    category_id: int = None
    description: str = ""

@router.post("/categories/")
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    category = ShoppingCRUD.create_category(db, data.name, description=data.description)
    return category

@router.get("/categories/")
def list_categories(db: Session = Depends(get_db)):
    categories = ShoppingCRUD.list_categories(db)
    return categories

@router.get("/categories/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = ShoppingCRUD.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("/products/")
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = ShoppingCRUD.create_product(db, data.sku, data.name, data.price, category_id=data.category_id, description=data.description)
    return product

@router.get("/products/")
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = ShoppingCRUD.list_products(db, skip=skip, limit=limit)
    return products

@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = ShoppingCRUD.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/products/category/{category_id}")
def list_by_category(category_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = ShoppingCRUD.list_by_category(db, category_id, skip=skip, limit=limit)
    return products

@router.get("/featured/")
def list_featured(limit: int = 10, db: Session = Depends(get_db)):
    products = ShoppingCRUD.list_featured(db, limit=limit)
    return products
