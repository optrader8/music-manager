import React, { useState, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { AlbumCard } from './AlbumCard';
import { Input } from './ui/input';
import { useInfiniteAlbums } from '../hooks/useMusicLibrary';
import { debounce } from '../lib/utils';
import { ALBUM_CARD_WIDTH, ALBUM_CARD_HEIGHT, GRID_PADDING, DEFAULT_PAGE_SIZE } from '../constants';
import type { Album, SearchFilters } from '../types/api';

interface AlbumGridProps {
  onAlbumClick?: (album: Album) => void;
  initialFilters?: SearchFilters;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    albums: Album[];
    columnsCount: number;
    onAlbumClick?: (album: Album) => void;
    cardWidth: number;
    cardHeight: number;
  };
}

const GridItem: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { albums, columnsCount, onAlbumClick, cardWidth, cardHeight } = data;
  const index = rowIndex * columnsCount + columnIndex;
  const album = albums[index];

  if (!album) return null;

  return (
    <div
      style={{
        ...style,
        padding: GRID_PADDING / 2,
        width: cardWidth + GRID_PADDING,
        height: cardHeight + GRID_PADDING,
      }}
    >
      <AlbumCard album={album} onClick={onAlbumClick} className="w-full h-full" />
    </div>
  );
};

export function AlbumGrid({ onAlbumClick, initialFilters }: AlbumGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});

  // Responsive grid dimensions
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const columnsCount = Math.floor(
    (containerSize.width - GRID_PADDING * 2) / (ALBUM_CARD_WIDTH + GRID_PADDING)
  );

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setFilters((prev) => ({ ...prev, query: query || undefined }));
      }, 300),
    []
  );

  React.useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const {
    data: albumPages,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAlbums({
    limit: DEFAULT_PAGE_SIZE,
    sort_by: 'title',
    sort_order: 'asc',
    ...filters,
  });

  // Flatten all pages into single array
  const albums = useMemo(() => {
    return albumPages?.pages.flatMap((page) => page.items) || [];
  }, [albumPages]);

  // Calculate total rows needed
  const rowCount = Math.ceil(albums.length / columnsCount);

  // Infinite scrolling handler
  const handleScroll = React.useCallback(
    ({ scrollTop, scrollHeight, clientHeight }: any) => {
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      if (scrollPercentage > 0.8 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Container ref for resize detection
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load albums</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Search and filters */}
      <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <Input
          placeholder="Search albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {albums.length} albums
          {isLoading && ' (loading...)'}
        </div>
      </div>

      {/* Albums grid */}
      <div ref={containerRef} className="flex-1 min-h-0">
        {albums.length > 0 ? (
          <Grid
            columnCount={columnsCount}
            columnWidth={ALBUM_CARD_WIDTH + GRID_PADDING}
            height={containerSize.height - 100} // Account for search bar
            rowCount={rowCount}
            rowHeight={ALBUM_CARD_HEIGHT + GRID_PADDING}
            width={containerSize.width}
            onScroll={handleScroll}
            itemData={{
              albums,
              columnsCount,
              onAlbumClick,
              cardWidth: ALBUM_CARD_WIDTH,
              cardHeight: ALBUM_CARD_HEIGHT,
            }}
            overscanRowCount={2} // Pre-render 2 rows outside viewport for smooth scrolling
          >
            {GridItem}
          </Grid>
        ) : (
          <div className="flex items-center justify-center h-64">
            {isLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading albums...</p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No albums found</p>
            )}
          </div>
        )}
      </div>

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <p className="text-gray-600 dark:text-gray-400">Loading more albums...</p>
        </div>
      )}
    </div>
  );
}
