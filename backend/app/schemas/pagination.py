"""Shared pagination response schemas."""

from __future__ import annotations

from typing import Generic, Sequence, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedResponse(BaseModel, Generic[T]):
    items: Sequence[T]
    pagination: PaginationMeta


__all__ = ["PaginatedResponse", "PaginationMeta"]
