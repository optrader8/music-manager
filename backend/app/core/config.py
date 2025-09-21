from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str = "Music Manager API"
    version: str = "0.1.0"
    database_url: str = "sqlite:///./music_manager.db"
    music_library_path: Path = Path("/mnt/nas-music")
    secret_key: str = "super-secret-key-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_minutes: int = 60 * 24 * 3  # 3 days
    musicbrainz_api_url: str = "https://musicbrainz.org/ws/2"
    musicbrainz_user_agent: str = "MusicManager/0.1.0 (music-manager@local)"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
