from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from .album import Album
    from .artist import Artist
    from .playlist import PlaylistTrack


class Track(Base):
    __tablename__ = "tracks"
    __table_args__ = (
        UniqueConstraint("file_path", name="uq_track_file_path"),
        UniqueConstraint("file_hash", name="uq_track_file_hash"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    artist_id: Mapped[int | None] = mapped_column(
        ForeignKey("artists.id", ondelete="SET NULL"), nullable=True, index=True
    )
    album_id: Mapped[int | None] = mapped_column(
        ForeignKey("albums.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    track_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    disc_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    genre: Mapped[str | None] = mapped_column(String(120), nullable=True)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    bit_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sample_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    artist: Mapped["Artist" | None] = relationship("Artist", back_populates="tracks")
    album: Mapped["Album" | None] = relationship("Album", back_populates="tracks")
    playlist_entries: Mapped[list["PlaylistTrack"]] = relationship(
        "PlaylistTrack", back_populates="track", cascade="all,delete"
    )


__all__ = ["Track"]
