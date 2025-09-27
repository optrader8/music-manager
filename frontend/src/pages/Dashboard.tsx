import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Grid } from 'react-window';
import { apiClient } from '@/services/apiClient';
import { musicService } from '@/services/musicService';
import type { StatsOverview, AlbumSummary, PaginationMeta } from '@/types/stats';

async function fetchOverview(): Promise<StatsOverview> {
  const response = await apiClient.get('/stats/overview');
  return response.data;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const ITEM_WIDTH = 150;
  const ITEM_HEIGHT = 200;
  const GAP = 8;
  const HEADER_HEIGHT = 120;
  const FOOTER_HEIGHT = 60;

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['albums-infinite', searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      musicService.getAlbumsWithPagination({
        page: pageParam,
        page_size: 100,
        search: searchQuery || undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      return lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allAlbums = useMemo(() => {
    if (!albumsData?.pages) return [];
    return albumsData.pages.flatMap((page) => page?.items || []);
  }, [albumsData]);

  const totalAlbums = albumsData?.pages[0]?.pagination?.total || 0;

  // Debug logging
  console.log('Dashboard state:', {
    overviewLoading,
    overviewError,
    overview,
    containerSize,
    allAlbums: allAlbums.length,
    albumsLoading,
    albumsError,
  });

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('albums-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        console.log('Container rect:', rect);
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size update with delay to ensure DOM is rendered
    const timeoutId = setTimeout(updateSize, 100);

    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, [allAlbums.length]); // Re-run when albums data changes

  const columnCount = Math.max(
    1,
    Math.floor((containerSize.width - GAP) / (ITEM_WIDTH + GAP)) || 1
  );
  const rowCount = Math.max(1, Math.ceil(allAlbums.length / columnCount) || 1);

  const gridRef = useRef<any>(null);

  const handleScroll = useCallback(
    ({ scrollTop, scrollHeight, clientHeight }: any) => {
      const threshold = 0.8;
      const scrollRatio = (scrollTop + clientHeight) / scrollHeight;

      if (scrollRatio > threshold && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const AlbumItem = useCallback(
    ({ columnIndex, rowIndex, style, data }: any) => {
      const { allAlbums: albums, columnCount: cols, navigate: nav } = data || {};
      const index = rowIndex * (cols || columnCount) + columnIndex;
      const album = albums ? albums[index] : allAlbums[index];

      if (!album) {
        return (
          <div style={style} className="p-1">
            <div className="w-full h-full bg-gray-100 animate-pulse rounded border border-gray-200"></div>
          </div>
        );
      }

      return (
        <div style={style} className="p-1">
          <div
            className="group cursor-pointer w-full h-full"
            onClick={() => (nav || navigate)(`/albums/${album.id}`)}
          >
            <div className="aspect-square rounded border border-gray-200 overflow-hidden mb-1 bg-gray-100 shadow-sm">
              <img
                src={
                  album.cover_art_url
                    ? `/api/v1${album.cover_art_url}`
                    : `/api/v1/albums/${album.id}/cover?size=medium`
                }
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  `;
                  }
                }}
              />
            </div>
            <div className="text-xs">
              <h3 className="font-medium text-gray-900 truncate leading-tight" title={album.title}>
                {album.title}
              </h3>
              <p
                className="text-gray-600 truncate text-xs leading-tight"
                title={album.artist?.name}
              >
                {album.artist?.name || 'Unknown'}
              </p>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>{album.release_year || '—'}</span>
                <span className="truncate ml-1" title={album.genre || 'Unknown'}>
                  {album.genre || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [allAlbums, columnCount, navigate]
  );

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

  if (albumsLoading && allAlbums.length === 0) {
    return (
      <div className="h-screen flex flex-col">
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
      </div>
    );
  }

  if (albumsError) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Failed to load dashboard data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-none p-6" style={{ height: HEADER_HEIGHT }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>

        {/* Statistics Overview */}
        <div className="bg-white rounded border border-gray-200 px-4 py-2 mb-3">
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

        {/* Search */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Albums ({allAlbums.length.toLocaleString()} loaded)
          </h2>
          <input
            type="text"
            placeholder="Search albums..."
            className="w-64 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Albums Grid */}
      <div className="flex-1 px-6 min-h-0" id="albums-container">
        {containerSize.width > 0 && containerSize.height > 0 && allAlbums.length > 0 ? (
          <Grid
            ref={gridRef}
            columnCount={Math.max(columnCount, 1)}
            columnWidth={ITEM_WIDTH + GAP}
            height={Math.max(containerSize.height - FOOTER_HEIGHT, 200)}
            rowCount={Math.max(
              Math.ceil(
                Math.max(allAlbums.length + (hasNextPage ? columnCount : 0), totalAlbums) /
                  Math.max(columnCount, 1)
              ),
              1
            )}
            rowHeight={ITEM_HEIGHT + GAP}
            width={containerSize.width}
            onScroll={handleScroll}
            itemData={{ allAlbums, columnCount, navigate }}
          >
            {AlbumItem}
          </Grid>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">
              {allAlbums.length === 0 && !albumsLoading ? 'No albums found' : 'Loading albums...'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-none bg-white border-t border-gray-200 px-6 py-3"
        style={{ height: FOOTER_HEIGHT }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {allAlbums.length.toLocaleString()} of {totalAlbums.toLocaleString()} albums
          </div>
          <div className="flex items-center space-x-4">
            {isFetchingNextPage && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading more...</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              {hasNextPage ? 'Scroll to load more' : 'All albums loaded'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
