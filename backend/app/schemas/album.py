from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel

from app.schemas.pagination import PaginatedResponse


class AlbumBase(BaseModel):
    title: str
    release_year: Optional[int] = None
    genre: Optional[str] = None


class AlbumCreate(AlbumBase):
    artist_id: int


class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    release_year: Optional[int] = None
    genre: Optional[str] = None
    artist_id: Optional[int] = None


class AlbumRead(AlbumBase):
    id: int
    artist_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AlbumWithArtist(AlbumRead):
    artist: Optional["ArtistRead"] = None

    class Config:
        from_attributes = True


class AlbumSummary(AlbumWithArtist):
    cover_art_url: Optional[str] = None


class AlbumWithTracks(AlbumSummary):
    tracks: list["TrackInAlbum"] = []
    total_tracks: int = 0
    total_duration: float | None = None


class AlbumListResponse(PaginatedResponse[AlbumSummary]):
    """Paginated response for album listings."""


class AlbumFilters(BaseModel):
    search: Optional[str] = None
    artist_id: Optional[int] = None
    genre: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None


class AlbumSortOptions(str, Enum):
    TITLE_ASC = "title_asc"
    TITLE_DESC = "title_desc"
    ARTIST_ASC = "artist_asc"
    ARTIST_DESC = "artist_desc"
    YEAR_ASC = "year_asc"
    YEAR_DESC = "year_desc"
    RECENTLY_ADDED = "recently_added"


# Forward reference imports
from .artist import ArtistRead  # noqa: E402
from .track import TrackInAlbum  # noqa: E402

AlbumWithArtist.model_rebuild()
AlbumSummary.model_rebuild()
AlbumWithTracks.model_rebuild()


__all__ = [
    "AlbumBase",
    "AlbumCreate",
    "AlbumFilters",
    "AlbumListResponse",
    "AlbumRead",
    "AlbumSortOptions",
    "AlbumSummary",
    "AlbumUpdate",
    "AlbumWithArtist",
    "AlbumWithTracks",
]
