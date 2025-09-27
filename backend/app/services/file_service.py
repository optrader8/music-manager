import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from mutagen import File as MutagenFile
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TCON, TYER, TRCK

from app.schemas.file import FileItem, DirectoryListing, MP3TagData


class FileService:
    ROOT_PATH = "/mnt/nas-music"

    def __init__(self):
        self._ensure_root_exists()

    def _ensure_root_exists(self):
        """Ensure the root music directory exists."""
        if not os.path.exists(self.ROOT_PATH):
            raise ValueError(f"Music directory {self.ROOT_PATH} does not exist")

    def _validate_path(self, path: str) -> str:
        """Validate and normalize the path to ensure it's within ROOT_PATH."""
        # Resolve any symlinks and normalize
        real_path = os.path.realpath(path)

        # Ensure it's within ROOT_PATH
        if not real_path.startswith(self.ROOT_PATH):
            raise ValueError(f"Access denied: path {path} is outside allowed directory")

        return real_path

    def _get_file_type(self, path: str) -> Optional[str]:
        """Get file type based on extension."""
        ext = Path(path).suffix.lower()
        if ext in ['.mp3', '.flac', '.wav', '.m4a']:
            return 'audio'
        elif ext in ['.jpg', '.jpeg', '.png', '.gif']:
            return 'image'
        elif ext in ['.txt', '.md']:
            return 'text'
        return 'file'

    def _get_permissions(self, path: str) -> str:
        """Get file permissions in octal format."""
        try:
            stat = os.stat(path)
            return oct(stat.st_mode)[-3:]
        except OSError:
            return "000"

    def browse_directory(self, path: str = "", search: Optional[str] = None) -> DirectoryListing:
        """Browse directory contents with optional search."""
        full_path = os.path.join(self.ROOT_PATH, path.lstrip('/'))
        full_path = self._validate_path(full_path)

        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Directory {full_path} does not exist")

        if not os.path.isdir(full_path):
            raise ValueError(f"Path {full_path} is not a directory")

        items = []
        try:
            for entry in os.scandir(full_path):
                if search and search.lower() not in entry.name.lower():
                    continue

                try:
                    stat = entry.stat()
                    item = FileItem(
                        name=entry.name,
                        path=os.path.relpath(entry.path, self.ROOT_PATH),
                        is_directory=entry.is_dir(),
                        size=stat.st_size if not entry.is_dir() else None,
                        modified_time=datetime.fromtimestamp(stat.st_mtime),
                        file_type=self._get_file_type(entry.path) if not entry.is_dir() else None,
                        permissions=self._get_permissions(entry.path)
                    )
                    items.append(item)
                except OSError:
                    # Skip files we can't access
                    continue

            # Sort: directories first, then files, alphabetically
            items.sort(key=lambda x: (not x.is_directory, x.name.lower()))

        except PermissionError:
            raise PermissionError(f"Permission denied accessing {full_path}")

        # Calculate parent path
        parent_path = None
        if path and path != "/":
            parent = os.path.dirname(path.rstrip('/'))
            if parent != path:  # Avoid self-reference
                parent_path = parent if parent else "/"

        return DirectoryListing(
            current_path=path or "/",
            parent_path=parent_path,
            items=items,
            total_items=len(items)
        )

    def delete_file(self, file_path: str) -> None:
        """Delete a file."""
        full_path = os.path.join(self.ROOT_PATH, file_path.lstrip('/'))
        full_path = self._validate_path(full_path)

        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File {full_path} does not exist")

        if os.path.isdir(full_path):
            # For directories, use shutil.rmtree to remove recursively
            shutil.rmtree(full_path)
        else:
            os.remove(full_path)

    def rename_file(self, file_path: str, new_name: str) -> str:
        """Rename a file or directory."""
        full_path = os.path.join(self.ROOT_PATH, file_path.lstrip('/'))
        full_path = self._validate_path(full_path)

        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File {full_path} does not exist")

        # Validate new name
        if not new_name or '/' in new_name or '\\' in new_name:
            raise ValueError("Invalid filename")

        directory = os.path.dirname(full_path)
        new_full_path = os.path.join(directory, new_name)

        # Check if target already exists
        if os.path.exists(new_full_path):
            raise FileExistsError(f"File {new_name} already exists")

        os.rename(full_path, new_full_path)

        # Return new relative path
        return os.path.relpath(new_full_path, self.ROOT_PATH)

    def read_mp3_tags(self, file_path: str) -> MP3TagData:
        """Read MP3 tag data."""
        full_path = os.path.join(self.ROOT_PATH, file_path.lstrip('/'))
        full_path = self._validate_path(full_path)

        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File {full_path} does not exist")

        if not full_path.lower().endswith('.mp3'):
            raise ValueError("File is not an MP3 file")

        try:
            audio = EasyID3(full_path)
            return MP3TagData(
                title=audio.get('title', [None])[0],
                artist=audio.get('artist', [None])[0],
                album=audio.get('album', [None])[0],
                genre=audio.get('genre', [None])[0],
                year=audio.get('date', [None])[0],
                tracknumber=audio.get('tracknumber', [None])[0]
            )
        except Exception as e:
            raise ValueError(f"Failed to read MP3 tags: {str(e)}")

    def update_mp3_tags(self, file_path: str, tag_data: MP3TagData) -> None:
        """Update MP3 tag data."""
        full_path = os.path.join(self.ROOT_PATH, file_path.lstrip('/'))
        full_path = self._validate_path(full_path)

        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File {full_path} does not exist")

        if not full_path.lower().endswith('.mp3'):
            raise ValueError("File is not an MP3 file")

        try:
            audio = EasyID3(full_path)

            # Update tags
            if tag_data.title is not None:
                audio['title'] = tag_data.title
            if tag_data.artist is not None:
                audio['artist'] = tag_data.artist
            if tag_data.album is not None:
                audio['album'] = tag_data.album
            if tag_data.genre is not None:
                audio['genre'] = tag_data.genre
            if tag_data.year is not None:
                audio['date'] = tag_data.year
            if tag_data.tracknumber is not None:
                audio['tracknumber'] = tag_data.tracknumber

            audio.save()

        except Exception as e:
            raise ValueError(f"Failed to update MP3 tags: {str(e)}")


# Global instance
file_service = FileService()