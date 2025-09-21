from __future__ import annotations

from sqlalchemy import text

from app.core.config import settings
from app.db.base import Base
from app.db.models import *  # noqa: F401,F403  # Import models for metadata
from app.db.session import engine


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS track_search USING fts5(
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
                CREATE TRIGGER IF NOT EXISTS track_ai AFTER INSERT ON tracks BEGIN
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
                CREATE TRIGGER IF NOT EXISTS track_ad AFTER DELETE ON tracks BEGIN
                    DELETE FROM track_search WHERE rowid = old.id;
                END;
                """
            )
        )

        connection.execute(
            text(
                """
                CREATE TRIGGER IF NOT EXISTS track_au AFTER UPDATE ON tracks BEGIN
                    UPDATE track_search
                    SET title = new.title,
                        album = (SELECT title FROM albums WHERE id = new.album_id),
                        artist = (SELECT name FROM artists WHERE id = new.artist_id)
                    WHERE rowid = new.id;
                END;
                """
            )
        )


if __name__ == "__main__":
    print(f"Initializing database at {settings.database_url}")
    initialize_database()
    print("Database initialized.")
