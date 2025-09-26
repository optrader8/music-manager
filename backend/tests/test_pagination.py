"""Tests for pagination utilities."""

import pytest
from app.core.pagination import (
    PaginationParams,
    build_pagination_metadata,
    PaginationError,
)


class TestPaginationParams:
    """Test PaginationParams validation."""

    def test_valid_params(self):
        """Test valid pagination parameters."""
        params = PaginationParams(page=2, page_size=20, max_page_size=100)
        assert params.page == 2
        assert params.page_size == 20
        assert params.max_page_size == 100
        assert params.offset == 20

    def test_invalid_page(self):
        """Test invalid page number."""
        with pytest.raises(PaginationError, match="Page must be greater than or equal to 1"):
            PaginationParams(page=0)

    def test_invalid_page_size(self):
        """Test invalid page size."""
        with pytest.raises(PaginationError, match="Page size must be greater than or equal to 1"):
            PaginationParams(page=1, page_size=0)

    def test_page_size_too_large(self):
        """Test page size exceeding maximum."""
        with pytest.raises(PaginationError, match="Page size cannot exceed 50"):
            PaginationParams(page=1, page_size=100, max_page_size=50)


class TestBuildPaginationMetadata:
    """Test pagination metadata building."""

    def test_basic_metadata(self):
        """Test basic pagination metadata."""
        params = PaginationParams(page=1, page_size=10)
        meta = build_pagination_metadata(total=25, params=params)

        assert meta.page == 1
        assert meta.page_size == 10
        assert meta.total == 25
        assert meta.total_pages == 3
        assert meta.has_next is True
        assert meta.has_previous is False

    def test_last_page(self):
        """Test metadata for last page."""
        params = PaginationParams(page=3, page_size=10)
        meta = build_pagination_metadata(total=25, params=params)

        assert meta.page == 3
        assert meta.has_next is False
        assert meta.has_previous is True

    def test_single_page(self):
        """Test metadata when all items fit on one page."""
        params = PaginationParams(page=1, page_size=50)
        meta = build_pagination_metadata(total=25, params=params)

        assert meta.total_pages == 1
        assert meta.has_next is False
        assert meta.has_previous is False

    def test_empty_results(self):
        """Test metadata with no results."""
        params = PaginationParams(page=1, page_size=10)
        meta = build_pagination_metadata(total=0, params=params)

        assert meta.total == 0
        assert meta.total_pages == 0
        assert meta.has_next is False
        assert meta.has_previous is False