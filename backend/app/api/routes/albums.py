from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_session
from app.db.models import Album, User
from app.schemas import AlbumWithArtist

router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("/", response_model=List[AlbumWithArtist])
async def get_albums(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    artist_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get albums with optional filtering and pagination."""
    query = session.query(Album).options(joinedload(Album.artist))

    if search:
        query = query.filter(Album.title.ilike(f"%{search}%"))

    if artist_id:
        query = query.filter(Album.artist_id == artist_id)

    albums = query.offset(skip).limit(limit).all()
    return albums


@router.get("/{album_id}", response_model=AlbumWithArtist)
async def get_album(
    album_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a specific album by ID."""
    album = (
        session.query(Album)
        .options(joinedload(Album.artist))
        .filter(Album.id == album_id)
        .first()
    )

    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    return album