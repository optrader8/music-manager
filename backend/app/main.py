"""Application entrypoint for FastAPI app used in tests and runtime."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings

ALLOWED_ORIGINS = [
  "http://localhost:32001",
  "http://g2:32001",
  "http://localhost:5173",
]


def create_application() -> FastAPI:
    app = FastAPI(title=settings.project_name, version=settings.version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    return app


def get_application() -> FastAPI:
    return create_application()


app = get_application()

__all__ = ["app", "create_application", "get_application"]
