import React from 'react';
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
  List,
  ChevronUp,
} from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface PlayerControlsProps {
  className?: string;
  showQueue?: boolean;
  showVolume?: boolean;
  compact?: boolean;
  onToggleQueue?: () => void;
  onToggleExpanded?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  className = '',
  showQueue = true,
  showVolume = true,
  compact: _compact = false,
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
    shuffle,
    repeat,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    setShuffle,
    setRepeat,
  } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white border-t border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            {currentTrack.album?.cover_art_url ? (
              <img
                src={currentTrack.album.cover_art_url}
                alt={currentTrack.album.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Play size={16} className="text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">{currentTrack.title}</h4>
            <p className="text-xs text-gray-600 truncate">
              {currentTrack.artist?.name || 'Unknown Artist'}
            </p>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 rounded-full transition-colors ${
                shuffle ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Shuffle size={16} />
            </button>

            <button
              onClick={previous}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={() => (isPlaying ? pause() : play())}
              disabled={isLoading}
              className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>

            <button
              onClick={next}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SkipForward size={18} />
            </button>

            <button
              onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
              className={`p-2 rounded-full transition-colors ${
                repeat !== 'off' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                seek(percentage * duration);
              }}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {showVolume && (
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 text-gray-600 hover:text-gray-900">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>
          )}

          {showQueue && (
            <button onClick={onToggleQueue} className="p-2 text-gray-600 hover:text-gray-900">
              <List size={16} />
            </button>
          )}

          {onToggleExpanded && (
            <button onClick={onToggleExpanded} className="p-2 text-gray-600 hover:text-gray-900">
              <ChevronUp size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
