from fastapi import APIRouter

from .albums import router as albums_router
from .artists import router as artists_router
from .auth import router as auth_router
from .health import router as health_router
from .library import router as library_router
from .streaming import router as streaming_router
from .tracks import router as tracks_router
from .users import router as users_router

router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(tracks_router)
router.include_router(artists_router)
router.include_router(albums_router)
router.include_router(library_router)
router.include_router(streaming_router)

__all__ = ["router"]
