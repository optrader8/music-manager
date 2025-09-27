import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
  Album,
  Track,
  Artist,
  AlbumWithTracks,
  TrackWithRelations,
  LibraryStats,
  PaginationResponse,
  SearchFilters,
} from '../types/api';

// API 베이스 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터: 모든 요청에 JWT 토큰을 포함시킵니다.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 Unauthorized 오류 발생 시 처리
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // 필요 시 로그인 페이지로 리디렉션
      // window.location.href = '/login';
    }
    console.error('API 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Music API functions
export const musicAPI = {
  // Albums
  getAlbums: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    genre?: string;
    artist_id?: number;
  }): Promise<PaginationResponse<Album>> => {
    const response = await api.get<PaginationResponse<Album>>('/albums', { params });
    return response.data;
  },

  getAlbum: async (id: number): Promise<AlbumWithTracks> => {
    const response = await api.get<AlbumWithTracks>(`/albums/${id}`);
    return response.data;
  },

  // Tracks
  getTracks: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    album_id?: number;
    artist_id?: number;
  }): Promise<PaginationResponse<Track>> => {
    const response = await api.get<PaginationResponse<Track>>('/tracks', { params });
    return response.data;
  },

  getTrack: async (id: number): Promise<TrackWithRelations> => {
    const response = await api.get<TrackWithRelations>(`/tracks/${id}`);
    return response.data;
  },

  // Artists
  getArtists: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<PaginationResponse<Artist>> => {
    const response = await api.get<PaginationResponse<Artist>>('/artists', { params });
    return response.data;
  },

  getArtist: async (id: number): Promise<Artist> => {
    const response = await api.get<Artist>(`/artists/${id}`);
    return response.data;
  },

  // Search
  search: async (query: string, filters?: SearchFilters): Promise<Record<string, unknown>> => {
    const params = { query, ...filters };
    const response = await api.get('/search', { params });
    return response.data;
  },

  // Library
  getLibraryStats: async (): Promise<LibraryStats> => {
    const response = await api.get<LibraryStats>('/library/stats');
    return response.data;
  },
};

export default api;
