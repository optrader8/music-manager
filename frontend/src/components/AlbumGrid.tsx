import React, { useState, useMemo } from 'react';
import { AlbumCard } from './AlbumCard';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { useAlbums } from '../hooks/useMusicLibrary';
import { debounce } from '../lib/utils';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { Album, SearchFilters } from '../types/api';

interface AlbumGridProps {
  onAlbumClick?: (album: Album) => void;
  initialFilters?: SearchFilters;
}

export function AlbumGrid({ onAlbumClick, initialFilters }: AlbumGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: unknown) => {
        if (typeof query === 'string') {
          setFilters((prev) => ({ ...prev, query: query || undefined }));
          setCurrentPage(1); // Reset to first page on search
        }
      }, 300),
    [debounce]
  );

  React.useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const {
    data: albumResponse,
    isLoading,
    error,
  } = useAlbums({
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
    sort_by: 'title',
    sort_order: 'asc',
    ...filters,
  });

  const albums = albumResponse?.items || [];
  const totalPages = Math.ceil((albumResponse?.total || 0) / DEFAULT_PAGE_SIZE);
  const totalAlbums = albumResponse?.total || 0;

  console.log('AlbumGrid data:', albumResponse, 'totalPages:', totalPages);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
          {totalAlbums} albums
          {isLoading && ' (loading...)'}
        </div>
      </div>

      {/* Albums grid */}
      <div className="flex-1 min-h-0">
        {isLoading && albums.length === 0 ? (
          // Initial loading state with skeletons
          <div className="grid gap-4 p-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : albums.length > 0 ? (
          <>
            <div className="grid gap-4 p-4 grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 2xl:grid-cols-20">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} onClick={onAlbumClick} />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={
                          currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>

                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(1)}
                            className="cursor-pointer"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 4 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {/* Page numbers around current */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const start = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
                      const pageNumber = start + i;
                      if (pageNumber <= totalPages) {
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNumber)}
                              isActive={pageNumber === currentPage}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    }).filter(Boolean)}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={
                          currentPage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            {!isLoading && <p className="text-gray-600 dark:text-gray-400">No albums found</p>}
          </div>
        )}
      </div>
    </div>
  );
}
