"""Shopping Mall CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.shopping import Product, Category


class ShoppingCRUD:
    @staticmethod
    def create_category(db: Session, name: str, **kwargs) -> Category:
        category = Category(name=name, **kwargs)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def get_category(db: Session, category_id: int) -> Category:
        return db.query(Category).filter(Category.id == category_id).first()

    @staticmethod
    def list_categories(db: Session) -> list:
        return db.query(Category).filter(Category.is_active == True).all()

    @staticmethod
    def create_product(db: Session, sku: str, name: str, price: float, **kwargs) -> Product:
        product = Product(sku=sku, name=name, price=price, **kwargs)
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def get_product(db: Session, product_id: int) -> Product:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_by_sku(db: Session, sku: str) -> Product:
        return db.query(Product).filter(Product.sku == sku).first()

    @staticmethod
    def list_products(db: Session, skip: int = 0, limit: int = 100) -> list:
        return db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()

    @staticmethod
    def list_by_category(db: Session, category_id: int, skip: int = 0, limit: int = 100) -> list:
        return db.query(Product).filter(Product.category_id == category_id, Product.is_active == True).offset(skip).limit(limit).all()

    @staticmethod
    def list_featured(db: Session, limit: int = 10) -> list:
        return db.query(Product).filter(Product.is_featured == True, Product.is_active == True).limit(limit).all()

    @staticmethod
    def update_product(db: Session, product_id: int, **kwargs) -> Product:
        product = ShoppingCRUD.get_product(db, product_id)
        if product:
            for key, value in kwargs.items():
                if hasattr(product, key):
                    setattr(product, key, value)
            db.commit()
            db.refresh(product)
        return product
