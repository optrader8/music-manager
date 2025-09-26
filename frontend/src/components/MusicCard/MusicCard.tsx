import React from 'react';
import { Play, MoreHorizontal, Music, Folder } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface MusicCardProps {
  id: string;
  title: string;
  subtitle?: string;
  coverArt?: string;
  type: 'album' | 'artist' | 'playlist' | 'folder';
  trackCount?: number;
  onClick?: () => void;
  onPlay?: () => void;
  onAddToPlaylist?: () => void;
  onShowDetails?: () => void;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  title,
  subtitle,
  coverArt,
  type,
  trackCount,
  onClick,
  onPlay,
  onAddToPlaylist,
  onShowDetails,
}) => {
  const { currentTrack, isPlaying } = useAudioPlayer();

  // Check if this card represents the currently playing track/album
  const isCurrentlyPlaying =
    currentTrack &&
    (currentTrack.title === title ||
      currentTrack.album?.title === title ||
      currentTrack.artist?.name === title);
  return (
    <div
      className={`group relative rounded-xl shadow-sm border transition-all duration-300 cursor-pointer overflow-hidden ${
        isCurrentlyPlaying && isPlaying
          ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 shadow-lg'
          : 'bg-white border-gray-200 hover:shadow-lg'
      }`}
      onClick={onClick}
    >
      {/* Cover Art */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
        {coverArt ? (
          <img src={coverArt} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {type === 'folder' ? (
              <Folder size={48} className="text-gray-400" />
            ) : (
              <Music size={48} className="text-gray-400" />
            )}
          </div>
        )}

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay?.();
                  }}
                  className="bg-white/90 hover:bg-white text-black rounded-full p-4 shadow-lg hover:scale-110 transition-all duration-200"
                >
                  <Play size={24} fill="currentColor" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
                  sideOffset={5}
                >
                  Play
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        {/* More Options Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[160px] z-50"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={onPlay}
                >
                  <Play size={16} className="mr-2" />
                  Play Now
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={onAddToPlaylist}
                >
                  <Music size={16} className="mr-2" />
                  Add to Playlist
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={onShowDetails}
                >
                  Show Details
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Track Count Badge */}
        {trackCount && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {trackCount} tracks
          </div>
        )}

        {/* Now Playing Indicator */}
        {isCurrentlyPlaying && isPlaying && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Playing
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{title}</h3>
        {subtitle && <p className="text-xs text-gray-600 truncate">{subtitle}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 capitalize">{type}</span>
          {type === 'album' && <div className="w-2 h-2 bg-green-400 rounded-full" />}
        </div>
      </div>
    </div>
  );
};
