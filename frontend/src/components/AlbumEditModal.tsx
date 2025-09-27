import React, { useState, useEffect } from 'react';
import type { AlbumSummary } from '@/types/stats';

interface AlbumEditModalProps {
  album: AlbumSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAlbum: Partial<AlbumSummary>) => void;
}

export default function AlbumEditModal({ album, isOpen, onClose, onSave }: AlbumEditModalProps) {
  const [formData, setFormData] = useState<Partial<AlbumSummary>>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  useEffect(() => {
    if (album && isOpen) {
      setFormData({
        title: album.title,
        release_year: album.release_year,
        genre: album.genre,
        artist: album.artist,
      });
      setCoverPreview('');
      setCoverFile(null);
    }
  }, [album, isOpen]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create updated album data
    const updatedAlbum = {
      ...formData,
      cover_file: coverFile,
    };

    onSave(updatedAlbum);
    onClose();
  };

  const handleClose = () => {
    setFormData({});
    setCoverFile(null);
    setCoverPreview('');
    onClose();
  };

  if (!isOpen || !album) return null;

  const getAlbumCoverUrl = (albumId: number) => {
    return `http://g2.parrot-mine.ts.net:32000/api/v1/albums/${albumId}/cover?size=medium`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Album</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Cover Art */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Album Cover</label>
                <div className="space-y-4">
                  <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={getAlbumCoverUrl(album.id)}
                        alt={album.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="text-center">
                              <div class="text-gray-400 text-4xl mb-2">📀</div>
                              <p class="text-gray-500">No cover image</p>
                            </div>
                          `;
                        }}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Click to upload new cover image
                  </p>
                </div>
              </div>

              {/* Right Column - Album Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Album Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={formData.artist?.name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        artist: { ...formData.artist, name: e.target.value } as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.release_year || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        release_year: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <input
                    type="text"
                    value={formData.genre || ''}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Rock, Jazz, Classical"
                  />
                </div>

                {/* Album Metadata */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Album Information</h3>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>Album ID: {album.id}</p>
                    <p>Created: {new Date(album.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-700">
                  Advanced Options
                  <span className="ml-2 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Name
                      </label>
                      <input
                        type="text"
                        value={formData.artist?.sort_name || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            artist: { ...formData.artist, sort_name: e.target.value } as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="For sorting (e.g., Beatles, The)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Album Artist
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="If different from artist"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
