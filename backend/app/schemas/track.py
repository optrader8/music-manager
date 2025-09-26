from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TrackBase(BaseModel):
    title: str
    artist_id: Optional[int] = None
    album_id: Optional[int] = None
    track_number: Optional[int] = None
    disc_number: Optional[int] = None
    genre: Optional[str] = None
    duration_seconds: Optional[float] = None


class TrackCreate(TrackBase):
    file_path: str
    file_hash: str


class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist_id: Optional[int] = None
    album_id: Optional[int] = None
    track_number: Optional[int] = None
    disc_number: Optional[int] = None
    genre: Optional[str] = None
    duration_seconds: Optional[float] = None
    file_path: Optional[str] = None
    file_hash: Optional[str] = None


class TrackRead(TrackBase):
    id: int
    file_path: str
    file_hash: str
    created_at: datetime
    updated_at: datetime
    play_count: int
    last_played_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TrackWithRelations(TrackRead):
    artist: Optional["ArtistRead"] = None
    album: Optional["AlbumRead"] = None

    class Config:
        from_attributes = True


class TrackInAlbum(BaseModel):
    id: int
    title: str
    track_number: Optional[int] = None
    disc_number: Optional[int] = None
    duration_seconds: Optional[float] = None
    artist: Optional["ArtistRead"] = None

    class Config:
        from_attributes = True


class TrackMetadataUpdate(BaseModel):
    title: Optional[str] = Field(default=None, description="Track title")
    artist_name: Optional[str] = Field(default=None, description="Artist name")
    album_title: Optional[str] = Field(default=None, description="Album title")
    genre: Optional[str] = None
    release_year: Optional[int] = Field(default=None, ge=0, le=9999)
    track_number: Optional[int] = Field(default=None, ge=0)
    disc_number: Optional[int] = Field(default=None, ge=0)


class MetadataSuggestion(BaseModel):
    title: str
    artist_name: str | None = None
    album_title: str | None = None
    release_year: int | None = None
    score: float | None = None


from .album import AlbumRead  # noqa: E402
from .artist import ArtistRead  # noqa: E402

TrackWithRelations.model_rebuild()
TrackInAlbum.model_rebuild()


class TrackSearchResult(TrackWithRelations):
    score: float


TrackSearchResult.model_rebuild()


__all__ = [
    "MetadataSuggestion",
    "TrackBase",
    "TrackCreate",
    "TrackInAlbum",
    "TrackMetadataUpdate",
    "TrackRead",
    "TrackSearchResult",
    "TrackUpdate",
    "TrackWithRelations",
]
