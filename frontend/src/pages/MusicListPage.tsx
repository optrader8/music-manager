import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight, Music } from 'lucide-react';
import { musicService } from '../services/musicService';
import type { Album } from '../types/api';

const ITEMS_PER_PAGE = 24;

export function MusicListPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['albums', currentPage],
    queryFn: () =>
      musicService.getAlbums({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sort_by: 'title',
        sort_order: 'asc',
      }),
  });

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderAlbumCover = (album: Album) => {
    const coverUrl = album.cover_art_path
      ? musicService.getAlbumArtworkUrl(album.id, 'thumbnail')
      : null;

    if (coverUrl) {
      return (
        <img
          src={coverUrl}
          alt={`${album.title} cover`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default image if thumbnail fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Music class="w-8 h-8 text-white" />
                </div>
              `;
            }
          }}
        />
      );
    }

    // Default cover when no image available
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Music className="w-8 h-8 text-white" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading albums...</p>
          </div>
          <div className="grid gap-3 grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-20">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music Library</h1>
            <p className="text-red-600 dark:text-red-400 mt-2">
              Error loading albums: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Browse your music collection ({data?.total || 0} albums)
          </p>
        </div>

        {/* Album Grid */}
        {data && data.items.length > 0 ? (
          <div className="grid gap-3 grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-20">
            {data.items.map((album) => (
              <Card
                key={album.id}
                className="overflow-hidden transition-all duration-200 hover:scale-[1.05] hover:shadow-sm cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="relative group">
                    {renderAlbumCover(album)}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/95 dark:bg-gray-800/95 rounded-full p-0.5">
                        <svg
                          className="w-2 h-2 text-gray-900 dark:text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <h3 className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                      {album.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {album.artist?.name || 'Unknown Artist'}
                    </p>
                    {album.year && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {album.year}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No albums found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your music library is empty or still scanning.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
