from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = Field(default="bearer", const=True)


class TokenPayload(BaseModel):
    sub: str
    exp: int
    token_type: str
    role: str | None = None


__all__ = ["Token", "TokenPayload"]
