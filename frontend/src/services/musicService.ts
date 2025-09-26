import { apiClient } from './apiClient';
import type {
  PaginationParams,
  PaginationResponse,
  SearchFilters,
  SearchResponse,
  Album,
  Artist,
  Track,
  LibraryStats,
} from '../types/api';
import type { AudioQuality, PlaybackQueue } from '../types/playback';

export const musicService = {
  // Library stats
  async getLibraryStats(): Promise<LibraryStats> {
    const response = await apiClient.get<LibraryStats>('/api/v1/library/stats');
    return response.data;
  },

  // Albums
  async getAlbums(params: PaginationParams & SearchFilters): Promise<PaginationResponse<Album>> {
    const response = await apiClient.get<PaginationResponse<Album>>('/api/v1/albums', { params });
    return response.data;
  },

  async getAlbum(id: number): Promise<Album> {
    const response = await apiClient.get<Album>(`/api/v1/albums/${id}`);
    return response.data;
  },

  async searchAlbums(params: PaginationParams & SearchFilters): Promise<SearchResponse<Album>> {
    const response = await apiClient.get<SearchResponse<Album>>('/api/v1/albums/search', {
      params,
    });
    return response.data;
  },

  // Artists
  async getArtists(params: PaginationParams & SearchFilters): Promise<PaginationResponse<Artist>> {
    const response = await apiClient.get<PaginationResponse<Artist>>('/api/v1/artists', { params });
    return response.data;
  },

  async getArtist(id: number): Promise<Artist> {
    const response = await apiClient.get<Artist>(`/api/v1/artists/${id}`);
    return response.data;
  },

  // Tracks
  async getTracks(params: PaginationParams & SearchFilters): Promise<PaginationResponse<Track>> {
    const response = await apiClient.get<PaginationResponse<Track>>('/api/v1/tracks', { params });
    return response.data;
  },

  async getTrack(id: number): Promise<Track> {
    const response = await apiClient.get<Track>(`/api/v1/tracks/${id}`);
    return response.data;
  },

  async getAlbumTracks(
    albumId: number,
    params?: PaginationParams
  ): Promise<PaginationResponse<Track>> {
    const response = await apiClient.get<PaginationResponse<Track>>(
      `/api/v1/albums/${albumId}/tracks`,
      {
        params,
      }
    );
    return response.data;
  },

  async getAlbumPlaybackQueue(
    albumId: number,
    options?: { quality?: AudioQuality; crossfadeSeconds?: number; gapless?: boolean }
  ): Promise<PlaybackQueue> {
    const params = new URLSearchParams();
    if (options?.quality) params.set('quality', options.quality);
    if (typeof options?.crossfadeSeconds === 'number') {
      params.set('crossfade_seconds', String(options.crossfadeSeconds));
    }
    if (typeof options?.gapless === 'boolean') {
      params.set('gapless', String(options.gapless));
    }
    const response = await apiClient.get<PlaybackQueue>(`/api/v1/stream/albums/${albumId}/queue`, {
      params,
    });
    return response.data;
  },

  // Streaming
  getStreamUrl(trackId: number, quality: AudioQuality = 'original'): string {
    const base = `${apiClient.defaults.baseURL}/api/v1/stream/tracks/${trackId}`;
    if (quality === 'original') {
      return base;
    }
    const url = new URL(base, apiClient.defaults.baseURL);
    url.searchParams.set('quality', quality);
    return url.toString();
  },

  // Album artwork
  getAlbumArtworkUrl(albumId: number, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
    return `${apiClient.defaults.baseURL}/api/v1/albums/${albumId}/cover?size=${size}`;
  },

  // Library scanning
  async scanLibrary(): Promise<{ message: string; task_id: string }> {
    const response = await apiClient.post<{ message: string; task_id: string }>(
      '/api/v1/library/scan'
    );
    return response.data;
  },

  async getScanStatus(
    taskId: string
  ): Promise<{ status: string; progress?: number; message?: string }> {
    const response = await apiClient.get<{ status: string; progress?: number; message?: string }>(
      `/api/v1/library/scan/${taskId}`
    );
    return response.data;
  },
};
