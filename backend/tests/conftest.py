from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Album, Artist, Playlist, PlaylistTrack, Track, User


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    Base.metadata.drop_all(engine)


__all__ = [
    "Album",
    "Artist",
    "Playlist",
    "PlaylistTrack",
    "Track",
    "User",
]
