"""
Folder-based album scanning API
Scans /mnt/nas-music for album folders and detects cover art
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Query, Response
from pydantic import BaseModel

router = APIRouter(prefix="/folder-albums", tags=["folder-albums"])

# Configuration
MUSIC_ROOT = Path("/mnt/nas-music")
COVER_IMAGE_NAMES = ["folder.jpg", "cover.jpg", "front.jpg", "album.jpg", "Folder.jpg", "Cover.jpg"]
AUDIO_EXTENSIONS = {".mp3", ".flac", ".m4a", ".wav", ".ogg", ".wma"}


class FolderAlbum(BaseModel):
    """Album representation based on folder structure"""
    path: str
    name: str
    cover_path: Optional[str] = None
    track_count: int = 0
    has_cover: bool = False
    parent_path: str = ""
    depth: int = 0


class FolderAlbumsResponse(BaseModel):
    """Response for folder-based albums"""
    items: List[FolderAlbum]
    total: int
    has_cover_count: int


def is_album_folder(folder_path: Path) -> bool:
    """Check if folder contains audio files"""
    try:
        for item in folder_path.iterdir():
            if item.is_file() and item.suffix.lower() in AUDIO_EXTENSIONS:
                return True
    except (PermissionError, OSError):
        pass
    return False


def find_cover_image(folder_path: Path) -> Optional[str]:
    """Find cover image in folder"""
    try:
        for cover_name in COVER_IMAGE_NAMES:
            cover_path = folder_path / cover_name
            if cover_path.exists() and cover_path.is_file():
                return str(cover_path.relative_to(MUSIC_ROOT))
    except (PermissionError, OSError):
        pass
    return None


def count_audio_files(folder_path: Path) -> int:
    """Count audio files in folder"""
    count = 0
    try:
        for item in folder_path.iterdir():
            if item.is_file() and item.suffix.lower() in AUDIO_EXTENSIONS:
                count += 1
    except (PermissionError, OSError):
        pass
    return count


def scan_folder_albums(
    root_path: Path = MUSIC_ROOT,
    max_depth: int = 10,
    min_depth: int = 1,
) -> List[FolderAlbum]:
    """
    Scan folder structure for album directories

    Args:
        root_path: Root directory to scan
        max_depth: Maximum depth to scan
        min_depth: Minimum depth to consider as album

    Returns:
        List of FolderAlbum objects
    """
    albums = []

    def scan_recursive(current_path: Path, depth: int = 0):
        if depth > max_depth:
            return

        try:
            items = sorted(current_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))

            for item in items:
                if not item.is_dir():
                    continue

                # Check if this folder contains audio files
                if is_album_folder(item):
                    if depth >= min_depth:  # Only add if at minimum depth
                        cover_path = find_cover_image(item)
                        track_count = count_audio_files(item)

                        album = FolderAlbum(
                            path=str(item.relative_to(root_path)),
                            name=item.name,
                            cover_path=cover_path,
                            track_count=track_count,
                            has_cover=cover_path is not None,
                            parent_path=str(item.parent.relative_to(root_path)),
                            depth=depth,
                        )
                        albums.append(album)

                # Continue scanning subdirectories
                scan_recursive(item, depth + 1)

        except (PermissionError, OSError) as e:
            print(f"Error scanning {current_path}: {e}")

    scan_recursive(root_path)
    return albums


@router.get("/", response_model=FolderAlbumsResponse)
async def get_folder_albums(
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search albums by name"),
    has_cover: Optional[bool] = Query(None, description="Filter by cover image presence"),
    min_depth: int = Query(1, ge=0, le=10),
    max_depth: int = Query(10, ge=1, le=20),
) -> FolderAlbumsResponse:
    """
    Get folder-based albums from /mnt/nas-music

    - **skip**: Number of items to skip (pagination)
    - **limit**: Number of items to return
    - **search**: Filter by album name (case-insensitive)
    - **has_cover**: Filter by presence of cover image
    - **min_depth**: Minimum folder depth to scan
    - **max_depth**: Maximum folder depth to scan
    """
    # Scan all albums
    all_albums = scan_folder_albums(
        root_path=MUSIC_ROOT,
        max_depth=max_depth,
        min_depth=min_depth,
    )

    # Apply filters
    filtered_albums = all_albums

    if search:
        search_lower = search.lower()
        filtered_albums = [
            album for album in filtered_albums
            if search_lower in album.name.lower() or search_lower in album.path.lower()
        ]

    if has_cover is not None:
        filtered_albums = [
            album for album in filtered_albums
            if album.has_cover == has_cover
        ]

    # Count albums with covers
    has_cover_count = sum(1 for album in filtered_albums if album.has_cover)

    # Apply pagination
    total = len(filtered_albums)
    paginated_albums = filtered_albums[skip : skip + limit]

    # Set cache headers
    response.headers["Cache-Control"] = "public, max-age=300, s-maxage=600"
    response.headers["X-Total-Count"] = str(total)

    return FolderAlbumsResponse(
        items=paginated_albums,
        total=total,
        has_cover_count=has_cover_count,
    )


@router.get("/cover/{path:path}")
async def get_folder_album_cover(path: str):
    """Get cover image for folder album"""
    from fastapi.responses import FileResponse

    # Security check
    full_path = MUSIC_ROOT / path
    try:
        full_path = full_path.resolve()
        if not str(full_path).startswith(str(MUSIC_ROOT)):
            return Response(status_code=403, content="Access denied")
    except Exception:
        return Response(status_code=404, content="Not found")

    # Find cover image
    if full_path.is_file():
        # Direct file path
        cover_path = full_path
    else:
        # Folder path, find cover
        cover_rel = find_cover_image(full_path)
        if not cover_rel:
            return Response(status_code=404, content="Cover not found")
        cover_path = MUSIC_ROOT / cover_rel

    if not cover_path.exists():
        return Response(status_code=404, content="Cover not found")

    return FileResponse(
        path=cover_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )


__all__ = ["router"]
