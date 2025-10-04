"""
Cover image upload and management API
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/covers", tags=["covers"])

MUSIC_ROOT = Path("/mnt/nas-music")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class CoverUploadResponse(BaseModel):
    """Response for cover upload"""
    success: bool
    message: str
    cover_path: str


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


@router.post("/upload", response_model=CoverUploadResponse)
async def upload_cover(
    folder_path: str,
    file: UploadFile = File(...),
) -> CoverUploadResponse:
    """
    Upload cover image to album folder

    - **folder_path**: Relative path from /mnt/nas-music
    - **file**: Image file (JPEG or PNG)
    """
    # Validate folder path
    folder = validate_path(folder_path)
    if not folder.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )

    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Determine file extension
    ext = ".jpg" if file.content_type in {"image/jpeg", "image/jpg"} else ".png"

    # Save as folder.jpg (preferred name)
    cover_path = folder / f"folder{ext}"

    try:
        with open(cover_path, "wb") as f:
            f.write(content)

        return CoverUploadResponse(
            success=True,
            message="Cover uploaded successfully",
            cover_path=str(cover_path.relative_to(MUSIC_ROOT)),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")


@router.delete("/delete")
async def delete_cover(folder_path: str) -> dict:
    """
    Delete cover image from album folder

    - **folder_path**: Relative path from /mnt/nas-music
    """
    folder = validate_path(folder_path)
    if not folder.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    # Look for common cover image names
    cover_names = ["folder.jpg", "cover.jpg", "front.jpg", "album.jpg", "folder.png", "cover.png"]
    deleted = False

    for name in cover_names:
        cover_path = folder / name
        if cover_path.exists() and cover_path.is_file():
            try:
                cover_path.unlink()
                deleted = True
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete {name}: {e}")

    if not deleted:
        raise HTTPException(status_code=404, detail="No cover image found")

    return {"success": True, "message": "Cover deleted successfully"}


@router.get("/download/{path:path}")
async def download_cover(path: str):
    """
    Download cover image

    - **path**: Relative path from /mnt/nas-music to cover image
    """
    cover_path = validate_path(path)

    if not cover_path.is_file():
        raise HTTPException(status_code=404, detail="Cover not found")

    # Determine media type
    ext = cover_path.suffix.lower()
    media_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    return FileResponse(
        path=cover_path,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


__all__ = ["router"]
