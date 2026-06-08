"""GDPR & Privacy CRUD Operations"""
from sqlalchemy.orm import Session
from src.models.gdpr import DataSubject, ConsentLog
from datetime import datetime, timezone


class GDPRCRUDsys:
    @staticmethod
    def create_data_subject(db: Session, user_id: int, **kwargs) -> DataSubject:
        subject = DataSubject(user_id=user_id, **kwargs)
        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject

    @staticmethod
    def get_data_subject(db: Session, user_id: int) -> DataSubject:
        return db.query(DataSubject).filter(DataSubject.user_id == user_id).first()

    @staticmethod
    def request_deletion(db: Session, user_id: int) -> DataSubject:
        subject = GDPRCRUDsys.get_data_subject(db, user_id)
        if subject:
            subject.deletion_requested = True
            subject.deletion_requested_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(subject)
        return subject

    @staticmethod
    def request_data_export(db: Session, user_id: int) -> DataSubject:
        subject = GDPRCRUDsys.get_data_subject(db, user_id)
        if subject:
            subject.data_export_requested = True
            subject.data_export_requested_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(subject)
        return subject

    @staticmethod
    def update_consent(db: Session, user_id: int, **kwargs) -> DataSubject:
        subject = GDPRCRUDsys.get_data_subject(db, user_id)
        if subject:
            for key, value in kwargs.items():
                if hasattr(subject, key):
                    setattr(subject, key, value)
            db.commit()
            db.refresh(subject)
        return subject

    @staticmethod
    def create_consent_log(db: Session, user_id: int, consent_type: str, given: bool, **kwargs) -> ConsentLog:
        log = ConsentLog(user_id=user_id, consent_type=consent_type, given=given, **kwargs)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_consent_history(db: Session, user_id: int, consent_type: str = None) -> list:
        query = db.query(ConsentLog).filter(ConsentLog.user_id == user_id)
        if consent_type:
            query = query.filter(ConsentLog.consent_type == consent_type)
        return query.order_by(ConsentLog.created_at.desc()).all()

    @staticmethod
    def list_deletion_requests(db: Session) -> list:
        return db.query(DataSubject).filter(DataSubject.deletion_requested == True).all()
