"""Subsonic API system endpoints"""
from fastapi import APIRouter, Request, Query
from fastapi.responses import Response
from typing import Optional

from app.schemas.subsonic.responses import SubsonicResponse, License, MusicFolder
from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.core.subsonic_formatter import SubsonicResponseFormatter

router = APIRouter()


@router.get("/ping", 
            summary="Ping server",
            description="Used to test connectivity with the server.")
async def ping(
    request: Request,
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Ping endpoint to test connectivity"""
    try:
        # Authentication is not required for ping
        user = await get_current_subsonic_user(request)
    except SubsonicError:
        # Ping doesn't require authentication
        user = None

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

    # Determine response format
    format_type = (f or 'xml').lower()
    
    # Create license info
    license_info = License()
    
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
            "date": "2023-01-01T00:00:00.000Z"  # Current date
        }
    }

    return SubsonicResponseFormatter.format_response(response_data, format_type)


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

    # Determine response format
    format_type = (f or 'xml').lower()
    
    # Create music folders - for now just one default folder
    music_folder = MusicFolder(
        id="1",
        name="Music Library",
        path="/music"
    )
    
    response_data = {
        "status": "ok",
        "version": "1.16.1",
        "type": "music-manager",
        "serverVersion": "1.0.0",
        "openSubsonic": True,
        "musicFolders": {
            "musicFolder": [
                {
                    "@id": music_folder.id,
                    "@name": music_folder.name
                }
            ]
        }
    }

    return SubsonicResponseFormatter.format_response(response_data, format_type)