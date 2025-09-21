from __future__ import annotations

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.models import Album, Artist, Track
from app.services.library_service import LibraryService, SearchFilters


@pytest.fixture()
def session_with_fts() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
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
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        with engine.begin() as connection:
            connection.execute(text("DROP TABLE IF EXISTS track_search"))
        Base.metadata.drop_all(engine)


def seed_library(session: Session) -> None:
    daft_punk = Artist(name="Daft Punk")
    french_house = Album(title="Discovery", artist=daft_punk, genre="Electronic")

    digital_love = Track(
        title="Digital Love",
        artist=daft_punk,
        album=french_house,
        genre="Electronic",
        file_path="/music/daft_punk/digital_love.mp3",
        file_hash="hash-digital",
    )

    around_the_world = Track(
        title="Around the World",
        artist=daft_punk,
        album=french_house,
        genre="Electronic",
        file_path="/music/daft_punk/around_the_world.mp3",
        file_hash="hash-around",
    )

    collette = Artist(name="Collette")
    cosmic_album = Album(title="Cosmic", artist=collette, genre="Pop")
    another_world = Track(
        title="Another World",
        artist=collette,
        album=cosmic_album,
        genre="Pop",
        file_path="/music/collette/another_world.mp3",
        file_hash="hash-another",
    )

    session.add_all([digital_love, around_the_world, another_world])
    session.commit()


def test_search_tracks_returns_ranked_results(session_with_fts: Session) -> None:
    seed_library(session_with_fts)
    service = LibraryService(session_with_fts)

    results, scores, total = service.search_tracks(query="world", page=1, page_size=5)

    assert total == 2
    titles = [track.title for track in results]
    assert titles[0] == "Around the World"
    assert titles[1] == "Another World"
    assert all(0.0 <= score <= 1.0 for score in scores.values())


def test_search_tracks_supports_filters(session_with_fts: Session) -> None:
    seed_library(session_with_fts)
    service = LibraryService(session_with_fts)

    daft_punk = session_with_fts.query(Artist).filter(Artist.name == "Daft Punk").one()
    daft_punk_id = daft_punk.id
    results, _, total = service.search_tracks(
        query="world",
        page=1,
        page_size=5,
        filters=SearchFilters(artist_id=daft_punk_id),
    )

    assert total == 1
    assert results[0].title == "Around the World"


def test_browse_tracks_orders_by_title(session_with_fts: Session) -> None:
    seed_library(session_with_fts)
    service = LibraryService(session_with_fts)

    tracks, total = service.browse_tracks(page=1, page_size=10, sort="title")
    assert total == 3
    titles = [track.title for track in tracks]
    assert titles == sorted(titles)


def test_empty_search_raises_value_error(session_with_fts: Session) -> None:
    service = LibraryService(session_with_fts)

    with pytest.raises(ValueError):
        service.search_tracks(query="   ", page=1, page_size=10)
