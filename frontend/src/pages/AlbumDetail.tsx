import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { musicService } from '@/services/musicService';
import type { AlbumSummary, TrackWithRelations } from '@/types/stats';

interface AlbumWithTracks extends AlbumSummary {
  tracks: TrackWithRelations[];
  total_tracks: number;
  total_duration: number;
}

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<AlbumSummary>>({});

  const {
    data: albumData,
    isLoading,
    error,
  } = useQuery<AlbumWithTracks>({
    queryKey: ['album', albumId],
    queryFn: () => musicService.getAlbumWithTracks(Number(albumId)),
    enabled: !!albumId,
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTrackDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getAlbumCoverUrl = (albumId: number, size: 'small' | 'medium' | 'large' = 'large') => {
    return `/api/v1/albums/${albumId}/cover?size=${size}`;
  };

  const handleEditSave = () => {
    // TODO: Implement album update API call
    console.log('Saving album changes:', editData);
    setIsEditMode(false);
  };

  const handleEditCancel = () => {
    setEditData({});
    setIsEditMode(false);
  };

  const handleDeleteAlbum = () => {
    if (
      window.confirm('Are you sure you want to delete this album? This action cannot be undone.')
    ) {
      // TODO: Implement album deletion
      console.log('Deleting album:', albumId);
      navigate('/albums');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex space-x-6 mb-8">
            <div className="w-64 h-64 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !albumData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load album details</p>
          <Link to="/albums" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Albums
          </Link>
        </div>
      </div>
    );
  }

  const { tracks, total_tracks, total_duration, ...album } = albumData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Album Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Action buttons in header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center space-x-3">
            {!isEditMode ? (
              <>
                <button
                  onClick={() => console.log('Play album')}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="font-medium">Play</span>
                </button>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span className="font-medium">Edit</span>
                </button>
                <button
                  onClick={handleDeleteAlbum}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="font-medium">Delete</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditSave}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Save</span>
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="font-medium">Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-8">
          {/* Album Cover */}
          <div className="flex-shrink-0">
            <div className="relative group">
              <img
                src={getAlbumCoverUrl(album.id)}
                alt={album.title}
                className="w-64 h-64 rounded-lg shadow-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwSDE1NlYxNTZIMTAwVjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                }}
              />
              {isEditMode && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100">
                    Change Cover
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Album Information */}
          <div className="flex-1">
            {isEditMode ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editData.title ?? album.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-3xl font-bold text-gray-900 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Album Title"
                />
                <input
                  type="text"
                  value={editData.artist?.name ?? album.artist?.name ?? ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      artist: { ...editData.artist, name: e.target.value },
                    })
                  }
                  className="text-xl text-gray-600 w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Artist Name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={editData.release_year ?? album.release_year ?? ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        release_year: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Release Year"
                  />
                  <input
                    type="text"
                    value={editData.genre ?? album.genre ?? ''}
                    onChange={(e) => setEditData({ ...editData, genre: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Genre"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{album.artist?.name}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Year:</span>
                    <p className="text-gray-900">{album.release_year || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Genre:</span>
                    <p className="text-gray-900">{album.genre || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Tracks:</span>
                    <p className="text-gray-900">{total_tracks}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Duration:</span>
                    <p className="text-gray-900">{formatDuration(total_duration)}</p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>Album ID: {album.id}</p>
                  <p>Added: {new Date(album.created_at).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Track List</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tracks.map((track, index) => (
                <tr key={track.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {track.track_number || index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{track.title}</div>
                    {track.performer && track.performer !== album.artist?.name && (
                      <div className="text-xs text-gray-500">by {track.performer}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTrackDuration(track.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{track.format || 'Unknown'}</div>
                    {track.bitrate && (
                      <div className="text-xs text-gray-500">
                        {Math.round(track.bitrate / 1000)}kbps
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(track.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Play</button>
                    <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
