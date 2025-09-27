import React, { useState } from 'react';
import { Folder, File, Music, Image, FileText, MoreVertical } from 'lucide-react';
import type { FileItem as FileItemType } from '@/types/file';

function getFileIcon(fileType?: string, isDirectory?: boolean) {
  if (isDirectory) return <Folder className="w-8 h-8 text-blue-500" />;
  switch (fileType) {
    case 'audio': return <Music className="w-8 h-8 text-green-500" />;
    case 'image': return <Image className="w-8 h-8 text-purple-500" />;
    case 'text': return <FileText className="w-8 h-8 text-gray-500" />;
    default: return <File className="w-8 h-8 text-gray-500" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

interface FileItemProps {
  item: FileItemType;
  onClick: () => void;
  onAction: (action: string) => void;
}

export default function FileItem({ item, onClick, onAction }: FileItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getFileIcon(item.fileType, item.isDirectory)}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={item.name}>
              {item.name}
            </h3>
            <p className="text-xs text-gray-500">
              {item.isDirectory ? 'Folder' : (item.fileType || 'File')}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          {showActions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('rename');
                  setShowActions(false);
                }}
              >
                Rename
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('delete');
                  setShowActions(false);
                }}
              >
                Delete
              </button>
              {!item.isDirectory && item.fileType === 'audio' && (
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('editTags');
                    setShowActions(false);
                  }}
                >
                  Edit Tags
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {!item.isDirectory && item.size && (
          <div>Size: {formatFileSize(item.size)}</div>
        )}
        <div>Modified: {formatDate(item.modifiedTime)}</div>
        <div>Permissions: {item.permissions}</div>
      </div>
    </div>
  );
}