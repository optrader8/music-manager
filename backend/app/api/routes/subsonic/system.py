"""Subsonic API system endpoints"""
from fastapi import APIRouter, Request, Query
from fastapi.responses import Response, FileResponse
from typing import Optional
from pathlib import Path
import os
from PIL import Image
import io

from app.schemas.subsonic.responses import SubsonicResponse, License, MusicFolder
from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.core.subsonic_formatter import SubsonicResponseFormatter
from app.services.subsonic_service import SubsonicService
from app.services.subsonic_id_mapper import SubsonicIDMapper
from app.services.album_service import AlbumService
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/ping", 
            summary="Ping server",
            description="Used to test connectivity with the server.")
async def ping(
    request: Request,
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Ping endpoint to test connectivity"""
    # Authentication is not required for ping, but we attempt it anyway
    # to validate that the credentials are valid, though failure is not an error
    user = None
    try:
        user = await get_current_subsonic_user(request)
    except SubsonicError:
        # Ping doesn't fail if authentication fails
        pass

    # Determine response format
    format_type = (f or 'xml').lower()
    
    # Create successful response
    response_data = {
        "status": "ok",
        "version": "1.16.1",
        "type": "music-manager",
        "serverVersion": "1.0.0",
        "openSubsonic": True,
    }

    return SubsonicResponseFormatter.format_response(response_data, format_type)


@router.get("/getLicense",
            summary="Get license info",
            description="Returns license information for the current user.")
async def get_license(
    request: Request,
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get license information"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)

    # Get database session
    db: Session = next(get_db())
    
    try:
        # Create service instance
        service = SubsonicService(db)
        
        # Get license info
        license_info = service.get_license_info()
        
        # Determine response format
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "license": {
                "valid": license_info.valid,
                "email": license_info.email,
                "licenseExpires": license_info.licenseExpires,
                "trialExpires": license_info.trialExpires,
                "numberOfUsers": license_info.numberOfUsers,
                "date": "2023-01-01T00:00:00.000Z"  # Could be actual current date
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


@router.get("/getMusicFolders",
            summary="Get music folders",
            description="Returns all configured music folders.")
async def get_music_folders(
    request: Request,
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get music folders"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)

    # Get database session
    db: Session = next(get_db())
    
    try:
        # Create service instance
        service = SubsonicService(db)
        
        # Get music folders
        music_folders = service.get_music_folders()
        
        # Determine response format
        format_type = (f or 'xml').lower()
        
        # Format the music folders according to Subsonic spec
        folder_data = []
        for folder in music_folders:
            folder_info = {
                "@id": folder.id,
                "@name": folder.name
            }
            # Add path if available
            if folder.path:
                folder_info["@path"] = folder.path
            folder_data.append(folder_info)
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True,
            "musicFolders": {
                "musicFolder": folder_data
            }
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    finally:
        db.close()


def create_default_image(width: int = 300, height: int = 300) -> bytes:
    """Create a default placeholder image"""
    img = Image.new('RGB', (width, height), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf.getvalue()


def resize_image(image_path: str, size: int) -> bytes:
    """Resize an image to the specified size"""
    with Image.open(image_path) as img:
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        return buf.getvalue()


@router.get("/getCoverArt",
            summary="Get cover art for an album",
            description="Returns a cover art image.")
async def get_cover_art(
    request: Request,
    id: str = Query(..., description="The album ID"),
    size: Optional[int] = Query(None, description="Requested image size"),
    f: Optional[str] = Query(None, description="Response format: ignored for images")
):
    """Get cover art for an album"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode the ID to get the album ID
        if not id.startswith("al-"):
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid cover art ID format: {id}")
        
        # Extract the internal album ID
        try:
            internal_album_id = SubsonicIDMapper.decode_album_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid album ID: {id}")
        
        # Get the album from the database
        album_service = AlbumService(db)
        album = album_service.get_album_by_id(internal_album_id)
        
        if not album:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Album not found: {id}")
        
        # Try to find cover art for the album
        cover_art_path = None
        
        # Look for cover art in common locations/files
        if hasattr(album, 'art_path') and album.art_path and os.path.exists(album.art_path):
            cover_art_path = album.art_path
        elif hasattr(album, 'file_path') and album.file_path:
            # Try to find cover art in the same directory as the first track
            album_dir = os.path.dirname(album.file_path) if album.file_path else None
            if album_dir:
                for cover_file in ['cover.jpg', 'folder.jpg', 'cover.png', 'folder.png', 'album.jpg', 'album.png']:
                    potential_path = os.path.join(album_dir, cover_file)
                    if os.path.exists(potential_path):
                        cover_art_path = potential_path
                        break
        
        if cover_art_path and os.path.exists(cover_art_path):
            # If a size is specified, resize the image
            if size:
                try:
                    resized_image_bytes = resize_image(cover_art_path, size)
                    return Response(
                        content=resized_image_bytes,
                        media_type="image/jpeg"
                    )
                except Exception:
                    # If resizing fails, return the original image
                    pass
            
            # Return the original image file
            return FileResponse(
                path=cover_art_path,
                media_type="image/jpeg"
            )
        else:
            # Return a default placeholder image
            width = size if size else 300
            default_image = create_default_image(width, width)
            
            return Response(
                content=default_image,
                media_type="image/jpeg"
            )
    
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    except Exception as e:
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()