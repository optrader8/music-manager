import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Folder, File, Music, Image, FileText, MoreVertical } from 'lucide-react';
import { fileService } from '@/services/fileService';
import MP3TagEditModal from '@/components/MP3TagEditModal';
import type { DirectoryListing, FileItem, MP3TagData } from '@/types/file';

function getFileIcon(fileType?: string, isDirectory?: boolean) {
  if (isDirectory) return <Folder className="w-8 h-8 text-blue-500" />;
  switch (fileType) {
    case 'audio':
      return <Music className="w-8 h-8 text-green-500" />;
    case 'image':
      return <Image className="w-8 h-8 text-purple-500" />;
    case 'text':
      return <FileText className="w-8 h-8 text-gray-500" />;
    default:
      return <File className="w-8 h-8 text-gray-500" />;
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

function FileCard({
  item,
  onClick,
  onAction,
}: {
  item: FileItem;
  onClick: () => void;
  onAction: (action: string) => void;
}) {
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
              {item.isDirectory ? 'Folder' : item.fileType || 'File'}
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
        {!item.isDirectory && item.size && <div>Size: {formatFileSize(item.size)}</div>}
        <div>Modified: {formatDate(item.modifiedTime)}</div>
        <div>Permissions: {item.permissions}</div>
      </div>
    </div>
  );
}

function Breadcrumb({ path, onNavigate }: { path: string; onNavigate: (newPath: string) => void }) {
  const parts = path.split('/').filter(Boolean);
  const crumbs = [
    { label: 'Root', path: '/' },
    ...parts.map((part, index) => ({
      label: part,
      path: '/' + parts.slice(0, index + 1).join('/'),
    })),
  ];

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span>/</span>}
          <button
            className="hover:text-blue-600 hover:underline"
            onClick={() => onNavigate(crumb.path)}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenameDialog({
  isOpen,
  currentName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}) {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    if (isOpen) setNewName(currentName);
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName !== currentName) {
      onConfirm(newName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Rename Item</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function FileBrowserPage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; item: FileItem | null }>({
    isOpen: false,
    item: null,
  });
  const [renameItem, setRenameItem] = useState<{ isOpen: boolean; item: FileItem | null }>({
    isOpen: false,
    item: null,
  });
  const [editTags, setEditTags] = useState<{ isOpen: boolean; item: FileItem | null }>({
    isOpen: false,
    item: null,
  });

  const queryClient = useQueryClient();

  const {
    data: directoryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['files', currentPath, searchQuery],
    queryFn: () =>
      fileService.browseDirectory(currentPath === '/' ? '' : currentPath, searchQuery || undefined),
    retry: 1,
  });

  const { data: mp3Tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['mp3-tags', editTags.item?.path],
    queryFn: () => (editTags.item ? fileService.getMP3Tags(editTags.item.path) : null),
    enabled: editTags.isOpen && !!editTags.item,
  });

  const deleteMutation = useMutation({
    mutationFn: (filePath: string) => fileService.deleteFile(filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setConfirmDelete({ isOpen: false, item: null });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ filePath, newName }: { filePath: string; newName: string }) =>
      fileService.renameFile(filePath, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setRenameItem({ isOpen: false, item: null });
    },
  });

  const updateTagsMutation = useMutation({
    mutationFn: ({ filePath, tags }: { filePath: string; tags: MP3TagData }) =>
      fileService.updateMP3Tags(filePath, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setEditTags({ isOpen: false, item: null });
    },
  });

  const handleItemClick = (item: FileItem) => {
    if (item.isDirectory) {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    }
  };

  const handleNavigate = (newPath: string) => {
    setCurrentPath(newPath);
  };

  const handleAction = (item: FileItem, action: string) => {
    switch (action) {
      case 'delete':
        setConfirmDelete({ isOpen: true, item });
        break;
      case 'rename':
        setRenameItem({ isOpen: true, item });
        break;
      case 'editTags':
        setEditTags({ isOpen: true, item });
        break;
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete.item) {
      deleteMutation.mutate(confirmDelete.item.path);
    }
  };

  const handleRenameConfirm = (newName: string) => {
    if (renameItem.item) {
      renameMutation.mutate({ filePath: renameItem.item.path, newName });
    }
  };

  const handleTagsSave = (tags: MP3TagData) => {
    if (editTags.item) {
      updateTagsMutation.mutate({ filePath: editTags.item.path, tags });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">File Browser</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">File Browser</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load directory contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">File Browser</h1>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb path={currentPath} onNavigate={handleNavigate} />

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {directoryData?.items.map((item) => (
          <FileCard
            key={item.path}
            item={item}
            onClick={() => handleItemClick(item)}
            onAction={(action) => handleAction(item, action)}
          />
        ))}
      </div>

      {directoryData?.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? 'No files match your search.' : 'This folder is empty.'}
          </p>
        </div>
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Item"
        message={`Are you sure you want to delete "${confirmDelete.item?.name}"? ${confirmDelete.item?.isDirectory ? 'This will delete the folder and all its contents.' : ''} This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ isOpen: false, item: null })}
      />

      <RenameDialog
        isOpen={renameItem.isOpen}
        currentName={renameItem.item?.name || ''}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenameItem({ isOpen: false, item: null })}
      />

      <MP3TagEditModal
        filePath={editTags.item?.path || ''}
        currentTags={mp3Tags || null}
        isOpen={editTags.isOpen}
        isLoading={tagsLoading || updateTagsMutation.isPending}
        onClose={() => setEditTags({ isOpen: false, item: null })}
        onSave={handleTagsSave}
      />
    </div>
  );
}
