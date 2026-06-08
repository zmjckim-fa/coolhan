"""Pydantic schemas — feedback domain (Track 4). Spec section 3."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FeedbackCreate(BaseModel):
    """Request body for POST /feedback.

    `user_id` is NOT accepted from the client — it comes from the JWT (spec 5).
    """

    content: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("content must not be blank")
        return v


class FeedbackOut(BaseModel):
    """Response body for feedback records."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    content: str
    rating: int
    status: str
    created_at: datetime
