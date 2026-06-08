"""GDPR & Privacy API Routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.crud.gdpr import GDPRCRUDsys
from pydantic import BaseModel

router = APIRouter(prefix="/api/gdpr", tags=["gdpr"])

class ConsentRequest(BaseModel):
    consent_type: str = "general"
    given: bool = True
    marketing_consent: bool = False
    analytics_consent: bool = False
    third_party_consent: bool = False

@router.get("/data-subject/{user_id}")
def get_data_subject(user_id: int, db: Session = Depends(get_db)):
    subject = GDPRCRUDsys.get_data_subject(db, user_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Data subject not found")
    return subject

@router.post("/deletion-request/{user_id}")
def request_deletion(user_id: int, db: Session = Depends(get_db)):
    subject = GDPRCRUDsys.request_deletion(db, user_id)
    return {"message": "Deletion request recorded", "user_id": user_id}

@router.post("/data-export/{user_id}")
def request_export(user_id: int, db: Session = Depends(get_db)):
    subject = GDPRCRUDsys.request_data_export(db, user_id)
    return {"message": "Export request recorded", "user_id": user_id}

@router.post("/consent/{user_id}")
def update_consent(user_id: int, data: ConsentRequest, db: Session = Depends(get_db)):
    subject = GDPRCRUDsys.create_consent_log(db, user_id, data.consent_type, data.given)
    return subject

@router.get("/consent-history/{user_id}")
def get_consent_history(user_id: int, consent_type: str = None, db: Session = Depends(get_db)):
    history = GDPRCRUDsys.get_consent_history(db, user_id, consent_type)
    return history

@router.get("/deletion-requests/")
def list_deletion_requests(db: Session = Depends(get_db)):
    requests = GDPRCRUDsys.list_deletion_requests(db)
    return requests
