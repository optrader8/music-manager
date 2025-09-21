export interface ApiHealth {
  status: 'ok' | 'degraded' | 'down';
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  name: 'ApiError';
  message: string;
  status?: number;
  cause?: unknown;
  data?: unknown;
  isNetworkError: boolean;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Music data types
export interface Artist {
  id: number;
  name: string;
  bio?: string;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: number;
  title: string;
  artist_id: number;
  artist?: Artist;
  album_artist?: string;
  year?: number;
  genre?: string;
  cover_art_path?: string;
  back_cover_path?: string;
  booklet_path?: string;
  description?: string;
  disc_id?: string;
  total_tracks?: number;
  total_discs?: number;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: number;
  title: string;
  album_id: number;
  album?: Album;
  artist_id: number;
  artist?: Artist;
  track_number?: number;
  disc_number?: number;
  duration?: number;
  file_path: string;
  file_size?: number;
  bitrate?: number;
  sample_rate?: number;
  format?: string;
  performer?: string;
  composer?: string;
  comment?: string;
  id3v1_comment?: string;
  file_hash?: string;
  created_at: string;
  updated_at: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  artist_ids?: number[];
  album_ids?: number[];
  genres?: string[];
  years?: number[];
  formats?: string[];
  min_duration?: number;
  max_duration?: number;
}

export interface SearchResponse<T> extends PaginationResponse<T> {
  filters_applied: SearchFilters;
  search_time_ms: number;
}

// Library stats
export interface LibraryStats {
  total_tracks: number;
  total_albums: number;
  total_artists: number;
  total_size: number;
  total_duration: number;
  last_scan: string;
}
