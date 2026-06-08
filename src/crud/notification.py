"""Notification System CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.notification import Notification, NotificationStatus
from datetime import datetime, timezone


class NotificationCRUD:
    @staticmethod
    def create_notification(db: Session, user_id: int, notification_type: str, recipient: str, message: str, **kwargs) -> Notification:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            recipient=recipient,
            message=message,
            **kwargs
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def get_notification(db: Session, notification_id: int) -> Notification:
        return db.query(Notification).filter(Notification.id == notification_id).first()

    @staticmethod
    def list_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list:
        return db.query(Notification).filter(Notification.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def mark_as_sent(db: Session, notification_id: int) -> Notification:
        notification = NotificationCRUD.get_notification(db, notification_id)
        if notification:
            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def mark_as_failed(db: Session, notification_id: int, failure_reason: str = None) -> Notification:
        notification = NotificationCRUD.get_notification(db, notification_id)
        if notification:
            notification.status = NotificationStatus.FAILED
            notification.failed_at = datetime.now(timezone.utc)
            notification.failure_reason = failure_reason
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def list_pending(db: Session) -> list:
        return db.query(Notification).filter(Notification.status == NotificationStatus.PENDING).all()
