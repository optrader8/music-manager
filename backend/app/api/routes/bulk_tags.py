"""
Bulk MP3 tag editing API
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from mutagen.mp3 import MP3
    from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC, TCON, TRCK
except ImportError:
    raise ImportError("mutagen is required. Install with: pip install mutagen")

router = APIRouter(prefix="/bulk-tags", tags=["bulk-tags"])

MUSIC_ROOT = Path("/mnt/nas-music")
AUDIO_EXTENSIONS = {".mp3"}


class Mp3Tags(BaseModel):
    """MP3 tag data"""
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    year: Optional[str] = None
    genre: Optional[str] = None
    track_number: Optional[str] = None


class BulkUpdateRequest(BaseModel):
    """Request for bulk tag update"""
    folder_path: str
    tags: Mp3Tags
    apply_to_all: bool = False  # If True, apply same tags to all files
    use_folder_name_as_album: bool = False  # If True, use folder name as album


class BulkUpdateResponse(BaseModel):
    """Response for bulk tag update"""
    success: bool
    updated_files: int
    failed_files: List[str] = []
    message: str


def validate_path(path_str: str) -> Path:
    """Validate and resolve path"""
    try:
        full_path = (MUSIC_ROOT / path_str).resolve()
        if not str(full_path).startswith(str(MUSIC_ROOT)):
            raise ValueError("Path outside allowed directory")
        if not full_path.exists():
            raise ValueError("Path does not exist")
        return full_path
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid path: {e}")


def update_mp3_tags(file_path: Path, tags: Mp3Tags) -> None:
    """Update MP3 tags using mutagen"""
    try:
        audio = MP3(file_path, ID3=ID3)

        # Add ID3 tag if it doesn't exist
        if audio.tags is None:
            audio.add_tags()

        # Update tags only if provided
        if tags.title:
            audio.tags.add(TIT2(encoding=3, text=tags.title))
        if tags.artist:
            audio.tags.add(TPE1(encoding=3, text=tags.artist))
        if tags.album:
            audio.tags.add(TALB(encoding=3, text=tags.album))
        if tags.year:
            audio.tags.add(TDRC(encoding=3, text=tags.year))
        if tags.genre:
            audio.tags.add(TCON(encoding=3, text=tags.genre))
        if tags.track_number:
            audio.tags.add(TRCK(encoding=3, text=tags.track_number))

        audio.save()
    except Exception as e:
        raise Exception(f"Failed to update tags: {e}")


@router.post("/update", response_model=BulkUpdateResponse)
async def bulk_update_tags(request: BulkUpdateRequest) -> BulkUpdateResponse:
    """
    Bulk update MP3 tags in a folder

    - **folder_path**: Relative path from /mnt/nas-music
    - **tags**: Tag values to update
    - **apply_to_all**: If true, apply same values to all files
    - **use_folder_name_as_album**: If true, use folder name as album name
    """
    folder_path = validate_path(request.folder_path)

    if not folder_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    # Get all MP3 files
    mp3_files = sorted([f for f in folder_path.iterdir() if f.suffix.lower() == ".mp3"])

    if not mp3_files:
        raise HTTPException(status_code=404, detail="No MP3 files found in folder")

    updated_count = 0
    failed_files = []

    # Prepare tags
    tags_to_apply = request.tags.model_copy(deep=True)

    # Use folder name as album if requested
    if request.use_folder_name_as_album:
        tags_to_apply.album = folder_path.name

    # Update each file
    for i, mp3_file in enumerate(mp3_files):
        try:
            # If not apply_to_all and track_number not set, use file index
            if not request.apply_to_all and not tags_to_apply.track_number:
                tags_to_apply.track_number = str(i + 1)

            update_mp3_tags(mp3_file, tags_to_apply)
            updated_count += 1
        except Exception as e:
            failed_files.append(f"{mp3_file.name}: {str(e)}")

    success = updated_count > 0
    message = f"Updated {updated_count} files"
    if failed_files:
        message += f", {len(failed_files)} failed"

    return BulkUpdateResponse(
        success=success,
        updated_files=updated_count,
        failed_files=failed_files,
        message=message,
    )


@router.post("/sync-from-first", response_model=BulkUpdateResponse)
async def sync_tags_from_first(folder_path: str) -> BulkUpdateResponse:
    """
    Copy artist, album, year, genre from first MP3 file to all other files in folder
    Only track numbers are updated sequentially

    - **folder_path**: Relative path from /mnt/nas-music
    """
    full_path = validate_path(folder_path)

    if not full_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    mp3_files = sorted([f for f in full_path.iterdir() if f.suffix.lower() == ".mp3"])

    if not mp3_files:
        raise HTTPException(status_code=404, detail="No MP3 files found in folder")

    # Read tags from first file
    try:
        first_audio = MP3(mp3_files[0], ID3=ID3)
        if first_audio.tags is None:
            raise HTTPException(status_code=400, detail="First file has no ID3 tags")

        # Extract common tags
        common_tags = Mp3Tags(
            artist=str(first_audio.tags.get("TPE1", [""])[0]),
            album=str(first_audio.tags.get("TALB", [""])[0]),
            year=str(first_audio.tags.get("TDRC", [""])[0]),
            genre=str(first_audio.tags.get("TCON", [""])[0]),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read first file tags: {e}")

    # Apply to all files
    updated_count = 0
    failed_files = []

    for i, mp3_file in enumerate(mp3_files):
        try:
            file_tags = common_tags.model_copy(deep=True)
            file_tags.track_number = str(i + 1)
            update_mp3_tags(mp3_file, file_tags)
            updated_count += 1
        except Exception as e:
            failed_files.append(f"{mp3_file.name}: {str(e)}")

    return BulkUpdateResponse(
        success=updated_count > 0,
        updated_files=updated_count,
        failed_files=failed_files,
        message=f"Synchronized {updated_count} files from first file",
    )


__all__ = ["router"]
