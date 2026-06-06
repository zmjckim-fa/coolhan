"""Admin System CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.admin import AdminLog


class AdminCRUD:
    @staticmethod
    def create_log(db: Session, admin_user_id: int, action: str, **kwargs) -> AdminLog:
        log = AdminLog(admin_user_id=admin_user_id, action=action, **kwargs)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_log(db: Session, log_id: int) -> AdminLog:
        return db.query(AdminLog).filter(AdminLog.id == log_id).first()

    @staticmethod
    def list_logs_by_admin(db: Session, admin_user_id: int, skip: int = 0, limit: int = 100) -> list:
        return db.query(AdminLog).filter(AdminLog.admin_user_id == admin_user_id).order_by(AdminLog.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def list_logs_by_resource(db: Session, resource_type: str, resource_id: int) -> list:
        return db.query(AdminLog).filter(AdminLog.resource_type == resource_type, AdminLog.resource_id == resource_id).order_by(AdminLog.created_at.desc()).all()

    @staticmethod
    def list_all_logs(db: Session, skip: int = 0, limit: int = 100) -> list:
        return db.query(AdminLog).order_by(AdminLog.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def log_user_action(db: Session, admin_user_id: int, target_user_id: int, action: str, **kwargs) -> AdminLog:
        return AdminCRUD.create_log(
            db,
            admin_user_id=admin_user_id,
            action=action,
            resource_type="user",
            resource_id=target_user_id,
            **kwargs
        )
