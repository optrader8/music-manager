import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FixedSizeGrid as Grid } from 'react-window';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { fileService } from '@/services/fileService';
import MP3TagEditModal from '@/components/MP3TagEditModal';
import Breadcrumb from '@/components/Breadcrumb';
import FileItem from '@/components/FileItem';
import ConfirmDialog from '@/components/ConfirmDialog';
import RenameDialog from '@/components/RenameDialog';
import type { DirectoryListing, FileItem as FileItemType, MP3TagData } from '@/types/file';

const ITEM_WIDTH = 200;
const ITEM_HEIGHT = 160;
const GAP = 16;

export default function FileBrowserPage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    item: FileItemType | null;
  }>({ isOpen: false, item: null });
  const [renameItem, setRenameItem] = useState<{ isOpen: boolean; item: FileItemType | null }>({
    isOpen: false,
    item: null,
  });
  const [editTags, setEditTags] = useState<{ isOpen: boolean; item: FileItemType | null }>({
    isOpen: false,
    item: null,
  });

  const queryClient = useQueryClient();

  const {
    data: directoryData,
    isLoading,
    error,
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
      toast.success('File deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete file: ${error?.message || 'Unknown error'}`);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ filePath, newName }: { filePath: string; newName: string }) =>
      fileService.renameFile(filePath, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setRenameItem({ isOpen: false, item: null });
      toast.success('File renamed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to rename file: ${error?.message || 'Unknown error'}`);
    },
  });

  const updateTagsMutation = useMutation({
    mutationFn: ({ filePath, tags }: { filePath: string; tags: MP3TagData }) =>
      fileService.updateMP3Tags(filePath, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setEditTags({ isOpen: false, item: null });
      toast.success('MP3 tags updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update MP3 tags: ${error?.message || 'Unknown error'}`);
    },
  });

  const handleItemClick = (item: FileItemType) => {
    if (item.isDirectory) {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    }
  };

  const handleNavigate = (newPath: string) => {
    setCurrentPath(newPath);
  };

  const handleAction = (item: FileItemType, action: string) => {
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

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('files-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    const timeoutId = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, [directoryData?.items.length]);

  const columnCount = Math.floor((containerSize.width - GAP) / (ITEM_WIDTH + GAP)) || 4;
  const rowCount = Math.ceil((directoryData?.items.length || 0) / columnCount);

  const items = useMemo(() => directoryData?.items || [], [directoryData?.items]);

  const FileGridItem = useMemo(
    () =>
      ({ columnIndex, rowIndex, style }: any) => {
        const index = rowIndex * columnCount + columnIndex;
        const item = items[index];

        if (!item) {
          return <div style={style} className="p-2" />;
        }

        return (
          <div style={style} className="p-2">
            <FileItem
              item={item}
              onClick={() => handleItemClick(item)}
              onAction={(action) => handleAction(item, action)}
            />
          </div>
        );
      },
    [items, columnCount, handleItemClick, handleAction]
  );

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
          <FileItem
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
