import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Play, Pause, Clock, Calendar, Disc, Music, X } from 'lucide-react';
import { useAlbumTracks } from '../hooks/useMusicLibrary';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { musicService } from '../services/musicService';
import type { AlbumWithTracks } from '../types/api';

interface AlbumDetailModalProps {
  album: AlbumWithTracks | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayAlbum?: (album: AlbumWithTracks) => void;
  onPlayTrack?: (trackId: number) => void;
}

interface TrackRowProps {
  track: TrackWithRelations;
  index: number;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
  onPause: () => void;
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isPlaying,
  isCurrentTrack,
  onPlay,
  onPause,
}) => {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isCurrentTrack
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          : ''
      }`}
    >
      {/* Track Number */}
      <div className="w-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {track.track_number || index + 1}
      </div>

      {/* Play Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={isPlaying ? onPause : onPlay}
        className="w-8 h-8 p-0"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </Button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{track.title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {track.artist?.name || 'Unknown Artist'}
        </p>
      </div>

      {/* Track Metadata */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {track.disc_number && track.disc_number > 1 && (
          <Badge variant="outline" className="text-xs">
            <Disc className="w-3 h-3 mr-1" />
            {track.disc_number}
          </Badge>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(track.duration_seconds)}
        </span>
      </div>
    </div>
  );
};

export const AlbumDetailModal: React.FC<AlbumDetailModalProps> = ({
  album,
  isOpen,
  onClose,
  onPlayAlbum,
  onPlayTrack,
}) => {
  const { currentTrack, isPlaying, pause } = useAudioPlayer();

  // Fetch album tracks if album has tracks, otherwise use the provided tracks
  const { data: albumData, isLoading } = useAlbumTracks(album?.id || 0, {
    enabled: !!album?.id && !album.tracks,
  });

  const displayAlbum = album || albumData;
  const tracks = displayAlbum?.tracks || [];

  const handlePlayAlbum = () => {
    if (displayAlbum && onPlayAlbum) {
      onPlayAlbum(displayAlbum);
    } else if (tracks.length > 0) {
      // Convert tracks to PlaybackTrack format and play
      const playbackTracks = tracks.map((track) => ({
        track_id: track.id,
        title: track.title,
        stream_url: `/api/v1/stream/tracks/${track.id}`,
        duration_seconds: track.duration_seconds,
        disc_number: track.disc_number,
        track_number: track.track_number,
        artist_name: track.artist?.name,
      }));
      // This would need to be implemented in the audio player context
      console.log('Playing album tracks:', playbackTracks);
    }
  };

  const handlePlayTrack = (trackId: number) => {
    if (onPlayTrack) {
      onPlayTrack(trackId);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration_seconds || 0), 0);

  if (!displayAlbum) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header with Album Art */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-6">
              {/* Album Cover */}
              <div className="flex-shrink-0">
                <img
                  src={musicService.getAlbumArtworkUrl(displayAlbum.id, 'large')}
                  alt={`${displayAlbum.title} cover`}
                  className="w-48 h-48 rounded-lg shadow-lg object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = '/placeholder-album.png'; // Fallback image
                  }}
                />
              </div>

              {/* Album Info */}
              <div className="flex-1 min-w-0">
                <DialogHeader className="text-left mb-4">
                  <DialogTitle className="text-2xl font-bold mb-2">
                    {displayAlbum.title}
                  </DialogTitle>
                  <p className="text-xl text-gray-200 mb-2">
                    {displayAlbum.artist?.name || 'Unknown Artist'}
                  </p>
                </DialogHeader>

                {/* Album Metadata */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-300">
                  {displayAlbum.release_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {displayAlbum.release_year}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {tracks.length} tracks
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </div>
                  {displayAlbum.genre && (
                    <Badge variant="secondary" className="text-xs">
                      {displayAlbum.genre}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handlePlayAlbum}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Album
                  </Button>
                  {/* Add more action buttons here if needed */}
                </div>
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <ScrollArea className="flex-1 px-6">
            <div className="py-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Tracks
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                      <div className="w-8 h-4 bg-gray-200 rounded" />
                      <div className="w-8 h-8 bg-gray-200 rounded" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="w-16 h-4 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : tracks.length > 0 ? (
                <div className="space-y-1">
                  {tracks.map((track, index) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={index}
                      isPlaying={isPlaying && currentTrack?.id === track.id}
                      isCurrentTrack={currentTrack?.id === track.id}
                      onPlay={() => handlePlayTrack(track.id)}
                      onPause={pause}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tracks available for this album</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
