from __future__ import annotations

from collections.abc import Generator
import pytest

from app.db.base import Base
from app.db.models import Track
from app.schemas import TrackMetadataUpdate
from app.services.metadata_service import MetadataService
from app.services.musicbrainz_client import MusicBrainzRecording


@pytest.fixture()
def session(tmp_path) -> Generator:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


class StubMusicBrainzClient:
    def __init__(self, responses: list[MusicBrainzRecording] | None = None):
        self.responses = responses or []
        self.calls: list[dict] = []

    def search_recordings(self, *, title: str, artist: str | None, limit: int) -> list[MusicBrainzRecording]:
        self.calls.append({"title": title, "artist": artist, "limit": limit})
        return self.responses


def create_track(session, *, title: str, artist_name: str | None = None) -> Track:
    from app.db.models import Artist

    artist = None
    if artist_name:
        artist = Artist(name=artist_name)
        session.add(artist)
        session.flush()

    track = Track(
        title=title,
        file_path=f"/music/{title}.mp3",
        file_hash=f"hash-{title}",
        artist=artist,
    )
    session.add(track)
    session.commit()
    session.refresh(track)
    return track


def test_update_track_metadata_creates_artist_and_album(session) -> None:
    track = create_track(session, title="Unknown Track")
    service = MetadataService(session, musicbrainz_client=StubMusicBrainzClient())

    update = TrackMetadataUpdate(
        title="New Title",
        artist_name="New Artist",
        album_title="New Album",
        genre="Electronic",
        release_year=2024,
        track_number=2,
    )

    updated = service.update_track_metadata(track.id, update)

    assert updated.title == "New Title"
    assert updated.artist is not None and updated.artist.name == "New Artist"
    assert updated.album is not None and updated.album.title == "New Album"
    assert updated.album.release_year == 2024
    assert updated.genre == "Electronic"
    assert updated.track_number == 2


def test_batch_update_tracks_applies_updates(session) -> None:
    track1 = create_track(session, title="Track1", artist_name="Artist")
    track2 = create_track(session, title="Track2", artist_name="Artist")
    service = MetadataService(session, musicbrainz_client=StubMusicBrainzClient())

    update = TrackMetadataUpdate(genre="Ambient")
    updated_tracks = service.batch_update_tracks([track1.id, track2.id], update)

    assert len(updated_tracks) == 2
    assert {track.genre for track in updated_tracks} == {"Ambient"}


def test_suggest_metadata_returns_suggestions(session) -> None:
    track = create_track(session, title="Voyage", artist_name="Daft Punk")

    suggestions = [
        MusicBrainzRecording(
            title="Voyage",
            artist_name="Daft Punk",
            album_title="Discovery",
            release_year=2001,
            score=95.0,
        )
    ]
    stub_client = StubMusicBrainzClient(responses=suggestions)
    service = MetadataService(session, musicbrainz_client=stub_client)

    results = service.suggest_metadata(track.id, limit=3)

    assert len(results) == 1
    assert results[0].album_title == "Discovery"
    assert stub_client.calls[0] == {
        "title": "Voyage",
        "artist": "Daft Punk",
        "limit": 3,
    }
