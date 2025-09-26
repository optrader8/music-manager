import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Card } from '../ui/card';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ChevronUp,
  ChevronDown,
  List,
  Heart,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAudioControls, usePlaybackQueue } from '../../hooks/useAudioPlayer';
import { musicService } from '../../services/musicService';

interface PlayerControlsProps {
  className?: string;
  showQueue?: boolean;
  showVolume?: boolean;
  compact?: boolean;
  onToggleQueue?: () => void;
  onToggleExpanded?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  className,
  showQueue = true,
  showVolume = true,
  compact = false,
  onToggleQueue,
  onToggleExpanded,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    currentTime,
    duration,
    progress,
    canPlay,
    canSeek,
    togglePlayPause,
    next,
    previous,
    seekTo,
    setVolume,
    toggleMute,
  } = useAudioControls();

  const { shuffle, repeat, setShuffle, setRepeat, queueLength } = usePlaybackQueue();

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setDragProgress(newProgress);
    if (!isDragging) {
      seekTo(newProgress);
    }
  };

  const handleProgressChangeStart = () => {
    setIsDragging(true);
  };

  const handleProgressChangeEnd = (value: number[]) => {
    setIsDragging(false);
    seekTo(value[0]);
  };

  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one':
        return Repeat1;
      case 'all':
        return Repeat;
      default:
        return Repeat;
    }
  };

  const RepeatIcon = getRepeatIcon();

  if (!currentTrack && !compact) {
    return (
      <Card className={cn('p-4 bg-gray-900 text-white', className)}>
        <div className="flex items-center justify-center h-16">
          <p className="text-gray-400">No track selected</p>
        </div>
      </Card>
    );
  }

  if (compact && !currentTrack) {
    return null;
  }

  return (
    <Card
      className={cn('bg-gray-900 text-white border-gray-700', compact ? 'p-2' : 'p-4', className)}
    >
      <div className={cn('flex items-center gap-4', compact ? 'flex-col' : 'flex-row')}>
        {/* Track Info */}
        <div className={cn('flex items-center gap-3', compact ? 'w-full' : 'flex-1 min-w-0')}>
          {currentTrack && (
            <>
              {/* Album Art */}
              <div className={cn('flex-shrink-0', compact ? 'w-12 h-12' : 'w-16 h-16')}>
                <img
                  src={musicService.getAlbumArtworkUrl(currentTrack.album?.id || 0, 'medium')}
                  alt={currentTrack.album?.title || 'Album cover'}
                  className="w-full h-full rounded object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = '/placeholder-album.png';
                  }}
                />
              </div>

              {/* Track Details */}
              <div className="flex-1 min-w-0">
                <h4 className={cn('font-medium truncate', compact ? 'text-sm' : 'text-base')}>
                  {currentTrack.title}
                </h4>
                <p className={cn('text-gray-400 truncate', compact ? 'text-xs' : 'text-sm')}>
                  {currentTrack.artist?.name || 'Unknown Artist'}
                  {currentTrack.album && ` • ${currentTrack.album.title}`}
                </p>
              </div>

              {/* Favorite Button */}
              {!compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white flex-shrink-0"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Main Controls */}
        <div
          className={cn('flex flex-col items-center gap-2', compact ? 'w-full' : 'flex-1 max-w-md')}
        >
          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShuffle(!shuffle)}
              className={cn('text-gray-400 hover:text-white', shuffle && 'text-green-500')}
            >
              <Shuffle className={cn('w-4 h-4', compact && 'w-3 h-3')} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={previous}
              disabled={!canPlay}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <SkipBack className={cn('w-4 h-4', compact && 'w-3 h-3')} />
            </Button>

            <Button
              onClick={togglePlayPause}
              disabled={!canPlay || isLoading}
              className={cn(
                'bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-full',
                compact ? 'w-8 h-8' : 'w-10 h-10'
              )}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-white" />
              ) : isPlaying ? (
                <Pause className={cn('w-4 h-4', compact && 'w-3 h-3')} />
              ) : (
                <Play className={cn('w-4 h-4 ml-0.5', compact && 'w-3 h-3 ml-0')} />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={next}
              disabled={!canPlay}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <SkipForward className={cn('w-4 h-4', compact && 'w-3 h-3')} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const nextRepeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
                setRepeat(nextRepeat);
              }}
              className={cn('text-gray-400 hover:text-white', repeat !== 'off' && 'text-green-500')}
            >
              <RepeatIcon className={cn('w-4 h-4', compact && 'w-3 h-3')} />
            </Button>
          </div>

          {/* Progress Bar */}
          {!compact && canSeek && (
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[isDragging ? dragProgress : progress]}
                onValueChange={handleProgressChange}
                onValueCommit={handleProgressChangeEnd}
                onPointerDown={handleProgressChangeStart}
                max={100}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div
          className={cn(
            'flex items-center gap-2',
            compact ? 'w-full justify-center' : 'flex-shrink-0'
          )}
        >
          {/* Volume Control */}
          {showVolume && !compact && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-gray-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          )}

          {/* Queue Toggle */}
          {showQueue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleQueue}
              className="text-gray-400 hover:text-white"
            >
              <List className="w-4 h-4" />
              {!compact && queueLength > 0 && <span className="ml-1 text-xs">{queueLength}</span>}
            </Button>
          )}

          {/* Expand/Collapse */}
          {onToggleExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="text-gray-400 hover:text-white"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}

          {/* More Options */}
          {!compact && (
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
