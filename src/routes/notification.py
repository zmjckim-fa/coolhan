"""Notification System API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.notification import NotificationCRUD
from pydantic import BaseModel

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationCreate(BaseModel):
    user_id: int
    notification_type: str
    recipient: str
    message: str
    subject: str = ""

@router.post("/")
def send_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    notification = NotificationCRUD.create_notification(
        db, data.user_id, data.notification_type, data.recipient, data.message, subject=data.subject
    )
    return notification

@router.get("/{notification_id}")
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = NotificationCRUD.get_notification(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.get("/user/{user_id}")
def list_user_notifications(user_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    notifications = NotificationCRUD.list_by_user(db, user_id, skip=skip, limit=limit)
    return notifications

@router.post("/{notification_id}/sent")
def mark_sent(notification_id: int, db: Session = Depends(get_db)):
    notification = NotificationCRUD.mark_as_sent(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.post("/{notification_id}/failed")
def mark_failed(notification_id: int, reason: str = "", db: Session = Depends(get_db)):
    notification = NotificationCRUD.mark_as_failed(db, notification_id, reason)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.get("/pending/list")
def list_pending(db: Session = Depends(get_db)):
    notifications = NotificationCRUD.list_pending(db)
    return notifications
