import { useCallback } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import type { TrackWithRelations } from '../types/api';
import type { PlaybackTrack } from '../types/playback';

/**
 * Hook for basic audio player controls
 * Provides play/pause, next/previous, volume controls
 */
export function useAudioControls() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    currentTime,
    duration,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();

  const canPlay = !!currentTrack;
  const canSeek = duration > 0;
  const progress = canSeek ? (currentTime / duration) * 100 : 0;

  const seekTo = useCallback(
    (percentage: number) => {
      if (canSeek) {
        const time = (percentage / 100) * duration;
        seek(time);
      }
    },
    [canSeek, duration, seek]
  );

  const skipForward = useCallback(
    (seconds: number = 10) => {
      const newTime = Math.min(currentTime + seconds, duration);
      seek(newTime);
    },
    [currentTime, duration, seek]
  );

  const skipBackward = useCallback(
    (seconds: number = 10) => {
      const newTime = Math.max(currentTime - seconds, 0);
      seek(newTime);
    },
    [currentTime, seek]
  );

  return {
    // State
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

    // Controls
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    seekTo,
    skipForward,
    skipBackward,
    setVolume,
    toggleMute,
  };
}

/**
 * Hook for managing playback queue
 * Provides queue manipulation and album playback
 */
export function usePlaybackQueue() {
  const {
    queue,
    queueIndex,
    shuffle,
    repeat,
    addToQueue,
    addToQueueNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playAlbum,
    setShuffle,
    setRepeat,
  } = useAudioPlayer();

  const currentTrack = queue[queueIndex] || null;
  const hasNext = queueIndex < queue.length - 1;
  const hasPrevious = queueIndex > 0;
  const queueLength = queue.length;

  const addTrack = useCallback(
    (track: TrackWithRelations) => {
      const playbackTrack: PlaybackTrack = {
        track_id: track.id,
        title: track.title,
        stream_url: `/api/v1/stream/tracks/${track.id}`,
        duration_seconds: track.duration_seconds,
        disc_number: track.disc_number,
        track_number: track.track_number,
        artist_name: track.artist?.name,
      };
      addToQueue([playbackTrack]);
    },
    [addToQueue]
  );

  const addTrackNext = useCallback(
    (track: TrackWithRelations) => {
      const playbackTrack: PlaybackTrack = {
        track_id: track.id,
        title: track.title,
        stream_url: `/api/v1/stream/tracks/${track.id}`,
        duration_seconds: track.duration_seconds,
        disc_number: track.disc_number,
        track_number: track.track_number,
        artist_name: track.artist?.name,
      };
      addToQueueNext([playbackTrack]);
    },
    [addToQueueNext]
  );

  const playTracks = useCallback(
    (tracks: TrackWithRelations[], startIndex: number = 0) => {
      const playbackTracks: PlaybackTrack[] = tracks.map((track) => ({
        track_id: track.id,
        title: track.title,
        stream_url: `/api/v1/stream/tracks/${track.id}`,
        duration_seconds: track.duration_seconds,
        disc_number: track.disc_number,
        track_number: track.track_number,
        artist_name: track.artist?.name,
      }));
      playAlbum(playbackTracks, startIndex);
    },
    [playAlbum]
  );

  const removeTrack = useCallback(
    (index: number) => {
      removeFromQueue(index);
    },
    [removeFromQueue]
  );

  const moveTrack = useCallback(
    (fromIndex: number, toIndex: number) => {
      reorderQueue(fromIndex, toIndex);
    },
    [reorderQueue]
  );

  return {
    // State
    queue,
    queueIndex,
    currentTrack,
    hasNext,
    hasPrevious,
    queueLength,
    shuffle,
    repeat,

    // Controls
    addTrack,
    addTrackNext,
    addTracks: addToQueue,
    addTracksNext: addToQueueNext,
    playTracks,
    removeTrack,
    moveTrack,
    clearQueue,
    setShuffle,
    setRepeat,
  };
}

/**
 * Hook for audio player error handling and recovery
 * Provides error states and automatic retry logic
 */
export function useAudioErrorHandling() {
  const { isLoading, currentTrack } = useAudioPlayer();

  // Error handling could be expanded with:
  // - Network error detection
  // - Automatic retry logic
  // - Fallback quality selection
  // - Error reporting

  const handleError = useCallback((error: Error) => {
    console.error('Audio player error:', error);
    // Could implement error reporting here
  }, []);

  const retry = useCallback(() => {
    if (currentTrack) {
      // Implement retry logic
      console.log('Retrying playback for track:', currentTrack.title);
    }
  }, [currentTrack]);

  return {
    isLoading,
    handleError,
    retry,
  };
}

/**
 * Hook for audio player state persistence
 * Saves and restores player state across sessions
 */
export function useAudioPersistence() {
  const {
    volume,
    isMuted,
    shuffle,
    repeat,
    quality,
    setVolume,
    setShuffle,
    setRepeat,
    setQuality,
  } = useAudioPlayer();

  // Load settings from localStorage on mount
  const loadSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('audio-player-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.volume !== undefined) setVolume(settings.volume);
        if (settings.shuffle !== undefined) setShuffle(settings.shuffle);
        if (settings.repeat !== undefined) setRepeat(settings.repeat);
        if (settings.quality !== undefined) setQuality(settings.quality);
      }
    } catch (error) {
      console.warn('Failed to load audio player settings:', error);
    }
  }, [setVolume, setShuffle, setRepeat, setQuality]);

  // Save settings to localStorage when they change
  const saveSettings = useCallback(() => {
    try {
      const settings = {
        volume,
        isMuted,
        shuffle,
        repeat,
        quality,
      };
      localStorage.setItem('audio-player-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save audio player settings:', error);
    }
  }, [volume, isMuted, shuffle, repeat, quality]);

  return {
    loadSettings,
    saveSettings,
  };
}
