"""Add smart playlist fields

Revision ID: 202405201230
Revises: 202405201200
Create Date: 2024-05-20 12:30:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "202405201230"
down_revision = "202405201200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "playlists",
        sa.Column("is_smart", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("playlists", sa.Column("smart_filter", sa.JSON(), nullable=True))
    op.execute("UPDATE playlists SET is_smart = 0 WHERE is_smart IS NULL")


def downgrade() -> None:
    op.drop_column("playlists", "smart_filter")
    op.drop_column("playlists", "is_smart")
