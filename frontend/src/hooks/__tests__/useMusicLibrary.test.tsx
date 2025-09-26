import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLibraryStats, useAlbums } from '../useMusicLibrary';
import { musicService } from '../../services/musicService';
import type { LibraryStats, PaginationResponse, Album } from '../../types/api';

// Mock the musicService
vi.mock('../../services/musicService', () => ({
  musicService: {
    getLibraryStats: vi.fn(),
    getAlbums: vi.fn(),
  },
}));

const mockedMusicService = vi.mocked(musicService);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMusicLibrary hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLibraryStats', () => {
    it('should fetch library stats successfully', async () => {
      const mockStats: LibraryStats = {
        total_tracks: 1000,
        total_albums: 100,
        total_artists: 50,
        total_size: 1024 * 1024 * 1024, // 1GB
        total_duration: 3600 * 10, // 10 hours
        last_scan: '2023-01-01T00:00:00Z',
      };

      mockedMusicService.getLibraryStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(mockedMusicService.getLibraryStats).toHaveBeenCalledTimes(1);
    });

    it('should handle library stats fetch error', async () => {
      const error = new Error('Failed to fetch stats');
      mockedMusicService.getLibraryStats.mockRejectedValue(error);

      const { result } = renderHook(() => useLibraryStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useAlbums', () => {
    it('should fetch albums with pagination parameters', async () => {
      const mockResponse: PaginationResponse<Album> = {
        items: [
          {
            id: 1,
            title: 'Test Album',
            artist_id: 1,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
        has_next: false,
        has_prev: false,
      };

      mockedMusicService.getAlbums.mockResolvedValue(mockResponse);

      const params = {
        page: 1,
        limit: 20,
        sort_by: 'title',
        sort_order: 'asc' as const,
      };

      const { result } = renderHook(() => useAlbums(params), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockedMusicService.getAlbums).toHaveBeenCalledWith(params);
    });

    it('should handle albums fetch error', async () => {
      const error = new Error('Failed to fetch albums');
      mockedMusicService.getAlbums.mockRejectedValue(error);

      const params = {
        page: 1,
        limit: 20,
      };

      const { result } = renderHook(() => useAlbums(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});
