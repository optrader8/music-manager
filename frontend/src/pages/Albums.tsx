import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { musicService } from '@/services/musicService';
import AlbumEditModal from '@/components/AlbumEditModal';
import type { AlbumSummary, PaginationMeta } from '@/types/stats';

interface AlbumListResponse {
  items: AlbumSummary[];
  pagination: PaginationMeta;
}

export default function Albums() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [editingAlbum, setEditingAlbum] = useState<AlbumSummary | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const pageSize = 24;

  const { data, isLoading, error } = useQuery<AlbumListResponse>({
    queryKey: ['albums', currentPage, searchQuery, selectedGenre],
    queryFn: () =>
      musicService.getAlbumsWithPagination({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
        genre: selectedGenre || undefined,
      }),
  });

  const updateAlbumMutation = useMutation({
    mutationFn: ({ albumId, data }: { albumId: number; data: any }) =>
      musicService.updateAlbum(albumId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      setIsEditModalOpen(false);
      setEditingAlbum(null);
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: (albumId: number) => musicService.deleteAlbum(albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });

  const handleAlbumClick = (albumId: number) => {
    navigate(`/albums/${albumId}`);
  };

  const handleEditAlbum = (album: AlbumSummary) => {
    setEditingAlbum(album);
    setIsEditModalOpen(true);
  };

  const handleSaveAlbum = (updatedData: Partial<AlbumSummary>) => {
    if (editingAlbum) {
      updateAlbumMutation.mutate({
        albumId: editingAlbum.id,
        data: updatedData,
      });
    }
  };

  const handleDeleteAlbum = (album: AlbumSummary) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${album.title}"? This action cannot be undone.`
      )
    ) {
      deleteAlbumMutation.mutate(album.id);
    }
  };

  const getAlbumCoverUrl = (albumId: number) => {
    return `http://g2.parrot-mine.ts.net:32000/api/v1/albums/${albumId}/cover?size=medium`;
  };

  const formatYear = (year?: number) => {
    return year ? year.toString() : 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Albums</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Albums</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load albums</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Albums</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search albums..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <input
            type="text"
            placeholder="Filter by genre..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="text-sm text-gray-600 flex items-center">
            Showing {data?.pagination.total || 0} albums
          </div>
        </div>
      </div>

      {/* Albums Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.items.map((album) => (
            <div
              key={album.id}
              onClick={() => handleAlbumClick(album.id)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative">
                <img
                  src={getAlbumCoverUrl(album.id)}
                  alt={album.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBWMTIwSDgwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity"></div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-1">{album.title}</h3>
                <p className="text-sm text-gray-600 truncate mb-1">{album.artist?.name}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{formatYear(album.release_year)}</span>
                  <span>{album.genre || 'Unknown'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cover
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Album
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Genre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items.map((album) => (
                <tr key={album.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={getAlbumCoverUrl(album.id)}
                      alt={album.title}
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgyOFYyOEgyMFYyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{album.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {album.artist?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatYear(album.release_year)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {album.genre || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleAlbumClick(album.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAlbum(album);
                      }}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbum(album);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {data.pagination.page} of {data.pagination.total_pages}(
            {data.pagination.total} total albums)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!data.pagination.has_previous}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-700">
              Page {currentPage} of {data.pagination.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(data.pagination.total_pages, currentPage + 1))}
              disabled={!data.pagination.has_next}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Album Edit Modal */}
      <AlbumEditModal
        album={editingAlbum}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAlbum(null);
        }}
        onSave={handleSaveAlbum}
      />
    </div>
  );
}
