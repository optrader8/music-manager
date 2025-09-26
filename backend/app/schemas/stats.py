from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .album import AlbumSummary
from .pagination import PaginatedResponse
from .track import TrackWithRelations


class LibraryOverview(BaseModel):
    total_albums: int
    total_tracks: int
    total_artists: int
    total_duration_seconds: int
    total_duration_hours: float
    estimated_size_mb: float
    average_bitrate: float | None = None
    average_track_duration: Optional[float] = None
    recently_added_at: Optional[datetime] = None


class GenreDistribution(BaseModel):
    genre: str
    track_count: int
    total_duration_seconds: float


class TrackPlayStats(TrackWithRelations):
    play_count: int
    last_played_at: Optional[datetime] = None


class TrackPlayStatsResponse(PaginatedResponse[TrackPlayStats]):
    """Paginated response for most played tracks."""


class ArtistStats(BaseModel):
    name: str
    track_count: int
    album_count: int


class AlbumStats(BaseModel):
    title: str
    artist_name: Optional[str] = None
    release_date: Optional[str] = None
    track_count: int
    total_duration_seconds: int
    total_duration_minutes: int


class BitrateDistribution(BaseModel):
    bitrate: int
    count: int


class SampleRateDistribution(BaseModel):
    sample_rate: int
    count: int


class QualityStats(BaseModel):
    bitrate_distribution: list[BitrateDistribution]
    sample_rate_distribution: list[SampleRateDistribution]


class DashboardData(BaseModel):
    overview: LibraryOverview
    recent_albums: list[AlbumSummary]
    top_tracks: list[TrackPlayStats]
    genre_distribution: list[GenreDistribution]
    scan_status: str
    scan_progress: Optional[float] = None
    generated_at: datetime


__all__ = [
    "AlbumStats",
    "ArtistStats",
    "BitrateDistribution",
    "DashboardData",
    "GenreDistribution",
    "LibraryOverview",
    "QualityStats",
    "SampleRateDistribution",
    "TrackPlayStatsResponse",
    "TrackPlayStats",
]
