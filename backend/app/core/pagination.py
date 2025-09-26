"""Pagination utilities shared across API endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from math import ceil
from typing import Callable

from fastapi import HTTPException, Query, status

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


class PaginationError(HTTPException):
    """Raised when pagination parameters are invalid."""

    def __init__(self, message: str) -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


@dataclass(slots=True)
class PaginationParams:
    """Validated pagination parameters."""

    page: int
    page_size: int
    max_page_size: int = MAX_PAGE_SIZE

    def __post_init__(self) -> None:
        if self.page < 1:
            raise PaginationError("Page must be greater than or equal to 1.")
        if self.page_size < 1:
            raise PaginationError("Page size must be greater than or equal to 1.")
        if self.page_size > self.max_page_size:
            raise PaginationError(
                f"Page size cannot exceed {self.max_page_size}."
            )

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


@dataclass(slots=True)
class PaginationMetaData:
    """Computed pagination metadata for responses."""

    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


def pagination_params(
    *,
    default_page_size: int = DEFAULT_PAGE_SIZE,
    max_page_size: int = MAX_PAGE_SIZE,
) -> Callable[[int, int], PaginationParams]:
    """Factory that returns a FastAPI dependency for pagination parameters."""

    def dependency(
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(
            default_page_size,
            ge=1,
            le=max_page_size,
            description="Number of items per page",
        ),
    ) -> PaginationParams:
        return PaginationParams(
            page=page,
            page_size=page_size,
            max_page_size=max_page_size,
        )

    return dependency


def build_pagination_metadata(
    *, total: int, params: PaginationParams
) -> PaginationMetaData:
    """Create pagination metadata from total count and parameters."""

    total_pages = ceil(total / params.page_size) if total else 0
    has_next = params.page < total_pages
    has_previous = params.page > 1 and total > 0
    return PaginationMetaData(
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_previous=has_previous,
    )


__all__ = [
    "DEFAULT_PAGE_SIZE",
    "MAX_PAGE_SIZE",
    "PaginationError",
    "PaginationMetaData",
    "PaginationParams",
    "build_pagination_metadata",
    "pagination_params",
]
