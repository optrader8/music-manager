from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.models.user import User, UserRole
from app.main import app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    from app.core.dependencies import get_db

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    app.state._test_session_local = TestingSessionLocal

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    if hasattr(app.state, "_test_session_local"):
        del app.state._test_session_local


def _get_session(client: TestClient):
    session_factory = getattr(client.app.state, "_test_session_local")
    return session_factory()


def test_register_user_creates_account(client: TestClient) -> None:
    payload = {
        "email": "listener@example.com",
        "display_name": "Listener",
        "password": "StrongPass123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["display_name"] == payload["display_name"]
    assert data["role"] == UserRole.LISTENER.value

    with _get_session(client) as db:
        user = db.query(User).filter(User.email == payload["email"]).one()
        assert user.hashed_password != payload["password"]


def test_register_duplicate_email_returns_400(client: TestClient) -> None:
    payload = {
        "email": "dup@example.com",
        "display_name": "Dup",
        "password": "StrongPass123",
    }
    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 400
    assert "User already exists" in response.json()["detail"]


def test_login_returns_tokens_and_allows_profile_access(client: TestClient) -> None:
    payload = {
        "email": "user@example.com",
        "display_name": "User",
        "password": "StrongPass123",
    }
    client.post("/auth/register", json=payload)

    response = client.post("/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert response.status_code == 200
    tokens = response.json()
    assert set(tokens.keys()) == {"access_token", "refresh_token", "token_type"}

    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    me_response = client.get("/users/me", headers=headers)

    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == payload["email"]


def test_login_with_invalid_password_fails(client: TestClient) -> None:
    payload = {
        "email": "wrongpass@example.com",
        "display_name": "User",
        "password": "StrongPass123",
    }
    client.post("/auth/register", json=payload)

    response = client.post(
        "/auth/login",
        json={"email": payload["email"], "password": "NotThePassword"},
    )

    assert response.status_code == 401


def test_role_based_access_requires_admin(client: TestClient) -> None:
    payload = {
        "email": "admin@example.com",
        "display_name": "Admin",
        "password": "StrongPass123",
    }
    client.post("/auth/register", json=payload)
    login_response = client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # non-admin should receive 403
    forbidden = client.get("/users/admin/ping", headers=headers)
    assert forbidden.status_code == 403

    # elevate role to admin and retry
    with _get_session(client) as db:
        user = db.query(User).filter(User.email == payload["email"]).one()
        user.role = UserRole.ADMIN
        db.commit()

    allowed = client.get("/users/admin/ping", headers=headers)
    assert allowed.status_code == 200
    assert "admin access granted" in allowed.json()["message"]
