from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from watchdog.events import FileSystemEvent, PatternMatchingEventHandler
from watchdog.observers import Observer

from app.services.file_scanner_service import SUPPORTED_EXTENSIONS

LibraryCallback = Callable[[str, Path], None]


class _LibraryEventHandler(PatternMatchingEventHandler):
    def __init__(self, callback: LibraryCallback):
        patterns = [f"*{ext}" for ext in SUPPORTED_EXTENSIONS]
        super().__init__(patterns=patterns, ignore_directories=True)
        self._callback = callback

    def on_created(self, event: FileSystemEvent) -> None:
        self._callback("created", Path(event.src_path))

    def on_modified(self, event: FileSystemEvent) -> None:
        self._callback("modified", Path(event.src_path))

    def on_deleted(self, event: FileSystemEvent) -> None:
        self._callback("deleted", Path(event.src_path))


class LibraryWatcher:
    def __init__(self, library_path: Path, callback: LibraryCallback):
        self.library_path = Path(library_path)
        self._callback = callback
        self._observer = Observer()
        self._event_handler = _LibraryEventHandler(callback)
        self._is_running = False

    def start(self) -> None:
        if self._is_running:
            return
        self._observer.schedule(self._event_handler, str(self.library_path), recursive=True)
        self._observer.start()
        self._is_running = True

    def stop(self) -> None:
        if not self._is_running:
            return
        self._observer.stop()
        self._observer.join(timeout=5)
        self._is_running = False

    def is_running(self) -> bool:
        return self._is_running


__all__ = ["LibraryWatcher"]
