from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

from app.services.library_watcher import LibraryWatcher


@pytest.fixture()
def mock_observer(monkeypatch):
    observer_mock = MagicMock()
    monkeypatch.setattr("app.services.library_watcher.Observer", MagicMock(return_value=observer_mock))
    return observer_mock


def test_watcher_start_schedules_and_starts(mock_observer):
    callback = MagicMock()
    watcher = LibraryWatcher(Path("/music"), callback)

    watcher.start()

    assert watcher.is_running() is True
    mock_observer.schedule.assert_called_once()
    mock_observer.start.assert_called_once()


def test_watcher_stop_handles_multiple_calls(mock_observer):
    callback = MagicMock()
    watcher = LibraryWatcher(Path("/music"), callback)

    watcher.start()
    watcher.stop()
    watcher.stop()  # second call should be a no-op

    assert watcher.is_running() is False
    mock_observer.stop.assert_called_once()
    mock_observer.join.assert_called_once_with(timeout=5)
