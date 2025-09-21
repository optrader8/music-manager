from datetime import datetime

from sqlalchemy import select

from app.db.models import Album, Artist, Playlist, PlaylistTrack, Track, User, UserRole


def test_artist_album_track_relationships(session) -> None:
    artist = Artist(name="Daft Punk")
    album = Album(title="Discovery", artist=artist, release_year=2001)
    track = Track(
        title="One More Time",
        album=album,
        artist=artist,
        track_number=1,
        file_path="/music/daft_punk/discovery/01-one-more-time.mp3",
        file_hash="hash-one-more-time",
    )

    session.add(track)
    session.commit()

    loaded_artist = session.scalar(select(Artist).where(Artist.name == "Daft Punk"))
    assert loaded_artist is not None
    assert loaded_artist.albums[0].title == "Discovery"
    assert loaded_artist.tracks[0].title == "One More Time"

    loaded_track = session.scalar(select(Track).where(Track.title == "One More Time"))
    assert loaded_track is not None
    assert loaded_track.album is not None
    assert loaded_track.album.title == "Discovery"
    assert loaded_track.artist is not None
    assert loaded_track.artist.name == "Daft Punk"


def test_playlist_orders_tracks(session) -> None:
    user = User(email="user@example.com", hashed_password="hashed", role=UserRole.ADMIN)
    artist = Artist(name="Radiohead")
    track_1 = Track(
        title="Everything In Its Right Place",
        artist=artist,
        file_path="/music/radiohead/kid_a/01.mp3",
        file_hash="hash-1",
    )
    track_2 = Track(
        title="Kid A",
        artist=artist,
        file_path="/music/radiohead/kid_a/02.mp3",
        file_hash="hash-2",
    )
    playlist = Playlist(name="Morning Mix", owner=user, is_public=False)
    playlist.tracks.append(PlaylistTrack(track=track_1, position=1))
    playlist.tracks.append(PlaylistTrack(track=track_2, position=2))

    session.add(playlist)
    session.commit()

    loaded_playlist = session.scalar(select(Playlist).where(Playlist.name == "Morning Mix"))

    assert loaded_playlist is not None
    positions = [entry.position for entry in loaded_playlist.tracks]
    assert positions == [1, 2]
    track_titles = [entry.track.title for entry in loaded_playlist.tracks]
    assert track_titles == ["Everything In Its Right Place", "Kid A"]


def test_user_timestamps_autofilled(session) -> None:
    user = User(email="listener@example.com", hashed_password="hashed")
    session.add(user)
    session.commit()

    assert isinstance(user.created_at, datetime)
    assert isinstance(user.updated_at, datetime)
