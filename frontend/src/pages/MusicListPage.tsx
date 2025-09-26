import React from 'react';
import { Card, CardContent } from '../components/ui/card';

// Mock 데이터 50개
const mockAlbums = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Album ${i + 1}`,
  artist: `Artist ${Math.floor(i / 3) + 1}`,
  year: 2000 + (i % 24),
  genre: ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic'][i % 6],
  coverColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'][i % 6],
}));

export function MusicListPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Browse your music collection ({mockAlbums.length} albums)
          </p>
        </div>

        {/* Album Grid */}
        <div className="grid gap-3 grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-20">
          {mockAlbums.map((album) => (
            <Card
              key={album.id}
              className="overflow-hidden transition-all duration-200 hover:scale-[1.05] hover:shadow-sm cursor-pointer"
            >
              <CardContent className="p-0">
                <div className="relative group">
                  <div
                    className="w-full aspect-square flex items-center justify-center text-white font-medium text-xs"
                    style={{ backgroundColor: album.coverColor }}
                  >
                    {album.id}
                  </div>
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
                    {album.artist}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
