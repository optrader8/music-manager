from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models.user import User, UserRole
from app.schemas import UserCreate


class UserService:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        return self.session.query(User).filter(User.email == email).one_or_none()

    def create(self, user_in: UserCreate, *, role: UserRole | None = None) -> User:
        if self.get_by_email(user_in.email):
            raise ValueError("User already exists")

        user = User(
            email=user_in.email,
            display_name=user_in.display_name,
            hashed_password=hash_password(user_in.password),
        )
        if role:
            user.role = role

        self.session.add(user)
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise ValueError("Could not create user") from exc

        self.session.refresh(user)
        return user


__all__ = ["UserService"]
