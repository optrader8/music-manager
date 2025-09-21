from typing import Literal, Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int
    token_type: str
    role: Optional[str] = None


__all__ = ["Token", "TokenPayload"]
