"""Initial schema

Revision ID: 202405201200
Revises: 
Create Date: 2024-05-20 12:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "202405201200"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "artists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sort_name", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.UniqueConstraint("name", name="uq_artist_name"),
    )

    op.create_index("ix_artists_name", "artists", ["name"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "editor", "listener", name="userrole"),
            nullable=False,
            server_default="listener",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_user_email"),
    )


    op.create_table(
        "albums",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("artist_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("release_year", sa.Integer(), nullable=True),
        sa.Column("genre", sa.String(length=120), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["artist_id"], ["artists.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("artist_id", "title", name="uq_album_artist_title"),
    )

    op.create_index("ix_albums_title", "albums", ["title"], unique=False)

    op.create_table(
        "tracks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("artist_id", sa.Integer(), nullable=True),
        sa.Column("album_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("track_number", sa.Integer(), nullable=True),
        sa.Column("disc_number", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("genre", sa.String(length=120), nullable=True),
        sa.Column("file_path", sa.String(length=1024), nullable=False),
        sa.Column("file_hash", sa.String(length=64), nullable=False),
        sa.Column("bit_rate", sa.Integer(), nullable=True),
        sa.Column("sample_rate", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["artist_id"], ["artists.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["album_id"], ["albums.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("file_path", name="uq_track_file_path"),
        sa.UniqueConstraint("file_hash", name="uq_track_file_hash"),
    )

    op.create_index("ix_tracks_title", "tracks", ["title"], unique=False)
    op.create_index("ix_tracks_artist_id", "tracks", ["artist_id"], unique=False)
    op.create_index("ix_tracks_album_id", "tracks", ["album_id"], unique=False)

    op.create_table(
        "playlists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("owner_id", "name", name="uq_playlist_owner_name"),
    )

    op.create_table(
        "playlist_tracks",
        sa.Column("playlist_id", sa.Integer(), nullable=False),
        sa.Column("track_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["playlist_id"], ["playlists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["track_id"], ["tracks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("playlist_id", "track_id"),
        sa.UniqueConstraint("playlist_id", "position", name="uq_playlist_position"),
        sa.UniqueConstraint("playlist_id", "track_id", name="uq_playlist_track"),
    )

    op.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS track_search USING fts5(
            title,
            album,
            artist,
            content='tracks',
            content_rowid='id'
        )
        """
    )

    op.execute(
        """
        CREATE TRIGGER IF NOT EXISTS track_ai AFTER INSERT ON tracks BEGIN
            INSERT INTO track_search(rowid, title, album, artist)
            VALUES (new.id, new.title, (SELECT title FROM albums WHERE id = new.album_id), (SELECT name FROM artists WHERE id = new.artist_id));
        END;
        """
    )

    op.execute(
        """
        CREATE TRIGGER IF NOT EXISTS track_ad AFTER DELETE ON tracks BEGIN
            DELETE FROM track_search WHERE rowid = old.id;
        END;
        """
    )

    op.execute(
        """
        CREATE TRIGGER IF NOT EXISTS track_au AFTER UPDATE ON tracks BEGIN
            UPDATE track_search
            SET title = new.title,
                album = (SELECT title FROM albums WHERE id = new.album_id),
                artist = (SELECT name FROM artists WHERE id = new.artist_id)
            WHERE rowid = new.id;
        END;
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS track_au")
    op.execute("DROP TRIGGER IF EXISTS track_ad")
    op.execute("DROP TRIGGER IF EXISTS track_ai")
    op.execute("DROP TABLE IF EXISTS track_search")
    op.drop_index("ix_tracks_album_id", table_name="tracks")
    op.drop_index("ix_tracks_artist_id", table_name="tracks")
    op.drop_index("ix_tracks_title", table_name="tracks")
    op.drop_table("playlist_tracks")
    op.drop_table("playlists")
    op.drop_table("tracks")
    op.drop_index("ix_albums_title", table_name="albums")
    op.drop_table("albums")
    op.drop_table("users")
    op.drop_index("ix_artists_name", table_name="artists")
    op.drop_table("artists")
