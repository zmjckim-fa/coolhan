"""Review & Rating CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.review import Review, Rating


class ReviewCRUD:
    @staticmethod
    def create_review(db: Session, product_id: int, user_id: int, title: str, content: str, **kwargs) -> Review:
        review = Review(product_id=product_id, user_id=user_id, title=title, content=content, **kwargs)
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def get_review(db: Session, review_id: int) -> Review:
        return db.query(Review).filter(Review.id == review_id).first()

    @staticmethod
    def list_product_reviews(db: Session, product_id: int, skip: int = 0, limit: int = 100) -> list:
        return db.query(Review).filter(Review.product_id == product_id, Review.status == "approved").offset(skip).limit(limit).all()

    @staticmethod
    def list_user_reviews(db: Session, user_id: int) -> list:
        return db.query(Review).filter(Review.user_id == user_id).all()

    @staticmethod
    def approve_review(db: Session, review_id: int) -> Review:
        review = ReviewCRUD.get_review(db, review_id)
        if review:
            review.status = "approved"
            db.commit()
            db.refresh(review)
        return review

    @staticmethod
    def create_rating(db: Session, product_id: int, user_id: int, score: int, **kwargs) -> Rating:
        rating = Rating(product_id=product_id, user_id=user_id, score=score, **kwargs)
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating

    @staticmethod
    def get_product_rating(db: Session, product_id: int) -> dict:
        ratings = db.query(Rating).filter(Rating.product_id == product_id).all()
        if not ratings:
            return {"average": 0, "count": 0}
        avg_score = sum(r.score for r in ratings) / len(ratings)
        return {"average": round(avg_score, 2), "count": len(ratings)}
