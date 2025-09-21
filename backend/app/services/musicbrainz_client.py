from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


@dataclass
class MusicBrainzRecording:
    title: str
    artist_name: str | None
    album_title: str | None
    release_year: int | None
    score: float | None


class MusicBrainzClient:
    def __init__(self, base_url: str | None = None, user_agent: str | None = None):
        self.base_url = base_url or settings.musicbrainz_api_url
        self.user_agent = user_agent or settings.musicbrainz_user_agent
        self._client = httpx.Client(base_url=self.base_url, headers={"User-Agent": self.user_agent})

    def close(self) -> None:
        self._client.close()

    def search_recordings(
        self,
        *,
        title: str,
        artist: str | None = None,
        limit: int = 5,
    ) -> list[MusicBrainzRecording]:
        params = {
            "query": self._build_query(title=title, artist=artist),
            "fmt": "json",
            "limit": min(max(limit, 1), 25),
        }
        response = self._client.get("/recording", params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        recordings = []
        for item in data.get("recordings", []):
            recordings.append(self._parse_recording(item))
        return recordings

    def _build_query(self, *, title: str, artist: str | None) -> str:
        query_parts = [f'recording:"{title}"']
        if artist:
            query_parts.append(f'artist:"{artist}"')
        return " AND ".join(query_parts)

    def _parse_recording(self, item: dict[str, Any]) -> MusicBrainzRecording:
        title = item.get("title", "")
        artist_credit = item.get("artist-credit", [])
        artist_name = None
        if artist_credit:
            artist_name = artist_credit[0].get("name") or artist_credit[0].get("artist", {}).get("name")

        releases = item.get("releases") or []
        album_title = None
        release_year = None
        if releases:
            album_title = releases[0].get("title")
            release_date = releases[0].get("date") or ""
            if release_date:
                try:
                    release_year = int(release_date.split("-")[0])
                except ValueError:
                    release_year = None

        score = None
        if "score" in item:
            try:
                score = float(item["score"])
            except (TypeError, ValueError):
                score = None

        return MusicBrainzRecording(
            title=title,
            artist_name=artist_name,
            album_title=album_title,
            release_year=release_year,
            score=score,
        )


__all__ = ["MusicBrainzClient", "MusicBrainzRecording"]
