"""Subsonic API routes initialization"""
from fastapi import APIRouter
from . import system, browsing, streaming, playlists, search, scrobbling

router = APIRouter(prefix="/rest")

# Include all Subsonic API routers
router.include_router(system.router)
router.include_router(browsing.router)
router.include_router(streaming.router)
router.include_router(playlists.router)
router.include_router(search.router)
router.include_router(scrobbling.router)