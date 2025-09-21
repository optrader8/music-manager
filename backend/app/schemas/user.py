from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.db.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    display_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


__all__ = ["UserCreate", "UserRead", "UserLogin"]
