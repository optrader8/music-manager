"""Add scan log and duplicate file tables

Revision ID: add_scan_log_tables
Revises:
Create Date: 2025-09-23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_scan_log_tables'
down_revision = None  # Update this if there are previous migrations
branch_labels = None
depends_on = None


def upgrade():
    # Create scan_logs table
    op.create_table('scan_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=1024), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_hash', sa.String(length=64), nullable=True),
        sa.Column('duplicate_of_path', sa.String(length=1024), nullable=True),
        sa.Column('scan_date', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scan_logs_id'), 'scan_logs', ['id'], unique=False)
    op.create_index(op.f('ix_scan_logs_file_path'), 'scan_logs', ['file_path'], unique=False)
    op.create_index(op.f('ix_scan_logs_status'), 'scan_logs', ['status'], unique=False)

    # Create duplicate_files table
    op.create_table('duplicate_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('original_path', sa.String(length=1024), nullable=False),
        sa.Column('duplicate_path', sa.String(length=1024), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False),
        sa.Column('original_size', sa.Integer(), nullable=True),
        sa.Column('duplicate_size', sa.Integer(), nullable=True),
        sa.Column('original_bitrate', sa.Integer(), nullable=True),
        sa.Column('duplicate_bitrate', sa.Integer(), nullable=True),
        sa.Column('detected_date', sa.DateTime(), nullable=False),
        sa.Column('is_resolved', sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_duplicate_files_id'), 'duplicate_files', ['id'], unique=False)
    op.create_index(op.f('ix_duplicate_files_duplicate_path'), 'duplicate_files', ['duplicate_path'], unique=False)
    op.create_index(op.f('ix_duplicate_files_file_hash'), 'duplicate_files', ['file_hash'], unique=False)


def downgrade():
    # Drop tables
    op.drop_index(op.f('ix_duplicate_files_file_hash'), table_name='duplicate_files')
    op.drop_index(op.f('ix_duplicate_files_duplicate_path'), table_name='duplicate_files')
    op.drop_index(op.f('ix_duplicate_files_id'), table_name='duplicate_files')
    op.drop_table('duplicate_files')

    op.drop_index(op.f('ix_scan_logs_status'), table_name='scan_logs')
    op.drop_index(op.f('ix_scan_logs_file_path'), table_name='scan_logs')
    op.drop_index(op.f('ix_scan_logs_id'), table_name='scan_logs')
    op.drop_table('scan_logs')