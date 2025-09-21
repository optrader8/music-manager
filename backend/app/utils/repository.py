"""Common repository utilities for database operations."""

from sqlalchemy.orm import Session

from app.db.models import Album, Artist


class ArtistRepository:
    """Repository for Artist operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_or_create(self, name: str) -> Artist:
        """Get an existing artist or create a new one."""
        artist = self.session.query(Artist).filter(Artist.name == name).one_or_none()
        if not artist:
            artist = Artist(name=name)
            self.session.add(artist)
            self.session.flush()
        return artist


class AlbumRepository:
    """Repository for Album operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_or_create(
        self,
        artist: Artist,
        title: str,
        release_year: int | None = None,
        genre: str | None = None,
    ) -> Album:
        """Get an existing album or create a new one."""
        album = (
            self.session.query(Album)
            .filter(Album.artist_id == artist.id, Album.title == title)
            .one_or_none()
        )
        if not album:
            album = Album(
                artist=artist,
                title=title,
                release_year=release_year,
                genre=genre,
            )
            self.session.add(album)
            self.session.flush()
        else:
            # Update existing album with new information if provided
            if release_year and not album.release_year:
                album.release_year = release_year
            if genre and not album.genre:
                album.genre = genre

        return album


__all__ = ["ArtistRepository", "AlbumRepository"]