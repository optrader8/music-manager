from fastapi import FastAPI

from app.api.routes import router as api_router
from app.core.config import settings


def create_application() -> FastAPI:
    app = FastAPI(title=settings.project_name, version=settings.version)
    app.include_router(api_router)
    return app


def get_application() -> FastAPI:
    return create_application()


app = get_application()
