from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(*, subject: str, expires_delta: timedelta, token_type: TokenType, role: str | None) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "token_type": token_type.value,
    }
    if role:
        to_encode["role"] = role
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_access_token(*, subject: str, role: str | None = None) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return _create_token(subject=subject, expires_delta=expires_delta, token_type=TokenType.ACCESS, role=role)


def create_refresh_token(*, subject: str, role: str | None = None) -> str:
    expires_delta = timedelta(minutes=settings.refresh_token_expire_minutes)
    return _create_token(subject=subject, expires_delta=expires_delta, token_type=TokenType.REFRESH, role=role)


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:  # pragma: no cover - jose provides meaningful message
        raise ValueError("Invalid token") from exc
    return payload


__all__ = [
    "TokenType",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "hash_password",
    "verify_password",
]
