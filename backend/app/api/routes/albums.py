from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.pagination import (
    PaginationParams,
    build_pagination_metadata,
    pagination_params,
)
from app.db.models import User
from app.schemas import (
    AlbumFilters,
    AlbumListResponse,
    AlbumSortOptions,
    AlbumSummary,
    AlbumWithTracks,
    PaginationMeta,
)
from app.services import AlbumService, StreamingService
from app.services.streaming_service import CoverSize

router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("/", response_model=AlbumListResponse)
async def list_albums(
    response: Response,
    pagination: PaginationParams = Depends(pagination_params(default_page_size=24, max_page_size=100)),
    search: str | None = Query(None, description="Search albums by title, artist, or genre"),
    artist_id: int | None = Query(None, ge=1),
    genre: str | None = Query(None),
    year_from: int | None = Query(None, ge=0),
    year_to: int | None = Query(None, ge=0),
    sort: AlbumSortOptions = Query(AlbumSortOptions.RECENTLY_ADDED),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlbumListResponse:
    service = AlbumService(session)
    filters = AlbumFilters(
        search=search,
        artist_id=artist_id,
        genre=genre,
        year_from=year_from,
        year_to=year_to,
    )
    items, total = service.get_albums(
        pagination=pagination,
        filters=filters,
        sort=sort,
    )

    meta = build_pagination_metadata(total=total, params=pagination)
    response.headers["X-Total-Count"] = str(total)
    response.headers["Cache-Control"] = "public, max-age=30"
    return AlbumListResponse(items=items, pagination=PaginationMeta.model_validate(meta))


@router.get("/{album_id}", response_model=AlbumSummary)
async def get_album(
    album_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlbumSummary:
    service = AlbumService(session)
    return service.get_album_summary(album_id)


@router.get("/{album_id}/tracks", response_model=AlbumWithTracks)
async def get_album_tracks(
    album_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlbumWithTracks:
    service = AlbumService(session)
    return service.get_album_with_tracks(album_id)


@router.get("/{album_id}/cover")
async def get_album_cover(
    album_id: int,
    size: CoverSize = Query(CoverSize.MEDIUM),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    streaming_service = StreamingService(session)
    return await streaming_service.get_album_cover(album_id, size)


__all__ = ["router"]
