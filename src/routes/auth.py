"""
Auth API Routes
Login, logout, token refresh, and current user
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.member import MemberCRUD
from src.auth import verify_password, create_access_token, get_current_user, hash_password
from src.models.member import User, Role
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user and return access token"""
    if MemberCRUD.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if MemberCRUD.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = MemberCRUD.create_user(
        db,
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
    )

    # Assign default user role
    user_role = db.query(Role).filter_by(name="user").first()
    if user_role:
        MemberCRUD.assign_role_to_user(db, user.id, user_role.id)

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token, user_id=user.id, username=user.username)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with username/password, return JWT token"""
    user = MemberCRUD.get_user_by_username(db, form_data.username)
    if not user:
        user = MemberCRUD.get_user_by_email(db, form_data.username)

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    # Update last login
    MemberCRUD.update_user(db, user.id, last_login=datetime.now(timezone.utc))

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token, user_id=user.id, username=user.username)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "status": current_user.status,
        "roles": [role.name for role in current_user.roles],
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout (client discards token)"""
    return {"message": f"User '{current_user.username}' logged out successfully"}
