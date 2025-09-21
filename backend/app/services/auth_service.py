from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, verify_password
from app.db.models.user import User
from app.schemas import Token, UserCreate, UserLogin
from app.services.user_service import UserService


class AuthService:
    def __init__(self, session: Session):
        self.session = session
        self.user_service = UserService(session)

    def authenticate(self, credentials: UserLogin) -> Token:
        user = self.user_service.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise ValueError("Invalid email or password")

        user_id = str(user.id)
        access_token = create_access_token(subject=user_id, role=user.role.value)
        refresh_token = create_refresh_token(subject=user_id, role=user.role.value)
        return Token(access_token=access_token, refresh_token=refresh_token)

    def register(self, user_create: UserCreate) -> User:
        return self.user_service.create(user_create)


__all__ = ["AuthService"]
