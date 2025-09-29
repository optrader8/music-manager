from fastapi import Depends, HTTPException, status
from app.core.dependencies import get_current_active_user, require_roles
from app.db.models.user import User, UserRole


def get_current_admin_user(current_user: User = Depends(require_roles(UserRole.ADMIN))) -> User:
    """Dependency to get current admin user."""
    return current_user


def get_current_user_optional() -> dict:
    """Temporary dependency for file operations when authentication is not required."""
    # For now, return a dummy user since authentication is not fully implemented
    return {"id": 1, "role": "admin"}