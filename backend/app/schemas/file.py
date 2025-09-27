from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class FileItem(BaseModel):
    name: str
    path: str
    is_directory: bool
    size: Optional[int] = None
    modified_time: datetime
    file_type: Optional[str] = None
    permissions: str


class DirectoryListing(BaseModel):
    current_path: str
    parent_path: Optional[str] = None
    items: List[FileItem]
    total_items: int


class RenameRequest(BaseModel):
    new_name: str


class MP3TagData(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[str] = None
    tracknumber: Optional[str] = None


class MP3TagUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[str] = None
    tracknumber: Optional[str] = None