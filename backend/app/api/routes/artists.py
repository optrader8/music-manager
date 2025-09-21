from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_session
from app.db.models import Artist, User
from app.schemas import ArtistRead

router = APIRouter(prefix="/artists", tags=["artists"])


@router.get("/", response_model=List[ArtistRead])
async def get_artists(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get artists with optional filtering and pagination."""
    query = session.query(Artist)

    if search:
        query = query.filter(Artist.name.ilike(f"%{search}%"))

    artists = query.offset(skip).limit(limit).all()
    return artists


@router.get("/{artist_id}", response_model=ArtistRead)
async def get_artist(
    artist_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a specific artist by ID."""
    artist = session.query(Artist).filter(Artist.id == artist_id).first()

    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    return artist