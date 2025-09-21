from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_profile, require_roles
from app.db.models.user import User, UserRole
from app.schemas import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_current_user(profile: UserRead = Depends(get_current_user_profile)) -> UserRead:
    return profile


@router.get("/admin/ping")
async def admin_ping(current_user: User = Depends(require_roles(UserRole.ADMIN))) -> dict[str, str]:
    return {"message": f"admin access granted for {current_user.email}"}
