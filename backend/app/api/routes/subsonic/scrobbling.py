"""Subsonic API scrobbling and tracking endpoints"""
from fastapi import APIRouter, Request, Query
from typing import Optional

from app.core.subsonic_errors import SubsonicError, SubsonicErrorCodes, create_error_response
from app.core.subsonic_auth import get_current_subsonic_user
from app.core.subsonic_formatter import SubsonicResponseFormatter
from app.services.subsonic_id_mapper import SubsonicIDMapper
from app.services.track_service import TrackService
from app.services.statistics_service import StatisticsService
from app.db.session import get_db
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter()


@router.get("/scrobble",
            summary="Scrobble tracks",
            description="Used to notify the server when the user starts playing, stops playing, or changes a song.")
async def scrobble(
    request: Request,
    id: str = Query(..., description="The track ID to scrobble"),
    submission: Optional[bool] = Query(True, description="Whether this is a submission (actual play) or a now playing notification"),
    time: Optional[int] = Query(None, description="The time (in milliseconds since 1 Jan 1970) of the playback event"),
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Scrobble tracks"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Decode the track ID
        try:
            internal_track_id = SubsonicIDMapper.decode_track_id(id)
        except ValueError:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Invalid track ID: {id}")
        
        # Get the track to verify it exists
        track_service = TrackService(db)
        track = track_service.get_track_by_id(internal_track_id)
        
        if not track:
            return create_error_response(SubsonicErrorCodes.DATA_NOT_FOUND, f"Track not found: {id}")
        
        # Get statistics service to handle play count updates
        stats_service = StatisticsService(db)
        
        if submission:
            # This is an actual play submission - update play count and scrobble
            # The time parameter represents when the track was played
            played_at = datetime.fromtimestamp(time / 1000) if time else datetime.now()
            
            # Update play count and scrobble the track
            stats_service.increment_play_count(internal_track_id, user.id, played_at)
        else:
            # This is just a "now playing" notification - not implemented in this basic version
            # In a full implementation, this would update a "now playing" status
            pass
        
        db.commit()
        
        # Return success response
        format_type = (f or 'xml').lower()
        
        response_data = {
            "status": "ok",
            "version": "1.16.1",
            "type": "music-manager",
            "serverVersion": "1.0.0",
            "openSubsonic": True
        }

        return SubsonicResponseFormatter.format_response(response_data, format_type)
    except Exception as e:
        db.rollback()
        return create_error_response(SubsonicErrorCodes.GENERIC, str(e))
    finally:
        db.close()


@router.get("/getNowPlaying",
            summary="Get now playing info",
            description="Returns information about who is currently playing what.")
async def get_now_playing(
    request: Request,
    f: Optional[str] = Query(None, description="Response format: 'xml' or 'json'")
):
    """Get now playing information"""
    try:
        # Authentication required
        user = await get_current_subsonic_user(request)
    except SubsonicError as e:
        return create_error_response(e.code, e.message)
    
    # For this basic implementation, we'll return an empty list
    # as we don't have a real-time "now playing" tracking mechanism
    # In a production system, this would track current play activity
    
    format_type = (f or 'xml').lower()
    
    response_data = {
        "status": "ok",
        "version": "1.16.1",
        "type": "music-manager",
        "serverVersion": "1.0.0",
        "openSubsonic": True,
        "nowPlaying": {
            "entry": []  # No one is currently playing anything in this implementation
        }
    }

    return SubsonicResponseFormatter.format_response(response_data, format_type)