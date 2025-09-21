import React from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { cn } from '../lib/utils';
import { musicService } from '../services/musicService';
import { DEFAULT_ALBUM_PLACEHOLDER } from '../constants';
import type { Album } from '../types/api';

interface AlbumCardProps {
  album: Album;
  onClick?: (album: Album) => void;
  className?: string;
}

export function AlbumCard({ album, onClick, className }: AlbumCardProps) {
  const artworkUrl = musicService.getAlbumArtworkUrl(album.id, 'medium');

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800',
        className
      )}
      onClick={() => onClick?.(album)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(album);
        }
      }}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          <img
            src={artworkUrl}
            alt={`${album.title} album cover`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to a data URL placeholder if artwork fails to load
              const target = e.currentTarget;
              if (target.src !== DEFAULT_ALBUM_PLACEHOLDER) {
                target.src = DEFAULT_ALBUM_PLACEHOLDER;
              }
            }}
          />
          {album.total_discs && album.total_discs > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {album.total_discs} Discs
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start p-4 space-y-1">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
          {album.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {album.artist?.name || album.album_artist || 'Unknown Artist'}
        </p>
        <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-500">
          <span>{album.year || 'Unknown'}</span>
          {album.total_tracks && <span>{album.total_tracks} tracks</span>}
        </div>
        {album.genre && (
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
            {album.genre}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
