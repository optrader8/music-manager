from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings


def create_application() -> FastAPI:
    app = FastAPI(title=settings.project_name, version=settings.version)

    # CORS 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:32001", "http://g2:32001"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)
    return app


def get_application() -> FastAPI:
    return create_application()


app = get_application()
