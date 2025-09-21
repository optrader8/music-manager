from __future__ import annotations

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.models import Playlist, Track, User, UserRole
from app.services.playlist_service import PlaylistService
from app.schemas import PlaylistCreate, PlaylistTrackRequest, PlaylistUpdate


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def create_user(session: Session, email: str = "user@example.com") -> User:
    user = User(email=email, hashed_password="hashed", role=UserRole.ADMIN)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_track(session: Session, title: str) -> Track:
    track = Track(title=title, file_path=f"/music/{title}.mp3", file_hash=f"hash-{title}")
    session.add(track)
    session.commit()
    session.refresh(track)
    return track


def test_create_and_list_playlist(session: Session) -> None:
    owner = create_user(session)
    other = create_user(session, email="other@example.com")
    service = PlaylistService(session)

    playlist = service.create_playlist(
        owner=owner,
        data=PlaylistCreate(name="Morning", description="Start the day", is_public=False),
    )

    mine = service.list_accessible_playlists(current_user=owner)
    assert len(mine) == 1
    assert mine[0].name == "Morning"

    public_view = service.list_accessible_playlists(current_user=other)
    assert public_view == []

    updated = service.update_playlist(
        playlist_id=playlist.id,
        owner=owner,
        data=PlaylistUpdate(is_public=True),
    )
    assert updated.is_public is True

    public_view = service.list_accessible_playlists(current_user=other)
    assert len(public_view) == 1


def test_add_remove_and_reorder_tracks(session: Session) -> None:
    owner = create_user(session)
    service = PlaylistService(session)
    playlist = service.create_playlist(owner=owner, data=PlaylistCreate(name="Mix"))

    track1 = create_track(session, "Alpha")
    track2 = create_track(session, "Beta")
    track3 = create_track(session, "Gamma")

    service.add_track_to_playlist(
        playlist_id=playlist.id,
        request=PlaylistTrackRequest(track_id=track1.id),
        owner=owner,
    )
    service.add_track_to_playlist(
        playlist_id=playlist.id,
        request=PlaylistTrackRequest(track_id=track2.id),
        owner=owner,
    )
    detail = service.add_track_to_playlist(
        playlist_id=playlist.id,
        request=PlaylistTrackRequest(track_id=track3.id, position=2),
        owner=owner,
    )

    positions = [entry.position for entry in detail.tracks]
    assert positions == [1, 2, 3]
    assert [entry.track.title for entry in detail.tracks] == ["Alpha", "Gamma", "Beta"]

    detail = service.reorder_track(
        playlist_id=playlist.id,
        track_id=track3.id,
        new_position=1,
        owner=owner,
    )
    assert [entry.track.title for entry in detail.tracks] == ["Gamma", "Alpha", "Beta"]

    detail = service.remove_track_from_playlist(
        playlist_id=playlist.id,
        track_id=track1.id,
        owner=owner,
    )
    assert [entry.track.title for entry in detail.tracks] == ["Gamma", "Beta"]
    assert [entry.position for entry in detail.tracks] == [1, 2]


def test_smart_playlist_generates_tracks(session: Session) -> None:
    owner = create_user(session)
    service = PlaylistService(session)
    create_track(session, "Sunrise")
    create_track(session, "Sunset")

    detail = service.create_playlist(
        owner=owner,
        data=PlaylistCreate(
            name="Sun",
            is_public=True,
            is_smart=True,
            smart_filter={"search": "sun", "limit": 5},
        ),
    )

    retrieved = service.get_playlist_detail(playlist_id=detail.id, current_user=owner)
    assert retrieved.is_smart is True
    assert retrieved.track_count == 2
    assert {track.track.title for track in retrieved.tracks} == {"Sunrise", "Sunset"}
*** End Patch
