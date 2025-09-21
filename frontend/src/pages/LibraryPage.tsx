import React, { useState } from 'react';
import { AlbumGrid } from '../components/AlbumGrid';
import { LibraryStats } from '../components/LibraryStats';
import { LibrarySection } from '../components/LibrarySection';
import { SearchFilters } from '../components/SearchFilters';
import { useLibraryScan } from '../hooks/useMusicLibrary';
import type { Album, SearchFilters as SearchFiltersType } from '../types/api';

type ViewMode = 'albums' | 'artists' | 'tracks';

export function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({});
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const { mutate: scanLibrary, isPending: isScanning } = useLibraryScan();

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
    // TODO: Navigate to album detail page or open album modal
    console.log('Selected album:', album);
  };

  const handleScanLibrary = () => {
    scanLibrary();
  };

  const viewModeButtons = [
    { mode: 'albums', label: 'Albums', icon: '💿' },
    { mode: 'artists', label: 'Artists', icon: '🎤' },
    { mode: 'tracks', label: 'Tracks', icon: '🎵' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Browse and manage your music collection
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleScanLibrary}
              disabled={isScanning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {isScanning ? 'Scanning...' : 'Scan Library'}
            </button>
          </div>
        </div>

        {/* Library Statistics */}
        <LibrarySection title="Library Overview">
          <LibraryStats />
        </LibrarySection>

        {/* Search and Filters */}
        <LibrarySection title="Search & Filters" collapsible defaultExpanded={false}>
          <SearchFilters
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            showAdvanced={false}
          />
        </LibrarySection>

        {/* View Mode Selector */}
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
          {viewModeButtons.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{icon}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <LibrarySection
          title={`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View`}
          actions={
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {/* TODO: Add view options like sort, grid size, etc. */}
            </div>
          }
        >
          <div className="h-[600px]">
            {' '}
            {/* Fixed height for virtualization */}
            {viewMode === 'albums' && (
              <AlbumGrid onAlbumClick={handleAlbumClick} initialFilters={searchFilters} />
            )}
            {viewMode === 'artists' && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Artists view coming soon...
              </div>
            )}
            {viewMode === 'tracks' && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Tracks view coming soon...
              </div>
            )}
          </div>
        </LibrarySection>

        {/* Recently Added */}
        <LibrarySection title="Recently Added" collapsible defaultExpanded={true}>
          <AlbumGrid
            onAlbumClick={handleAlbumClick}
            initialFilters={{
              ...searchFilters,
              // TODO: Add recently added filter when backend supports it
            }}
          />
        </LibrarySection>
      </div>
    </div>
  );
}
