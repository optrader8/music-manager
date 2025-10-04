import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Save, X, Music, Copy, RefreshCw, Upload, Image } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';

interface FileItem {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  is_audio?: boolean;
  modified: string;
}

interface Mp3Tags {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  track_number?: string;
}

interface TrackWithTags extends FileItem {
  tags?: Mp3Tags;
}

async function fetchFolderFiles(path: string): Promise<FileItem[]> {
  const response = await apiClient.get(`/files/browse?path=${encodeURIComponent(path)}`);
  return response.data.items;
}

async function fetchMp3Tags(filePath: string): Promise<Mp3Tags> {
  const response = await apiClient.get(`/files/${encodeURIComponent(filePath)}/mp3-tags`);
  return response.data;
}

async function updateMp3Tags(filePath: string, tags: Mp3Tags): Promise<void> {
  await apiClient.put(`/files/${encodeURIComponent(filePath)}/mp3-tags`, tags);
}

async function syncTagsFromFirst(folderPath: string): Promise<void> {
  await apiClient.post(`/bulk-tags/sync-from-first?folder_path=${encodeURIComponent(folderPath)}`);
}

async function bulkUpdateTags(
  folderPath: string,
  tags: Mp3Tags,
  useFolderAsAlbum: boolean = true
): Promise<void> {
  await apiClient.post('/bulk-tags/update', {
    folder_path: folderPath,
    tags,
    apply_to_all: true,
    use_folder_name_as_album: useFolderAsAlbum,
  });
}

export default function AlbumFolderDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const albumPath = searchParams.get('path') || '';
  const [tracks, setTracks] = useState<TrackWithTags[]>([]);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editedTags, setEditedTags] = useState<Mp3Tags>({});
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkTags, setBulkTags] = useState<Mp3Tags>({});
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['folder-files', albumPath],
    queryFn: () => fetchFolderFiles(albumPath),
    enabled: !!albumPath,
  });

  const audioFiles = files?.filter((f) => f.is_audio) || [];

  // Load tags for all audio files
  useEffect(() => {
    if (audioFiles.length === 0) return;

    const loadTags = async () => {
      const tracksWithTags = await Promise.all(
        audioFiles.map(async (file) => {
          try {
            const tags = await fetchMp3Tags(file.path);
            return { ...file, tags };
          } catch (error) {
            console.error(`Failed to load tags for ${file.name}:`, error);
            return { ...file, tags: {} };
          }
        })
      );
      setTracks(tracksWithTags);
    };

    loadTags();
  }, [audioFiles.length]);

  const handleEditClick = (track: TrackWithTags) => {
    setEditingTrack(track.path);
    setEditedTags(track.tags || {});
  };

  const handleSaveClick = async (track: TrackWithTags) => {
    try {
      await updateMp3Tags(track.path, editedTags);
      toast.success(`Updated tags for ${track.name}`);

      // Update local state
      setTracks((prev) =>
        prev.map((t) => (t.path === track.path ? { ...t, tags: editedTags } : t))
      );
      setEditingTrack(null);
    } catch (error) {
      toast.error(`Failed to update tags for ${track.name}`);
      console.error(error);
    }
  };

  const handleCancelClick = () => {
    setEditingTrack(null);
    setEditedTags({});
  };

  const syncMutation = useMutation({
    mutationFn: () => syncTagsFromFirst(albumPath),
    onSuccess: () => {
      toast.success('Tags synchronized from first track');
      queryClient.invalidateQueries({ queryKey: ['folder-files', albumPath] });
      window.location.reload();
    },
    onError: () => {
      toast.error('Failed to sync tags');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (tags: Mp3Tags) => bulkUpdateTags(albumPath, tags, true),
    onSuccess: () => {
      toast.success('Bulk tags updated successfully');
      setShowBulkEdit(false);
      setBulkTags({});
      queryClient.invalidateQueries({ queryKey: ['folder-files', albumPath] });
      window.location.reload();
    },
    onError: () => {
      toast.error('Failed to update bulk tags');
    },
  });

  const handleSyncFromFirst = () => {
    if (confirm('Sync artist, album, year, genre from first track to all tracks?')) {
      syncMutation.mutate();
    }
  };

  const handleBulkUpdate = () => {
    if (confirm('Apply these tags to all tracks in this album?')) {
      bulkUpdateMutation.mutate(bulkTags);
    }
  };

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(
        `/covers/upload?folder_path=${encodeURIComponent(albumPath)}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
    },
    onSuccess: () => {
      toast.success('Cover uploaded successfully');
      setShowCoverUpload(false);
      queryClient.invalidateQueries({ queryKey: ['folder-files', albumPath] });
      window.location.reload();
    },
    onError: () => {
      toast.error('Failed to upload cover');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    if (confirm(`Upload ${file.name} as cover image?`)) {
      uploadCoverMutation.mutate(file);
    }
  };

  if (!albumPath) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Album Details</h1>
        <p className="text-gray-600 mt-2">No album selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-2 text-sm"
        >
          ← Back to Albums
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{albumPath.split('/').pop()}</h1>
            <p className="text-gray-600 text-sm mt-1">{albumPath}</p>
            <p className="text-gray-500 text-sm mt-1">{tracks.length} tracks</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadCoverMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Upload size={16} />
              <span>Upload Cover</span>
            </button>
            <button
              onClick={handleSyncFromFirst}
              disabled={syncMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              <span>Sync from First</span>
            </button>
            <button
              onClick={() => setShowBulkEdit(!showBulkEdit)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Copy size={16} />
              <span>Bulk Edit</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Bulk Edit Panel */}
      {showBulkEdit && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Bulk Edit Tags</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
              <input
                type="text"
                value={bulkTags.artist || ''}
                onChange={(e) => setBulkTags({ ...bulkTags, artist: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Artist name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Album (leave empty to use folder name)
              </label>
              <input
                type="text"
                value={bulkTags.album || ''}
                onChange={(e) => setBulkTags({ ...bulkTags, album: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Album name or empty for folder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                value={bulkTags.year || ''}
                onChange={(e) => setBulkTags({ ...bulkTags, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <input
                type="text"
                value={bulkTags.genre || ''}
                onChange={(e) => setBulkTags({ ...bulkTags, genre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Genre"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowBulkEdit(false);
                setBulkTags({});
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkUpdateMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Apply to All Tracks
            </button>
          </div>
        </div>
      )}

      {/* Tracks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Artist
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Album
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Genre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tracks.map((track, index) => {
              const isEditing = editingTrack === track.path;
              const displayTags = isEditing ? editedTags : track.tags || {};

              return (
                <tr key={track.path} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {displayTags.track_number || index + 1}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTags.title || ''}
                        onChange={(e) => setEditedTags({ ...editedTags, title: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {displayTags.title || track.name}
                        </div>
                        <div className="text-xs text-gray-500">{track.name}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTags.artist || ''}
                        onChange={(e) => setEditedTags({ ...editedTags, artist: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{displayTags.artist || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTags.album || ''}
                        onChange={(e) => setEditedTags({ ...editedTags, album: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{displayTags.album || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTags.year || ''}
                        onChange={(e) => setEditedTags({ ...editedTags, year: e.target.value })}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{displayTags.year || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTags.genre || ''}
                        onChange={(e) => setEditedTags({ ...editedTags, genre: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{displayTags.genre || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveClick(track)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(track)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
