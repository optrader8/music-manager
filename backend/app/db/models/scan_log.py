from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, Float
from sqlalchemy.ext.declarative import declarative_base

from app.db.base import Base


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String(1024), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  # 'skipped', 'duplicate', 'error'
    reason = Column(String(255), nullable=False)
    error_message = Column(Text, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_hash = Column(String(64), nullable=True)
    duplicate_of_path = Column(String(1024), nullable=True)
    scan_date = Column(DateTime, default=datetime.utcnow, nullable=False)


class DuplicateFile(Base):
    __tablename__ = "duplicate_files"

    id = Column(Integer, primary_key=True, index=True)
    original_path = Column(String(1024), nullable=False)
    duplicate_path = Column(String(1024), nullable=False, index=True)
    file_hash = Column(String(64), nullable=False, index=True)
    original_size = Column(Integer, nullable=True)
    duplicate_size = Column(Integer, nullable=True)
    original_bitrate = Column(Integer, nullable=True)
    duplicate_bitrate = Column(Integer, nullable=True)
    detected_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_resolved = Column(String(20), default="pending", nullable=False)  # 'pending', 'keep_original', 'keep_duplicate', 'manual'


__all__ = ["ScanLog", "DuplicateFile"]