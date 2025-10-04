import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Grid, type GridImperativeAPI } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { apiClient } from '@/services/apiClient';

interface FolderAlbum {
  path: string;
  name: string;
  cover_path: string | null;
  track_count: number;
  has_cover: boolean;
  parent_path: string;
  depth: number;
}

interface FolderAlbumsResponse {
  items: FolderAlbum[];
  total: number;
  has_cover_count: number;
}

async function fetchFolderAlbums(
  skip: number = 0,
  limit: number = 100,
  search?: string
): Promise<FolderAlbumsResponse> {
  const params = new URLSearchParams();
  params.set('skip', skip.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);

  const response = await apiClient.get<FolderAlbumsResponse>(
    `/folder-albums/?${params.toString()}`
  );
  return response.data;
}

export default function FolderAlbums() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const ITEM_WIDTH = 180;
  const ITEM_HEIGHT = 240;
  const GAP = 12;
  const HEADER_HEIGHT = 140;
  const FOOTER_HEIGHT = 60;

  const {
    data: albumsData,
    isLoading: albumsLoading,
    error: albumsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['folder-albums', searchQuery],
    queryFn: ({ pageParam = 0 }) => fetchFolderAlbums(pageParam, 100, searchQuery || undefined),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.items.length, 0);
      if (loadedCount < lastPage.total) {
        return loadedCount;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  const allAlbums = useMemo(() => {
    if (!albumsData?.pages) return [];
    return albumsData.pages.flatMap((page) => page?.items || []);
  }, [albumsData]);

  const totalAlbums = albumsData?.pages[0]?.total || 0;
  const totalWithCovers = albumsData?.pages[0]?.has_cover_count || 0;

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('folder-albums-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    const timeoutId = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, [allAlbums.length]);

  const columnCount = Math.max(
    1,
    Math.floor((containerSize.width - GAP) / (ITEM_WIDTH + GAP)) || 1
  );

  const gridRef = useRef<GridImperativeAPI>(null);

  const handleCellsRendered = useCallback(
    ({
      rowStartIndex,
      rowStopIndex,
    }: {
      columnStartIndex: number;
      columnStopIndex: number;
      rowStartIndex: number;
      rowStopIndex: number;
    }) => {
      const rowCount = Math.ceil(allAlbums.length / columnCount);
      const threshold = 0.8;

      if (rowStopIndex >= rowCount * threshold && hasNextPage && !isFetchingNextPage) {
        console.log('FolderAlbums: Fetching next page...', { rowStopIndex, rowCount, hasNextPage });
        fetchNextPage();
      }
    },
    [allAlbums.length, columnCount, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const AlbumItem = useCallback(
    ({
      columnIndex,
      rowIndex,
      style,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    }) => {
      const index = rowIndex * columnCount + columnIndex;
      const album = allAlbums[index];

      if (!album) {
        return (
          <div style={style} className="p-1.5">
            <div className="w-full h-full bg-gray-100 animate-pulse rounded border border-gray-200"></div>
          </div>
        );
      }

      const coverUrl = album.cover_path ? `/api/v1/folder-albums/cover/${album.cover_path}` : null;

      return (
        <div style={style} className="p-1.5">
          <div
            className="group cursor-pointer w-full h-full"
            onClick={() => navigate(`/folder-albums/detail?path=${encodeURIComponent(album.path)}`)}
          >
            <div className="aspect-square rounded border border-gray-200 overflow-hidden mb-2 bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                    `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-sm">
              <h3
                className="font-semibold text-gray-900 truncate leading-tight mb-0.5"
                title={album.name}
              >
                {album.name}
              </h3>
              <p className="text-gray-600 text-xs truncate" title={album.parent_path}>
                {album.parent_path.split('/').pop() || 'Root'}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>{album.track_count} tracks</span>
                {album.has_cover && <span className="text-green-600 font-medium">📀 Cover</span>}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [allAlbums, columnCount, navigate]
  );

  if (albumsLoading && allAlbums.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Folder Albums</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Folder Albums</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Failed to load albums</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-none p-6" style={{ height: HEADER_HEIGHT }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Folder Albums</h1>

        {/* Statistics */}
        <div className="bg-white rounded border border-gray-200 px-4 py-3 mb-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Total Albums:</span>
              <span className="text-lg font-bold text-gray-900">
                {totalAlbums.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">With Covers:</span>
              <span className="text-lg font-bold text-green-600">
                {totalWithCovers.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                ({totalAlbums > 0 ? Math.round((totalWithCovers / totalAlbums) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Loaded:</span>
              <span className="text-lg font-bold text-blue-600">
                {allAlbums.length.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Browse Albums</h2>
          <input
            type="text"
            placeholder="Search folder albums..."
            className="w-80 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Albums Grid */}
      <div className="flex-1 px-6 min-h-0" id="folder-albums-container">
        {containerSize.width > 0 && containerSize.height > 0 && allAlbums.length > 0 ? (
          <Grid
            gridRef={gridRef}
            columnCount={Math.max(columnCount, 1)}
            columnWidth={ITEM_WIDTH + GAP}
            defaultHeight={Math.max(containerSize.height - FOOTER_HEIGHT, 200)}
            rowCount={Math.ceil(Math.max(allAlbums.length, totalAlbums) / Math.max(columnCount, 1))}
            rowHeight={ITEM_HEIGHT + GAP}
            defaultWidth={containerSize.width}
            onCellsRendered={handleCellsRendered}
            overscanCount={5}
            cellProps={{}}
            cellComponent={AlbumItem}
          />
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
