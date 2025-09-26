from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from cachetools import TTLCache
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.pagination import (
    PaginationParams,
    pagination_params,
)
from app.schemas import (
    AlbumListResponse,
    AlbumStats,
    ArtistStats,
    DashboardData,
    GenreDistribution,
    LibraryOverview,
    QualityStats,
    TrackPlayStatsResponse,
)
from app.services import StatisticsService

router = APIRouter(prefix="/stats", tags=["statistics"])

_CACHE_TTL_SECONDS = 30
_dashboard_cache: TTLCache[str, DashboardData] | None = None


def _get_cache() -> TTLCache[str, DashboardData]:
    global _dashboard_cache
    if _dashboard_cache is None:
        _dashboard_cache = TTLCache(maxsize=4, ttl=_CACHE_TTL_SECONDS)
    return _dashboard_cache


@router.get("/overview", response_model=LibraryOverview)
async def get_stats_overview(db: Session = Depends(get_db)) -> LibraryOverview:
    service = StatisticsService(db)
    return service.get_library_overview()


@router.get("/recent-albums", response_model=AlbumListResponse)
async def get_recent_albums(
    pagination: PaginationParams = Depends(pagination_params(default_page_size=12, max_page_size=48)),
    db: Session = Depends(get_db),
) -> AlbumListResponse:
    service = StatisticsService(db)
    items, meta = service.get_recently_added_albums(pagination)
    return AlbumListResponse(items=items, pagination=meta)


@router.get("/most-played", response_model=TrackPlayStatsResponse)
async def get_most_played_tracks(
    pagination: PaginationParams = Depends(pagination_params(default_page_size=10, max_page_size=50)),
    db: Session = Depends(get_db),
) -> TrackPlayStatsResponse:
    service = StatisticsService(db)
    items, meta = service.get_most_played_tracks(pagination)
    return TrackPlayStatsResponse(items=items, pagination=meta)


@router.get("/genres", response_model=list[GenreDistribution])
async def get_genre_distribution(db: Session = Depends(get_db)) -> list[GenreDistribution]:
    service = StatisticsService(db)
    return service.get_genre_distribution()


@router.get("/artists", response_model=list[ArtistStats])
async def get_artist_stats(db: Session = Depends(get_db)) -> list[ArtistStats]:
    service = StatisticsService(db)
    return service.get_artist_stats()


@router.get("/albums", response_model=list[AlbumStats])
async def get_album_stats(db: Session = Depends(get_db)) -> list[AlbumStats]:
    service = StatisticsService(db)
    return service.get_album_stats()


@router.get("/quality", response_model=QualityStats)
async def get_quality_stats(db: Session = Depends(get_db)) -> QualityStats:
    service = StatisticsService(db)
    return service.get_quality_stats()


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(
    db: Session = Depends(get_db),
) -> DashboardData:
    cache = _get_cache()
    cached = cache.get("dashboard")
    if cached is not None:
        return cached

    stats_service = StatisticsService(db)

    overview = stats_service.get_library_overview()
    recent_items, _ = stats_service.get_recently_added_albums(
        PaginationParams(page=1, page_size=6)
    )
    top_tracks, _ = stats_service.get_most_played_tracks(
        PaginationParams(page=1, page_size=10)
    )
    genre_distribution = stats_service.get_genre_distribution()
    scan_status, scan_progress = _get_scan_status(db)

    data = DashboardData(
        overview=overview,
        recent_albums=recent_items,
        top_tracks=top_tracks,
        genre_distribution=genre_distribution,
        scan_status=scan_status,
        scan_progress=scan_progress,
        generated_at=datetime.utcnow(),
    )
    cache["dashboard"] = data
    return data


def _get_scan_status(session: Session) -> tuple[str, float | None]:
    # TODO: integrate with real scan monitoring when available
    return "idle", None


__all__ = ["router"]
