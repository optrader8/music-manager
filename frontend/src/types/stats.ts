import type { AudioQuality } from './playback';

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ArtistSummary {
  id: number;
  name: string;
  sort_name?: string | null;
  created_at: string;
}

export interface AlbumSummary {
  id: number;
  title: string;
  artist_id: number;
  release_year?: number | null;
  genre?: string | null;
  created_at: string;
  cover_art_url?: string | null;
  artist?: ArtistSummary | null;
}

export interface TrackPlayStats {
  id: number;
  title: string;
  artist_id?: number | null;
  album_id?: number | null;
  track_number?: number | null;
  disc_number?: number | null;
  genre?: string | null;
  duration_seconds?: number | null;
  file_path: string;
  file_hash: string;
  created_at: string;
  updated_at: string;
  play_count: number;
  last_played_at?: string | null;
  artist?: ArtistSummary | null;
  album?: AlbumSummary | null;
}

export interface TrackPlayStatsResponse {
  items: TrackPlayStats[];
  pagination: PaginationMeta;
}

export interface AlbumListResponse {
  items: AlbumSummary[];
  pagination: PaginationMeta;
}

export interface GenreStats {
  genre: string;
  track_count: number;
  total_duration_seconds: number;
}

export interface ArtistStats {
  name: string;
  track_count: number;
  album_count: number;
}

export interface AlbumStats {
  title: string;
  artist_name?: string | null;
  release_date?: string | null;
  track_count: number;
  total_duration_seconds: number;
  total_duration_minutes: number;
}

export interface QualityStats {
  bitrate_distribution: Array<{
    bitrate: number;
    count: number;
  }>;
  sample_rate_distribution: Array<{
    sample_rate: number;
    count: number;
  }>;
}

export interface StatsOverview {
  total_albums: number;
  total_tracks: number;
  total_artists: number;
  total_duration_seconds: number;
  total_duration_hours: number;
  estimated_size_mb: number;
  average_bitrate?: number | null;
  average_track_duration?: number | null;
  recently_added_at?: string | null;
}

export interface DashboardData {
  overview: StatsOverview;
  recent_albums: AlbumSummary[];
  top_tracks: TrackPlayStats[];
  genre_distribution: GenreStats[];
  scan_status: string;
  scan_progress?: number | null;
  generated_at: string;
}

export interface MostPlayedQueryParams {
  page?: number;
  pageSize?: number;
  quality?: AudioQuality;
}
