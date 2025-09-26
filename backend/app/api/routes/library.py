from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.pagination import (
    PaginationParams,
    build_pagination_metadata,
    pagination_params,
)
from app.db.models import User
from app.db.session import SessionLocal
from app.schemas import (
    LibraryBrowseResponse,
    LibrarySearchResponse,
    PaginationMeta,
    TrackSearchResult,
    TrackWithRelations,
)
from app.services import FileScannerService, LibraryService, SearchFilters

router = APIRouter(prefix="/library", tags=["library"])
logger = logging.getLogger(__name__)


@router.post("/scan")
async def scan_library(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Start a library scan operation."""
    if current_user.role.value not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    def run_scan() -> None:
        """Background task to scan the music library."""
        session = SessionLocal()
        try:
            logger.info("Starting library scan...")
            scanner = FileScannerService(session, settings.music_library_path)
            result = scanner.scan()

            logger.info("Scan completed successfully")
            logger.info("Files scanned: %s", result.scanned_files)
            logger.info("Tracks created: %s", result.created_tracks)
            logger.info("Tracks updated: %s", result.updated_tracks)
            logger.info("Files skipped: %s", result.skipped_files)
            logger.info("Duplicates found: %s", len(result.duplicates))

            if result.duplicates:
                logger.warning("Duplicate files detected during scan")
                for dup in result.duplicates:
                    logger.warning("Original: %s", dup.existing_path)
                    logger.warning("Duplicate: %s", dup.duplicate_path)

        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Library scan failed: %s", exc, exc_info=True)
        finally:
            session.close()

    background_tasks.add_task(run_scan)

    return {"message": "Library scan started", "status": "running"}


@router.get("/scan/status")
async def get_scan_status(
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Get the status of the current library scan."""
    # Placeholder status until background job tracking is implemented
    return {"status": "idle", "message": "No scan in progress"}


@router.get("/search", response_model=LibrarySearchResponse)
async def search_library_tracks(
    response: Response,
    pagination: PaginationParams = Depends(pagination_params(default_page_size=25, max_page_size=100)),
    q: str = Query(..., min_length=1, description="Search query"),
    sort: str = Query(
        "relevance",
        pattern=r"^(relevance|title|artist|album|recent)$",
        description="Sort order for search results",
    ),
    artist_id: int | None = Query(None, ge=1),
    album_id: int | None = Query(None, ge=1),
    genre: str | None = Query(None),
    db: Session = Depends(get_db),
) -> LibrarySearchResponse:
    service = LibraryService(db)
    tracks, scores, total = service.search_tracks(
        query=q,
        page=pagination.page,
        page_size=pagination.page_size,
        filters=SearchFilters(artist_id=artist_id, album_id=album_id, genre=genre),
        sort=sort,
    )

    items: list[TrackSearchResult] = []
    for track in tracks:
        track_data = TrackWithRelations.model_validate(track).model_dump()
        track_data["score"] = scores.get(track.id, 0.0)
        items.append(TrackSearchResult.model_validate(track_data))

    meta = build_pagination_metadata(total=total, params=pagination)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Total-Count"] = str(total)

    return LibrarySearchResponse(
        items=items,
        pagination=PaginationMeta.model_validate(meta),
    )


@router.get("/tracks", response_model=LibraryBrowseResponse)
async def browse_library_tracks(
    response: Response,
    pagination: PaginationParams = Depends(pagination_params(default_page_size=50, max_page_size=200)),
    sort: str = Query(
        "recent",
        pattern=r"^(recent|recent_asc|title|title_desc|artist|artist_desc|album|album_desc)$",
    ),
    search: str | None = Query(None),
    artist_id: int | None = Query(None, ge=1),
    album_id: int | None = Query(None, ge=1),
    genre: str | None = Query(None),
    db: Session = Depends(get_db),
) -> LibraryBrowseResponse:
    service = LibraryService(db)
    tracks, total = service.browse_tracks(
        page=pagination.page,
        page_size=pagination.page_size,
        filters=SearchFilters(artist_id=artist_id, album_id=album_id, genre=genre),
        sort=sort,
        search=search,
    )

    items = [TrackWithRelations.model_validate(track) for track in tracks]
    meta = build_pagination_metadata(total=total, params=pagination)

    response.headers["Cache-Control"] = "public, max-age=30"
    response.headers["X-Total-Count"] = str(total)

    return LibraryBrowseResponse(
        items=items,
        pagination=PaginationMeta.model_validate(meta),
    )


__all__ = ["router"]
