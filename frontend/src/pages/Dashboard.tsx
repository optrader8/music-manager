import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { musicService } from '@/services/musicService';
import type { StatsOverview } from '@/types/stats';

async function fetchOverview(): Promise<StatsOverview> {
  const response = await apiClient.get('/stats/overview');
  return response.data;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 48;

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: fetchOverview,
    retry: 1,
  });

  const {
    data: albumsData,
    isLoading: albumsLoading,
    error: albumsError,
  } = useQuery({
    queryKey: ['albums', currentPage, searchQuery],
    queryFn: () =>
      musicService.getAlbumsWithPagination({
        page: currentPage,
        page_size: PAGE_SIZE,
        search: searchQuery || undefined,
      }),
    keepPreviousData: true,
  });

  const albums = albumsData?.items || [];
  const totalAlbums = albumsData?.pagination?.total || 0;
  const totalPages = Math.ceil(totalAlbums / PAGE_SIZE);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  if (overviewLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  if (albumsError) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load albums</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>

      {/* Statistics Overview */}
      <div className="bg-white rounded border border-gray-200 px-4 py-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-600">Tracks:</span>
            <span className="text-sm font-bold text-gray-900">
              {overview?.total_tracks?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-600">Artists:</span>
            <span className="text-sm font-bold text-gray-900">
              {overview?.total_artists?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-600">Albums:</span>
            <span className="text-sm font-bold text-gray-900">
              {totalAlbums?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-600">Time:</span>
            <span className="text-sm font-bold text-gray-900">
              {overview?.total_duration_hours
                ? `${Math.round(overview.total_duration_hours)}h`
                : '0h'}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Pagination */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages} ({albums.length} albums)
        </div>
        <input
          type="text"
          placeholder="Search albums..."
          className="w-64 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Albums Grid */}
      {albumsLoading ? (
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <div key={i} className="w-full">
              <div className="aspect-square bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group cursor-pointer"
              onClick={() => navigate(`/albums/${album.id}`)}
            >
              <div className="aspect-square rounded border border-gray-200 overflow-hidden mb-1 bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={
                    album.cover_art_url
                      ? `/api/v1${album.cover_art_url}`
                      : `/api/v1/albums/${album.id}/cover?size=small`
                  }
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    target.style.display = 'none';
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="text-xs">
                <h3
                  className="font-medium text-gray-900 truncate leading-tight"
                  title={album.title}
                >
                  {album.title}
                </h3>
                <p
                  className="text-gray-600 truncate text-xs leading-tight"
                  title={album.artist?.name}
                >
                  {album.artist?.name || 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">No albums found</div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          Prev
        </button>
        <span className="px-4 py-1 text-sm">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          Last
        </button>
      </div>
    </div>
  );
}
