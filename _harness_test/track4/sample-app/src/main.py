"""Application entry point — Track 4 harness test.

Feedback feature wired in per approved spec (POST /feedback, GET /feedback only).
No health-check, admin, edit/delete, statistics, or external-integration routes.
"""
from fastapi import FastAPI

from src.database import Base, engine
from src import models  # noqa: F401  (register Feedback model with Base metadata)
from src.routes import router as feedback_router

# Create tables for the feedback domain (single `feedback` table).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Track4 Sample App")

app.include_router(feedback_router)


@app.get("/")
def root():
    return {"app": "track4-sample", "status": "baseline"}
