from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_db
from app.db.models import Track, User
from app.schemas import TrackRead, TrackWithRelations

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("/", response_model=List[TrackWithRelations])
async def get_tracks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    artist_id: Optional[int] = Query(None),
    album_id: Optional[int] = Query(None),
    session: Session = Depends(get_db),
):
    """Get tracks with optional filtering and pagination."""
    query = session.query(Track).options(
        joinedload(Track.artist),
        joinedload(Track.album)
    )

    if search:
        query = query.filter(Track.title.ilike(f"%{search}%"))

    if artist_id:
        query = query.filter(Track.artist_id == artist_id)

    if album_id:
        query = query.filter(Track.album_id == album_id)

    tracks = query.offset(skip).limit(limit).all()
    return tracks


@router.get("/{track_id}", response_model=TrackWithRelations)
async def get_track(
    track_id: int,
    session: Session = Depends(get_db),
):
    """Get a specific track by ID."""
    track = (
        session.query(Track)
        .options(joinedload(Track.artist), joinedload(Track.album))
        .filter(Track.id == track_id)
        .first()
    )

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    return track