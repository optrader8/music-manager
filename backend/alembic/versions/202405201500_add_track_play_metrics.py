"""add play count fields to tracks

Revision ID: 202405201500
Revises: merge_heads_20250923
Create Date: 2024-05-20 15:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "202405201500"
down_revision: Union[str, None] = "merge_heads_20250923"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tracks",
        sa.Column("play_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "tracks",
        sa.Column("last_played_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute("UPDATE tracks SET play_count = 0 WHERE play_count IS NULL")


def downgrade() -> None:
    op.drop_column("tracks", "last_played_at")
    op.drop_column("tracks", "play_count")
