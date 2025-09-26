import React from 'react';
import { X, Play, MoreVertical, GripVertical } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface PlayerQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerQueue: React.FC<PlayerQueueProps> = ({ isOpen, onClose }) => {
  const { queue, queueIndex, currentTrack, removeFromQueue, play } = useAudioPlayer();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed right-4 bottom-20 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Play Queue</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Play size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No tracks in queue</p>
            </div>
          ) : (
            <div className="p-2">
              {queue.map((track, index) => (
                <div
                  key={`${track.track_id}-${index}`}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    index === queueIndex ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-gray-400 cursor-grab" />
                    {index === queueIndex && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{track.title}</h4>
                    <p className="text-xs text-gray-600 truncate">
                      {track.artist_name || 'Unknown Artist'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {index !== queueIndex && (
                      <button
                        onClick={() => {
                          // Play this track
                          // Implementation would depend on your queue management
                          console.log('Play track at index:', index);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play size={14} className="text-gray-600" />
                      </button>
                    )}

                    <button
                      onClick={() => removeFromQueue(index)}
                      className="p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          {queue.length} {queue.length === 1 ? 'track' : 'tracks'} in queue
        </div>
      </div>
    </>
  );
};
