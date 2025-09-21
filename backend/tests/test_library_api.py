from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Album, Artist, Track
from app.main import app


@pytest.fixture()
def library_client() -> Generator[tuple[TestClient, sessionmaker], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE VIRTUAL TABLE track_search USING fts5(
                    title,
                    album,
                    artist,
                    content='tracks',
                    content_rowid='id'
                )
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TRIGGER track_ai AFTER INSERT ON tracks BEGIN
                    INSERT INTO track_search(rowid, title, album, artist)
                    VALUES (
                        new.id,
                        new.title,
                        (SELECT title FROM albums WHERE id = new.album_id),
                        (SELECT name FROM artists WHERE id = new.artist_id)
                    );
                END;
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TRIGGER track_ad AFTER DELETE ON tracks BEGIN
                    DELETE FROM track_search WHERE rowid = old.id;
                END;
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TRIGGER track_au AFTER UPDATE ON tracks BEGIN
                    UPDATE track_search
                    SET title = new.title,
                        album = (SELECT title FROM albums WHERE id = new.album_id),
                        artist = (SELECT name FROM artists WHERE id = new.artist_id)
                    WHERE rowid = new.id;
                END;
                """
            )
        )

    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    from app.core.dependencies import get_db

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client, SessionLocal

    app.dependency_overrides.clear()
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS track_search"))
    Base.metadata.drop_all(engine)


def seed_tracks(session_factory: sessionmaker) -> None:
    with session_factory() as session:
        daft_punk = Artist(name="Daft Punk")
        album = Album(title="Discovery", artist=daft_punk, genre="Electronic")
        session.add_all(
            [
                Track(
                    title="Harder Better Faster Stronger",
                    artist=daft_punk,
                    album=album,
                    genre="Electronic",
                    file_path="/music/daft/harder.mp3",
                    file_hash="hash-harder",
                ),
                Track(
                    title="Face to Face",
                    artist=daft_punk,
                    album=album,
                    genre="Electronic",
                    file_path="/music/daft/face_to_face.mp3",
                    file_hash="hash-face",
                ),
            ]
        )
        session.commit()


def test_search_endpoint_returns_results(library_client) -> None:
    client, session_factory = library_client
    seed_tracks(session_factory)

    response = client.get("/library/search", params={"q": "face", "page": 1, "page_size": 10})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["title"] == "Face to Face"
    assert "Cache-Control" in response.headers


def test_browse_endpoint_supports_sorting(library_client) -> None:
    client, session_factory = library_client
    seed_tracks(session_factory)

    response = client.get(
        "/library/tracks",
        params={"page": 1, "page_size": 10, "sort": "title"},
    )

    assert response.status_code == 200
    payload = response.json()
    titles = [item["title"] for item in payload["items"]]
    assert titles == sorted(titles)
    assert response.headers["Cache-Control"].startswith("public")
