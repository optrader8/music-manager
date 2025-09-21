from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Track, User, UserRole
from app.main import app


@pytest.fixture()
def playlist_client() -> Generator[tuple[TestClient, sessionmaker, User], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    with SessionLocal() as session:
        user = User(email="owner@example.com", hashed_password="hashed", role=UserRole.ADMIN)
        session.add(user)
        session.commit()
        session.refresh(user)
        owner = user

    from app.core.dependencies import get_current_active_user, get_db

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def override_get_current_user():
        return owner

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_user

    with TestClient(app) as client:
        yield client, SessionLocal, owner

    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def seed_tracks(session_factory: sessionmaker) -> list[int]:
    with session_factory() as session:
        titles = ["Alpha", "Beta", "Gamma"]
        track_ids: list[int] = []
        for title in titles:
            track = Track(title=title, file_path=f"/music/{title}.mp3", file_hash=f"hash-{title}")
            session.add(track)
            session.flush()
            track_ids.append(track.id)
        session.commit()
        return track_ids


def test_playlist_crud_flow(playlist_client) -> None:
    client, session_factory, _owner = playlist_client
    track_ids = seed_tracks(session_factory)

    create_response = client.post(
        "/playlists/",
        json={"name": "My Mix", "description": "Morning", "is_public": False},
    )
    assert create_response.status_code == 201
    playlist_id = create_response.json()["id"]

    add_response = client.post(
        f"/playlists/{playlist_id}/tracks",
        json={"track_id": track_ids[0]},
    )
    assert add_response.status_code == 200

    reorder_response = client.patch(
        f"/playlists/{playlist_id}/tracks/{track_ids[0]}",
        json={"position": 1},
    )
    assert reorder_response.status_code == 200

    list_response = client.get("/playlists/")
    assert list_response.status_code == 200
    assert list_response.json()[0]["name"] == "My Mix"

    delete_response = client.delete(f"/playlists/{playlist_id}")
    assert delete_response.status_code == 204


def test_smart_playlist_details(playlist_client) -> None:
    client, session_factory, _owner = playlist_client
    track_ids = seed_tracks(session_factory)

    smart_response = client.post(
        "/playlists/",
        json={
            "name": "Smart",
            "is_public": True,
            "is_smart": True,
            "smart_filter": {"search": "a"},
        },
    )
    assert smart_response.status_code == 201
    playlist_id = smart_response.json()["id"]

    detail_response = client.get(f"/playlists/{playlist_id}")
    assert detail_response.status_code == 200
    payload = detail_response.json()
    assert payload["is_smart"] is True
    assert payload["track_count"] >= 1

    # Removing tracks from smart playlists should fail
    delete_track = client.delete(f"/playlists/{playlist_id}/tracks/{track_ids[0]}")
    assert delete_track.status_code == 400
    assert "smart" in delete_track.json()["detail"].lower()
