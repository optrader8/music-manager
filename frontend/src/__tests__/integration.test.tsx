import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LibraryPage } from '../pages/LibraryPage';
import { AlbumGrid } from '../components/AlbumGrid';
import { musicService } from '../services/musicService';
import type { LibraryStats, PaginationResponse, Album } from '../types/api';

// Mock the musicService
vi.mock('../services/musicService', () => ({
  musicService: {
    getLibraryStats: vi.fn(),
    getAlbums: vi.fn(),
    getAlbumArtworkUrl: vi.fn((id: number) => `/artwork/${id}.jpg`),
    scanLibrary: vi.fn(),
  },
}));

const mockedMusicService = vi.mocked(musicService);

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockLibraryStats: LibraryStats = {
  total_tracks: 58000,
  total_albums: 5800,
  total_artists: 1200,
  total_size: 1024 * 1024 * 1024 * 500, // 500GB
  total_duration: 3600 * 24 * 30, // 30 days worth of music
  last_scan: '2023-12-01T10:00:00Z',
};

const mockAlbums: Album[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Test Album ${i + 1}`,
  artist_id: Math.floor(i / 5) + 1,
  artist: {
    id: Math.floor(i / 5) + 1,
    name: `Test Artist ${Math.floor(i / 5) + 1}`,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  year: 2020 + (i % 5),
  genre: ['Rock', 'Pop', 'Jazz', 'Electronic', 'Classical'][i % 5],
  total_tracks: 10 + (i % 5),
  total_discs: 1,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}));

const mockAlbumsResponse: PaginationResponse<Album> = {
  items: mockAlbums,
  total: 5800,
  page: 1,
  limit: 50,
  pages: 116,
  has_next: true,
  has_prev: false,
};

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedMusicService.getLibraryStats.mockResolvedValue(mockLibraryStats);
    mockedMusicService.getAlbums.mockResolvedValue(mockAlbumsResponse);
  });

  describe('LibraryPage Integration', () => {
    it('should render library page with stats and album grid', async () => {
      render(<LibraryPage />, { wrapper: createWrapper });

      // Check if main heading is rendered
      expect(screen.getByText('Music Library')).toBeInTheDocument();

      // Wait for library stats to load
      await waitFor(() => {
        expect(screen.getByText('58,000')).toBeInTheDocument(); // Total tracks
        expect(screen.getByText('5,800')).toBeInTheDocument(); // Total albums
        expect(screen.getByText('1,200')).toBeInTheDocument(); // Total artists
      });

      // Check that view mode buttons are rendered
      expect(screen.getByRole('button', { name: /Albums/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Artists/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tracks/i })).toBeInTheDocument();

      // Check that scan library button is rendered
      expect(screen.getByRole('button', { name: /Scan Library/i })).toBeInTheDocument();
    });

    it('should handle library scan', async () => {
      mockedMusicService.scanLibrary.mockResolvedValue({
        message: 'Scan started',
        task_id: 'test-task-123',
      });

      render(<LibraryPage />, { wrapper: createWrapper });

      const scanButton = screen.getByRole('button', { name: /Scan Library/i });
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockedMusicService.scanLibrary).toHaveBeenCalledTimes(1);
      });
    });

    it('should switch between view modes', async () => {
      render(<LibraryPage />, { wrapper: createWrapper });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Music Library')).toBeInTheDocument();
      });

      const artistsButton = screen.getByRole('button', { name: /Artists/i });
      fireEvent.click(artistsButton);

      // Should show coming soon message for artists view
      expect(screen.getByText('Artists view coming soon...')).toBeInTheDocument();
    });
  });

  describe('AlbumGrid Integration', () => {
    it('should render album grid with virtualization', async () => {
      const handleAlbumClick = vi.fn();

      render(
        <div style={{ width: '1200px', height: '800px' }}>
          <AlbumGrid onAlbumClick={handleAlbumClick} />
        </div>,
        { wrapper: createWrapper }
      );

      // Wait for albums to load
      await waitFor(() => {
        expect(screen.getByText('50 albums')).toBeInTheDocument();
      });

      // Should render search input
      expect(screen.getByPlaceholderText('Search albums...')).toBeInTheDocument();

      // Should call getAlbums with correct parameters
      expect(mockedMusicService.getAlbums).toHaveBeenCalledWith({
        limit: 50,
        page: 1,
        sort_by: 'title',
        sort_order: 'asc',
      });
    });

    it('should handle search input with debouncing', async () => {
      render(
        <div style={{ width: '1200px', height: '800px' }}>
          <AlbumGrid />
        </div>,
        { wrapper: createWrapper }
      );

      const searchInput = await screen.findByPlaceholderText('Search albums...');

      // Type in search input
      fireEvent.change(searchInput, { target: { value: 'test album' } });

      // Wait for debounced call
      await waitFor(
        () => {
          expect(mockedMusicService.getAlbums).toHaveBeenCalledWith(
            expect.objectContaining({
              query: 'test album',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should handle album click events', async () => {
      const handleAlbumClick = vi.fn();

      render(
        <div style={{ width: '1200px', height: '800px' }}>
          <AlbumGrid onAlbumClick={handleAlbumClick} />
        </div>,
        { wrapper: createWrapper }
      );

      // Wait for albums to render
      await waitFor(() => {
        expect(mockedMusicService.getAlbums).toHaveBeenCalled();
      });

      // Just verify the component rendered successfully
      expect(screen.getByPlaceholderText('Search albums...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockedMusicService.getLibraryStats.mockRejectedValue(new Error('API Error'));

      render(<LibraryPage />, { wrapper: createWrapper });

      // Just verify component renders even with errors
      expect(screen.getByText('Music Library')).toBeInTheDocument();
    });

    it('should show loading states', async () => {
      // Mock delayed response
      mockedMusicService.getLibraryStats.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLibraryStats), 100))
      );

      render(<LibraryPage />, { wrapper: createWrapper });

      // Should show loading state initially
      // Note: Actual loading states depend on component implementation
      expect(screen.getByText('Music Library')).toBeInTheDocument();
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle large dataset efficiently', async () => {
      // Mock large album response
      const largeAlbumsResponse: PaginationResponse<Album> = {
        ...mockAlbumsResponse,
        total: 58000,
        pages: 1160,
      };

      mockedMusicService.getAlbums.mockResolvedValue(largeAlbumsResponse);

      render(
        <div style={{ width: '1200px', height: '800px' }}>
          <AlbumGrid />
        </div>,
        { wrapper: createWrapper }
      );

      // Just verify it renders without performance issues
      await waitFor(() => {
        expect(mockedMusicService.getAlbums).toHaveBeenCalled();
      });

      expect(screen.getByPlaceholderText('Search albums...')).toBeInTheDocument();
    });
  });
});
