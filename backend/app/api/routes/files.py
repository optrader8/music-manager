from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_current_admin_user
from app.schemas.file import DirectoryListing, RenameRequest, MP3TagData, MP3TagUpdate
from app.services.file_service import file_service

router = APIRouter()


@router.get("/browse", response_model=DirectoryListing)
async def browse_directory(
    path: str = Query("", description="Directory path relative to music root"),
    search: Optional[str] = Query(None, description="Search term for filtering files"),
    current_user: dict = Depends(get_current_admin_user)
):
    """Browse directory contents with optional search."""
    try:
        return file_service.browse_directory(path, search)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Directory not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{file_path:path}")
async def delete_file(
    file_path: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Delete a file or directory."""
    try:
        file_service.delete_file(file_path)
        return {"message": "File deleted successfully"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.put("/{file_path:path}/rename")
async def rename_file(
    file_path: str,
    request: RenameRequest,
    current_user: dict = Depends(get_current_admin_user)
):
    """Rename a file or directory."""
    try:
        new_path = file_service.rename_file(file_path, request.new_name)
        return {"message": "File renamed successfully", "new_path": new_path}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except FileExistsError:
        raise HTTPException(status_code=409, detail="File with this name already exists")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{file_path:path}/mp3-tags", response_model=MP3TagData)
async def get_mp3_tags(
    file_path: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Get MP3 tag data."""
    try:
        return file_service.read_mp3_tags(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{file_path:path}/mp3-tags")
async def update_mp3_tags(
    file_path: str,
    tag_data: MP3TagUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """Update MP3 tag data."""
    try:
        # Convert MP3TagUpdate to MP3TagData
        update_data = MP3TagData(**tag_data.model_dump())
        file_service.update_mp3_tags(file_path, update_data)
        return {"message": "MP3 tags updated successfully"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))