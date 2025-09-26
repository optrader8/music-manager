from __future__ import annotations

from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.pagination import PaginationParams
from app.db.models import Album, Artist, Track
from app.schemas import (
    AlbumFilters,
    AlbumSortOptions,
    AlbumSummary,
    AlbumWithArtist,
    AlbumWithTracks,
    TrackInAlbum,
)


class AlbumService:
    """Business logic for album queries and transformations."""

    _SORT_MAPPING = {
        AlbumSortOptions.TITLE_ASC: (asc(func.lower(Album.title)), asc(Album.id)),
        AlbumSortOptions.TITLE_DESC: (desc(func.lower(Album.title)), desc(Album.id)),
        AlbumSortOptions.ARTIST_ASC: (asc(func.lower(Artist.name)), asc(func.lower(Album.title))),
        AlbumSortOptions.ARTIST_DESC: (desc(func.lower(Artist.name)), asc(func.lower(Album.title))),
        AlbumSortOptions.YEAR_ASC: (Album.release_year.asc().nullslast(), asc(Album.id)),
        AlbumSortOptions.YEAR_DESC: (Album.release_year.desc().nullsfirst(), desc(Album.id)),
        AlbumSortOptions.RECENTLY_ADDED: (desc(Album.created_at), desc(Album.id)),
    }

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_albums(
        self,
        *,
        pagination: PaginationParams,
        filters: AlbumFilters | None = None,
        sort: AlbumSortOptions = AlbumSortOptions.RECENTLY_ADDED,
    ) -> tuple[list[AlbumSummary], int]:
        filters = filters or AlbumFilters()

        query = (
            self.session.query(Album)
            .options(joinedload(Album.artist))
            .outerjoin(Artist)
        )

        if filters.search:
            search_term = filters.search.strip().lower()
            if search_term:
                pattern = f"%{search_term}%"
                query = query.filter(
                    or_(
                        func.lower(Album.title).like(pattern),
                        func.lower(Artist.name).like(pattern),
                        func.lower(Album.genre).like(pattern),
                    )
                )

        if filters.artist_id is not None:
            query = query.filter(Album.artist_id == filters.artist_id)
        if filters.genre:
            genre_term = filters.genre.strip()
            if genre_term:
                query = query.filter(Album.genre.ilike(f"%{genre_term}%"))
        if filters.year_from is not None:
            query = query.filter(Album.release_year >= filters.year_from)
        if filters.year_to is not None:
            query = query.filter(Album.release_year <= filters.year_to)

        total = query.count()

        sort_expressions = self._SORT_MAPPING.get(sort, self._SORT_MAPPING[AlbumSortOptions.RECENTLY_ADDED])
        query = query.order_by(*sort_expressions)

        albums = query.offset(pagination.offset).limit(pagination.page_size).all()
        summaries = [self._to_summary(album) for album in albums]
        return summaries, total

    def get_album_summary(self, album_id: int) -> AlbumSummary:
        album = (
            self.session.query(Album)
            .options(joinedload(Album.artist))
            .filter(Album.id == album_id)
            .first()
        )

        if not album:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

        return self._to_summary(album)

    def get_album_with_tracks(self, album_id: int) -> AlbumWithTracks:
        album = (
            self.session.query(Album)
            .options(
                joinedload(Album.artist),
                joinedload(Album.tracks).joinedload(Track.artist),
            )
            .filter(Album.id == album_id)
            .first()
        )

        if not album:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

        tracks = sorted(
            (track for track in album.tracks),
            key=lambda t: (
                (t.disc_number or 0),
                (t.track_number or 0),
                t.id,
            ),
        )

        track_items = [TrackInAlbum.model_validate(track) for track in tracks]
        total_duration = sum((track.duration_seconds or 0.0) for track in tracks)

        summary = self._to_summary(album)
        return AlbumWithTracks(
            **summary.model_dump(),
            tracks=track_items,
            total_tracks=len(track_items),
            total_duration=total_duration if track_items else None,
        )

    def _to_summary(self, album: Album) -> AlbumSummary:
        base = AlbumWithArtist.model_validate(album)
        return AlbumSummary(
            **base.model_dump(),
            cover_art_url=self._cover_art_url(album.id),
        )

    def _cover_art_url(self, album_id: int) -> str:
        return f"/albums/{album_id}/cover?size=medium"

    def get_album_track_ids(self, album_id: int) -> Iterable[int]:
        query = (
            self.session.query(Track.id)
            .filter(Track.album_id == album_id)
            .order_by(
                Track.disc_number.nullsfirst(),
                Track.track_number.nullsfirst(),
                Track.id.asc(),
            )
        )
        return (row[0] for row in query.all())


__all__ = ["AlbumService"]
