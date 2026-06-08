"""Tests for the feedback feature (Track 4).

Covers: submit success (201), submit without auth (401), submit bad rating (422),
and that GET /feedback returns only the authenticated user's own feedback.
"""
import os
import sys

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Make `src` importable when running from the sample-app directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src import database  # noqa: E402
from src.auth import ALGORITHM, SECRET  # noqa: E402


@pytest.fixture()
def client():
    """TestClient backed by an isolated in-memory SQLite database."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )

    # Point the app's Base/engine at the in-memory db and create tables.
    database.engine = test_engine
    database.SessionLocal = TestingSessionLocal
    from src.database import Base
    from src import models  # noqa: F401

    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    from src.main import app

    app.dependency_overrides[database.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_token(user_id: int) -> str:
    return jwt.encode({"sub": str(user_id)}, SECRET, algorithm=ALGORITHM)


def auth_header(user_id: int) -> dict:
    return {"Authorization": f"Bearer {make_token(user_id)}"}


def test_submit_feedback_success(client):
    resp = client.post(
        "/feedback",
        json={"content": "Great service", "rating": 5},
        headers=auth_header(42),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] > 0
    assert body["user_id"] == 42  # taken from JWT, not the body
    assert body["content"] == "Great service"
    assert body["rating"] == 5
    assert body["status"] == "submitted"


def test_submit_feedback_uses_jwt_user_not_body(client):
    # Even if a user_id is supplied in the body, it must be ignored.
    resp = client.post(
        "/feedback",
        json={"content": "Hi", "rating": 3, "user_id": 999},
        headers=auth_header(7),
    )
    assert resp.status_code == 201
    assert resp.json()["user_id"] == 7


def test_submit_feedback_no_auth_401(client):
    resp = client.post("/feedback", json={"content": "No token", "rating": 4})
    assert resp.status_code == 401


def test_submit_feedback_bad_rating_422(client):
    too_high = client.post(
        "/feedback",
        json={"content": "x", "rating": 6},
        headers=auth_header(1),
    )
    assert too_high.status_code == 422

    too_low = client.post(
        "/feedback",
        json={"content": "x", "rating": 0},
        headers=auth_header(1),
    )
    assert too_low.status_code == 422


def test_submit_feedback_blank_content_422(client):
    resp = client.post(
        "/feedback",
        json={"content": "   ", "rating": 3},
        headers=auth_header(1),
    )
    assert resp.status_code == 422


def test_list_returns_only_own_feedback(client):
    # User 100 submits two, user 200 submits one.
    client.post("/feedback", json={"content": "a", "rating": 5}, headers=auth_header(100))
    client.post("/feedback", json={"content": "b", "rating": 4}, headers=auth_header(100))
    client.post("/feedback", json={"content": "c", "rating": 3}, headers=auth_header(200))

    resp = client.get("/feedback", headers=auth_header(100))
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2
    assert {i["content"] for i in items} == {"a", "b"}
    assert all(i["user_id"] == 100 for i in items)


def test_list_empty_returns_empty_array(client):
    resp = client.get("/feedback", headers=auth_header(555))
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_no_auth_401(client):
    resp = client.get("/feedback")
    assert resp.status_code == 401
