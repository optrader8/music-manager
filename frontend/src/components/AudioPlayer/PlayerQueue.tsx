import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { Play, Pause, X, GripVertical, Clock, Music, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePlaybackQueue, useAudioControls } from '../../hooks/useAudioPlayer';
import { musicService } from '../../services/musicService';

interface PlayerQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QueueItemProps {
  track: any; // Should be PlaybackTrack
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

const QueueItem: React.FC<QueueItemProps> = ({
  track,
  index,
  isCurrent,
  isPlaying,
  onPlay,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  draggable = false,
}) => {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className={cn(
        'p-3 transition-colors',
        isCurrent
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        draggable && 'cursor-move'
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        {draggable && (
          <div className="flex-shrink-0 text-gray-400 cursor-move">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Track Number / Current Indicator */}
        <div className="flex-shrink-0 w-8 text-center">
          {isCurrent ? (
            isPlaying ? (
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
            ) : (
              <Pause className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <span className="text-sm text-gray-500">{index + 1}</span>
          )}
        </div>

        {/* Album Art */}
        <div className="flex-shrink-0">
          <img
            src={musicService.getAlbumArtworkUrl(track.album_id || 0, 'small')}
            alt={track.album_title || 'Album cover'}
            className="w-10 h-10 rounded object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.src = '/placeholder-album.png';
            }}
          />
        </div>

        {/* Play Button */}
        <Button variant="ghost" size="sm" onClick={onPlay} className="flex-shrink-0 w-8 h-8 p-0">
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-medium truncate',
              isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {track.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {track.artist_name || 'Unknown Artist'}
            {track.album_title && ` • ${track.album_title}`}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDuration(track.duration_seconds)}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="flex-shrink-0 w-8 h-8 p-0 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export const PlayerQueue: React.FC<PlayerQueueProps> = ({ isOpen, onClose }) => {
  const { queue, queueIndex, currentTrack, moveTrack, removeTrack, clearQueue } =
    usePlaybackQueue();
  const { isPlaying } = useAudioControls();

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveTrack(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handlePlayTrack = (index: number) => {
    // This would need to be implemented - play specific track from queue
    console.log('Play track at index:', index);
  };

  const handleRemoveTrack = (index: number) => {
    removeTrack(index);
  };

  const totalDuration = queue.reduce((sum, track) => sum + (track.duration_seconds || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Up Next</DialogTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{queue.length} tracks</span>
              <span>{formatTotalDuration(totalDuration)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearQueue}
                disabled={queue.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Music className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Your queue is empty</h3>
              <p className="text-sm text-center">Add tracks or albums to start playing music</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((track, index) => (
                <QueueItem
                  key={`${track.track_id}-${index}`}
                  track={track}
                  index={index}
                  isCurrent={index === queueIndex}
                  isPlaying={index === queueIndex && isPlaying}
                  onPlay={() => handlePlayTrack(index)}
                  onRemove={() => handleRemoveTrack(index)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  draggable={true}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
