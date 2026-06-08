"""API routes — feedback domain (Track 4). Spec section 3.

Exactly two endpoints: POST /feedback and GET /feedback. Nothing else.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.auth import get_current_user_id
from src.database import get_db
from src.models import Feedback
from src.schemas import FeedbackCreate, FeedbackOut

router = APIRouter()


@router.post("/feedback", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: FeedbackCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Feedback:
    """Submit feedback. user_id is taken from the JWT, never the request body."""
    feedback = Feedback(
        user_id=user_id,
        content=payload.content,
        rating=payload.rating,
        status="submitted",
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/feedback", response_model=List[FeedbackOut])
def list_my_feedback(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> List[Feedback]:
    """List only the authenticated user's feedback (ownership isolation, spec 5)."""
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == user_id)
        .order_by(Feedback.id)
        .all()
    )
