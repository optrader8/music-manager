"""Subsonic API configuration settings"""
from pydantic import BaseSettings
from typing import Optional


class SubsonicSettings(BaseSettings):
    """Configuration settings for Subsonic API"""
    
    # API settings
    subsonic_enabled: bool = True
    subsonic_api_version: str = "1.16.1"
    subsonic_default_format: str = "xml"
    
    # Caching settings
    subsonic_cache_enabled: bool = True
    subsonic_indexes_cache_ttl: int = 600  # 10 minutes
    subsonic_artists_cache_ttl: int = 600  # 10 minutes
    subsonic_albums_cache_ttl: int = 600   # 10 minutes
    
    # Streaming settings
    subsonic_streaming_enabled: bool = True
    subsonic_range_requests_enabled: bool = True
    
    # Authentication settings
    subsonic_require_auth: bool = True
    subsonic_token_auth_enabled: bool = True
    
    # Feature flags
    subsonic_scrobbling_enabled: bool = True
    subsonic_playlist_enabled: bool = True
    
    class Config:
        env_file = ".env"
        env_prefix = "SUBSONIC_"


# Global instance
subsonic_settings = SubsonicSettings()