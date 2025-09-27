import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MP3TagData } from '@/types/file';

interface MP3TagEditModalProps {
  filePath: string;
  currentTags: MP3TagData | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (updatedTags: MP3TagData) => void;
}

export default function MP3TagEditModal({
  filePath,
  currentTags,
  isOpen,
  isLoading = false,
  onClose,
  onSave,
}: MP3TagEditModalProps) {
  const [formData, setFormData] = useState<MP3TagData>({});

  useEffect(() => {
    if (currentTags && isOpen) {
      setFormData({ ...currentTags });
    }
  }, [currentTags, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof MP3TagData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  if (!isOpen) return null;

  const fileName = filePath.split('/').pop() || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit MP3 Tags</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>File:</strong> {fileName}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Song title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
              <input
                type="text"
                value={formData.artist || ''}
                onChange={(e) => handleInputChange('artist', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Artist name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
              <input
                type="text"
                value={formData.album || ''}
                onChange={(e) => handleInputChange('album', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Album name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <input
                type="text"
                value={formData.genre || ''}
                onChange={(e) => handleInputChange('genre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Genre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year || ''}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Release year"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Track Number</label>
              <input
                type="text"
                value={formData.tracknumber || ''}
                onChange={(e) => handleInputChange('tracknumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Track number"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md"
          >
            {isLoading ? 'Saving...' : 'Save Tags'}
          </button>
        </div>
      </div>
    </div>
  );
}
