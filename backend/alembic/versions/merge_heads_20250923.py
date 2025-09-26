"""merge multiple heads

Revision ID: merge_heads_20250923
Revises: 202405201230, add_scan_log_tables
Create Date: 2025-09-23 04:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_heads_20250923'
down_revision = ('202405201230', 'add_scan_log_tables')
branch_labels = None
depends_on = None


def upgrade():
    # This is a merge revision, no operations needed
    pass


def downgrade():
    # This is a merge revision, no operations needed
    pass