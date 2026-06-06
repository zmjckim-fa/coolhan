"""Review & Rating API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.review import ReviewCRUD
from pydantic import BaseModel

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

class ReviewCreate(BaseModel):
    product_id: int
    user_id: int
    title: str
    content: str

class RatingCreate(BaseModel):
    product_id: int
    user_id: int
    score: int

@router.post("/")
def create_review(data: ReviewCreate, db: Session = Depends(get_db)):
    review = ReviewCRUD.create_review(db, data.product_id, data.user_id, data.title, data.content)
    return review

@router.get("/{review_id}")
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = ReviewCRUD.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.get("/product/{product_id}")
def list_product_reviews(product_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    reviews = ReviewCRUD.list_product_reviews(db, product_id, skip=skip, limit=limit)
    return reviews

@router.get("/user/{user_id}")
def list_user_reviews(user_id: int, db: Session = Depends(get_db)):
    reviews = ReviewCRUD.list_user_reviews(db, user_id)
    return reviews

@router.post("/ratings/")
def create_rating(data: RatingCreate, db: Session = Depends(get_db)):
    rating = ReviewCRUD.create_rating(db, data.product_id, data.user_id, data.score)
    return rating

@router.get("/product/{product_id}/rating")
def get_product_rating(product_id: int, db: Session = Depends(get_db)):
    rating = ReviewCRUD.get_product_rating(db, product_id)
    return rating
