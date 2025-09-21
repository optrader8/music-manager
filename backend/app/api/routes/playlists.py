from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.db.models import User
from app.schemas import (
    PlaylistCreate,
    PlaylistDetail,
    PlaylistRead,
    PlaylistTrackReorderRequest,
    PlaylistTrackRequest,
    PlaylistUpdate,
)
from app.services import PlaylistService

router = APIRouter(prefix="/playlists", tags=["playlists"])


@router.get("/", response_model=list[PlaylistRead])
async def list_playlists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    owner_id: int | None = Query(None, ge=1),
) -> list[PlaylistRead]:
    service = PlaylistService(db)
    return service.list_accessible_playlists(current_user=current_user, owner_id=owner_id)


@router.post("/", response_model=PlaylistDetail, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    payload: PlaylistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PlaylistDetail:
    service = PlaylistService(db)
    try:
        return service.create_playlist(owner=current_user, data=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{playlist_id}", response_model=PlaylistDetail)
async def get_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PlaylistDetail:
    service = PlaylistService(db)
    try:
        return service.get_playlist_detail(playlist_id=playlist_id, current_user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{playlist_id}", response_model=PlaylistDetail)
async def update_playlist(
    playlist_id: int,
    payload: PlaylistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PlaylistDetail:
    service = PlaylistService(db)
    try:
        return service.update_playlist(playlist_id=playlist_id, owner=current_user, data=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    service = PlaylistService(db)
    try:
        service.delete_playlist(playlist_id=playlist_id, owner=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{playlist_id}/tracks", response_model=PlaylistDetail)
async def add_track_to_playlist(
    playlist_id: int,
    payload: PlaylistTrackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PlaylistDetail:
    service = PlaylistService(db)
    try:
        return service.add_track_to_playlist(playlist_id=playlist_id, request=payload, owner=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{playlist_id}/tracks/{track_id}", response_model=PlaylistDetail)
async def reorder_playlist_track(
    playlist_id: int,
    track_id: int,
    payload: PlaylistTrackReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PlaylistDetail:
    service = PlaylistService(db)
    try:
        return service.reorder_track(
            playlist_id=playlist_id,
            track_id=track_id,
            new_position=payload.position,
            owner=current_user,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{playlist_id}/tracks/{track_id}", response_model=PlaylistDetail)
async def remove_track_from_playlist(
    playlist_id: int,
    track_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PlaylistDetail:
    service = PlaylistService(db)
    try:
        return service.remove_track_from_playlist(
            playlist_id=playlist_id,
            track_id=track_id,
            owner=current_user,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


__all__ = ["router"]
