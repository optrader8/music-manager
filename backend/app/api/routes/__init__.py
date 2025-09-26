from fastapi import APIRouter

from .albums import router as albums_router
from .artists import router as artists_router
from .auth import router as auth_router
from .health import router as health_router
from .library import router as library_router
from .playlists import router as playlists_router
from .stats import router as stats_router
from .streaming import router as streaming_router
from .tracks import router as tracks_router

router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(albums_router)
router.include_router(artists_router)
router.include_router(tracks_router)
router.include_router(playlists_router)
router.include_router(library_router)
router.include_router(streaming_router)
router.include_router(stats_router)

__all__ = ["router"]
