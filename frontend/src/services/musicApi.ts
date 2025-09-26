import { apiClient } from './apiClient';
import type {
  AlbumListResponse,
  AlbumStats,
  ArtistStats,
  DashboardData,
  GenreStats,
  QualityStats,
  StatsOverview,
  TrackPlayStatsResponse,
} from '@/types/stats';

export const fetchStatsOverview = async (): Promise<StatsOverview> => {
  const { data } = await apiClient.get<StatsOverview>('/api/v1/stats/overview');
  return data;
};

export const fetchGenreStats = async (): Promise<GenreStats[]> => {
  const { data } = await apiClient.get<GenreStats[]>('/api/v1/stats/genres');
  return data;
};

export const fetchArtistStats = async (): Promise<ArtistStats[]> => {
  const { data } = await apiClient.get<ArtistStats[]>('/api/v1/stats/artists');
  return data;
};

export const fetchAlbumStats = async (): Promise<AlbumStats[]> => {
  const { data } = await apiClient.get<AlbumStats[]>('/api/v1/stats/albums');
  return data;
};

export const fetchQualityStats = async (): Promise<QualityStats> => {
  const { data } = await apiClient.get<QualityStats>('/api/v1/stats/quality');
  return data;
};

export const fetchRecentAlbums = async (page = 1, pageSize = 12): Promise<AlbumListResponse> => {
  const { data } = await apiClient.get<AlbumListResponse>('/api/v1/stats/recent-albums', {
    params: { page, page_size: pageSize },
  });
  return data;
};

export const fetchMostPlayedTracks = async (
  page = 1,
  pageSize = 10
): Promise<TrackPlayStatsResponse> => {
  const { data } = await apiClient.get<TrackPlayStatsResponse>('/api/v1/stats/most-played', {
    params: { page, page_size: pageSize },
  });
  return data;
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const { data } = await apiClient.get<DashboardData>('/api/v1/stats/dashboard');
  return data;
};
