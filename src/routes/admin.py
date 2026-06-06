"""Admin System API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.admin import AdminCRUD
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AdminLogCreate(BaseModel):
    admin_user_id: int
    action: str
    resource_type: str = None
    resource_id: int = None
    changes: str = None

@router.post("/logs/")
def create_log(data: AdminLogCreate, db: Session = Depends(get_db)):
    log = AdminCRUD.create_log(
        db,
        admin_user_id=data.admin_user_id,
        action=data.action,
        resource_type=data.resource_type,
        resource_id=data.resource_id,
        changes=data.changes
    )
    return log

@router.get("/logs/{log_id}")
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = AdminCRUD.get_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@router.get("/logs/admin/{admin_user_id}")
def list_admin_logs(admin_user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = AdminCRUD.list_logs_by_admin(db, admin_user_id, skip=skip, limit=limit)
    return logs

@router.get("/logs/resource/{resource_type}/{resource_id}")
def list_resource_logs(resource_type: str, resource_id: int, db: Session = Depends(get_db)):
    logs = AdminCRUD.list_logs_by_resource(db, resource_type, resource_id)
    return logs

@router.get("/logs/")
def list_all_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = AdminCRUD.list_all_logs(db, skip=skip, limit=limit)
    return logs

@router.post("/logs/user-action/")
def log_user_action(admin_user_id: int, target_user_id: int, action: str, db: Session = Depends(get_db)):
    log = AdminCRUD.log_user_action(db, admin_user_id, target_user_id, action)
    return log
