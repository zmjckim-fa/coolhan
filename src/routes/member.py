"""
Member System API Routes
User account management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.member import MemberCRUD
from src.models.member import User
from pydantic import BaseModel


router = APIRouter(prefix="/api/members", tags=["members"])


class UserCreate(BaseModel):
    username: str
    email: str
    password_hash: str
    first_name: str = ""
    last_name: str = ""


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    status: str

    class Config:
        from_attributes = True


@router.post("/", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    existing = MemberCRUD.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = MemberCRUD.create_user(
        db,
        username=user_data.username,
        email=user_data.email,
        password_hash=user_data.password_hash,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = MemberCRUD.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=list[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users"""
    users = MemberCRUD.list_users(db, skip=skip, limit=limit)
    return users


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: dict, db: Session = Depends(get_db)):
    """Update user information"""
    user = MemberCRUD.update_user(db, user_id, **user_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user (soft delete)"""
    success = MemberCRUD.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
