"""Subsonic API caching utilities"""
import time
import hashlib
from typing import Any, Optional
from functools import wraps


class BasicCache:
    """A basic in-memory cache for Subsonic API responses"""
    def __init__(self, default_ttl: int = 300):  # 5 minutes default TTL
        self.cache = {}
        self.default_ttl = default_ttl
    
    def _get_key(self, *args, **kwargs) -> str:
        """Generate a cache key from arguments"""
        key_str = f"{args}_{sorted(kwargs.items())}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if it exists and hasn't expired"""
        if key in self.cache:
            value, expiry = self.cache[key]
            if time.time() < expiry:
                return value
            else:
                # Remove expired entry
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL"""
        expiry = time.time() + (ttl or self.default_ttl)
        self.cache[key] = (value, expiry)
    
    def delete(self, key: str) -> None:
        """Delete value from cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self.cache.clear()


# Global cache instance
subsonic_cache = BasicCache()


def cached(ttl: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__name__}_{hashlib.md5(str((args, sorted(kwargs.items()))).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_result = subsonic_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            subsonic_cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator


# Example specific caches for different Subsonic API responses
indexes_cache = BasicCache(default_ttl=600)  # 10 minutes for indexes
artists_cache = BasicCache(default_ttl=600)   # 10 minutes for artists
albums_cache = BasicCache(default_ttl=600)    # 10 minutes for albums
playlists_cache = BasicCache(default_ttl=300) # 5 minutes for playlists