import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import type { TrackWithRelations, AudioQuality } from '../types/api';
import type { PlaybackTrack } from '../types/playback';

// Audio Player State Types
export interface AudioPlayerState {
  // Playback state
  currentTrack: TrackWithRelations | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;

  // Queue management
  queue: PlaybackTrack[];
  originalQueue: PlaybackTrack[];
  queueIndex: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';

  // Playback settings
  quality: AudioQuality;

  // UI state
  showPlayer: boolean;
  expandedPlayer: boolean;
}

export interface AudioPlayerActions {
  // Playback controls
  play: (track?: TrackWithRelations) => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Queue management
  addToQueue: (tracks: PlaybackTrack[]) => void;
  addToQueueNext: (tracks: PlaybackTrack[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playAlbum: (tracks: PlaybackTrack[], startIndex?: number) => void;

  // Settings
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'off' | 'one' | 'all') => void;
  setQuality: (quality: AudioQuality) => void;

  // UI
  togglePlayerVisibility: () => void;
  togglePlayerExpanded: () => void;
}

// Action Types
type AudioPlayerAction =
  | { type: 'SET_CURRENT_TRACK'; payload: TrackWithRelations | null }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_QUEUE'; payload: PlaybackTrack[] }
  | { type: 'SET_QUEUE_INDEX'; payload: number }
  | { type: 'SET_SHUFFLE'; payload: boolean }
  | { type: 'SET_REPEAT'; payload: 'off' | 'one' | 'all' }
  | { type: 'SET_QUALITY'; payload: AudioQuality }
  | { type: 'TOGGLE_PLAYER_VISIBILITY' }
  | { type: 'TOGGLE_PLAYER_EXPANDED' }
  | { type: 'ADD_TO_QUEUE'; payload: PlaybackTrack[] }
  | { type: 'ADD_TO_QUEUE_NEXT'; payload: PlaybackTrack[] }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'REORDER_QUEUE'; payload: { fromIndex: number; toIndex: number } };

// Initial State
const initialState: AudioPlayerState = {
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  volume: 0.7,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  queue: [],
  originalQueue: [],
  queueIndex: -1,
  shuffle: false,
  repeat: 'off',
  quality: 'high' as AudioQuality,
  showPlayer: false,
  expandedPlayer: false,
};

// Reducer
function audioPlayerReducer(state: AudioPlayerState, action: AudioPlayerAction): AudioPlayerState {
  switch (action.type) {
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload, showPlayer: !!action.payload };

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_VOLUME':
      return { ...state, volume: action.payload };

    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };

    case 'SET_DURATION':
      return { ...state, duration: action.payload };

    case 'SET_QUEUE':
      return { ...state, queue: action.payload, originalQueue: action.payload };

    case 'SET_QUEUE_INDEX':
      return { ...state, queueIndex: action.payload };

    case 'SET_SHUFFLE':
      return { ...state, shuffle: action.payload };

    case 'SET_REPEAT':
      return { ...state, repeat: action.payload };

    case 'SET_QUALITY':
      return { ...state, quality: action.payload };

    case 'TOGGLE_PLAYER_VISIBILITY':
      return { ...state, showPlayer: !state.showPlayer };

    case 'TOGGLE_PLAYER_EXPANDED':
      return { ...state, expandedPlayer: !state.expandedPlayer };

    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, ...action.payload] };

    case 'ADD_TO_QUEUE_NEXT': {
      const newQueue = [...state.queue];
      newQueue.splice(state.queueIndex + 1, 0, ...action.payload);
      return { ...state, queue: newQueue };
    }

    case 'REMOVE_FROM_QUEUE': {
      const filteredQueue = state.queue.filter((_, index) => index !== action.payload);
      let newIndex = state.queueIndex;
      if (action.payload < state.queueIndex) {
        newIndex = Math.max(0, state.queueIndex - 1);
      } else if (action.payload === state.queueIndex && filteredQueue.length > 0) {
        newIndex = Math.min(state.queueIndex, filteredQueue.length - 1);
      }
      return { ...state, queue: filteredQueue, queueIndex: newIndex };
    }

    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: [],
        originalQueue: [],
        queueIndex: -1,
        currentTrack: null,
        isPlaying: false,
      };

    case 'REORDER_QUEUE': {
      const reorderedQueue = [...state.queue];
      const [movedItem] = reorderedQueue.splice(action.payload.fromIndex, 1);
      reorderedQueue.splice(action.payload.toIndex, 0, movedItem);
      return { ...state, queue: reorderedQueue };
    }

    default:
      return state;
  }
}

// Context
const AudioPlayerContext = createContext<(AudioPlayerState & AudioPlayerActions) | null>(null);

// Provider Component
interface AudioPlayerProviderProps {
  children: React.ReactNode;
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio element setup
  // Play track at specific index
  const playTrackAtIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < state.queue.length) {
        const track = state.queue[index];
        dispatch({ type: 'SET_QUEUE_INDEX', payload: index });
        dispatch({ type: 'SET_CURRENT_TRACK', payload: track as unknown as TrackWithRelations });
        dispatch({ type: 'SET_LOADING', payload: true });

        if (audioRef.current) {
          audioRef.current.src = track.stream_url;
          // DO NOT auto-play - user must click play
        }
      }
    },
    [state.queue]
  );

  // Handle audio errors - COMPLETELY SILENT
  const handleAudioError = useCallback(() => {
    // ABSOLUTELY NO LOGGING OR OUTPUT
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_PLAYING', payload: false });
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch (e) {
        // Complete silence
      }
    }
  }, []);

  // Handle track end - NO auto-play
  const handleTrackEnd = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', payload: false });
    dispatch({ type: 'SET_LOADING', payload: false });

    // DO NOT auto-play next track or repeat
    // Auto-playback is disabled for this application
  }, []);

  // 개발 환경에서는 오디오 엘리먼트를 아예 생성하지 않음
  useEffect(() => {
    // 개발 환경에서는 오디오 기능 완전 비활성화
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    if (!audioRef.current) {
      try {
        audioRef.current = new Audio();
        audioRef.current.volume = state.volume;
        audioRef.current.preload = 'none';
        audioRef.current.crossOrigin = 'anonymous';

        audioRef.current.addEventListener('loadstart', () =>
          dispatch({ type: 'SET_LOADING', payload: true })
        );
        audioRef.current.addEventListener('canplay', () =>
          dispatch({ type: 'SET_LOADING', payload: false })
        );
        audioRef.current.addEventListener('timeupdate', () => {
          if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
            dispatch({ type: 'SET_CURRENT_TIME', payload: audioRef.current.currentTime });
          }
        });
        audioRef.current.addEventListener('durationchange', () => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            dispatch({ type: 'SET_DURATION', payload: audioRef.current.duration || 0 });
          }
        });
        audioRef.current.addEventListener('ended', handleTrackEnd);
        audioRef.current.addEventListener('error', handleAudioError);
        audioRef.current.addEventListener('abort', handleAudioError);
        audioRef.current.addEventListener('emptied', () => {
          dispatch({ type: 'SET_LOADING', payload: false });
        });
      } catch (error) {
        // 무시
      }
    }

    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.load();
        } catch (e) {
          // 무시
        }
      }
    };
  }, [handleAudioError, handleTrackEnd, state.volume]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
  }, [state.volume, state.isMuted]);

  // Actions
  const play = useCallback(
    (track?: TrackWithRelations) => {
      // 개발 환경에서는 오디오 재생 완전 비활성화
      if (process.env.NODE_ENV === 'development') {
        if (track) {
          dispatch({ type: 'SET_CURRENT_TRACK', payload: track });
        }
        return;
      }

      if (track) {
        const playbackTrack: PlaybackTrack = {
          track_id: track.id,
          title: track.title,
          stream_url: `/api/v1/stream/tracks/${track.id}`,
          duration_seconds: track.duration, // Use 'duration' instead of 'duration_seconds'
          disc_number: track.disc_number,
          track_number: track.track_number,
          artist_name: track.artist?.name,
        };

        dispatch({ type: 'SET_QUEUE', payload: [playbackTrack] });
        dispatch({ type: 'SET_QUEUE_INDEX', payload: 0 });
        dispatch({ type: 'SET_CURRENT_TRACK', payload: track });
        dispatch({ type: 'SET_LOADING', payload: true });

        if (audioRef.current) {
          try {
            audioRef.current.src = playbackTrack.stream_url;
            audioRef.current.load();
          } catch (error) {
            handleAudioError();
          }
        }
      } else if (audioRef.current && state.currentTrack) {
        audioRef.current.play().catch(handleAudioError);
        dispatch({ type: 'SET_PLAYING', payload: true });
      }
    },
    [state.currentTrack, handleAudioError]
  );

  const pause = useCallback(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    dispatch({ type: 'SET_PLAYING', payload: false });
  }, []);

  const togglePlayPause = useCallback(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const next = useCallback(() => {
    if (process.env.NODE_ENV === 'development') return;
    const nextIndex = state.queueIndex < state.queue.length - 1 ? state.queueIndex + 1 : 0;
    playTrackAtIndex(nextIndex);
  }, [state.queueIndex, state.queue.length, playTrackAtIndex]);

  const previous = useCallback(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      const prevIndex = state.queueIndex > 0 ? state.queueIndex - 1 : state.queue.length - 1;
      playTrackAtIndex(prevIndex);
    }
  }, [state.queueIndex, state.queue.length, playTrackAtIndex]);

  const seek = useCallback((time: number) => {
    if (process.env.NODE_ENV === 'development') return;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: Math.max(0, Math.min(1, volume)) });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'SET_MUTED', payload: !state.isMuted });
  }, [state.isMuted]);

  const addToQueue = useCallback((tracks: PlaybackTrack[]) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: tracks });
  }, []);

  const addToQueueNext = useCallback((tracks: PlaybackTrack[]) => {
    dispatch({ type: 'ADD_TO_QUEUE_NEXT', payload: tracks });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index });
  }, []);

  const clearQueue = useCallback(() => {
    dispatch({ type: 'CLEAR_QUEUE' });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_QUEUE', payload: { fromIndex, toIndex } });
  }, []);

  const playAlbum = useCallback(
    (tracks: PlaybackTrack[], startIndex: number = 0) => {
      dispatch({ type: 'SET_QUEUE', payload: tracks });
      playTrackAtIndex(startIndex);
    },
    [playTrackAtIndex]
  );

  const setShuffle = useCallback((shuffle: boolean) => {
    dispatch({ type: 'SET_SHUFFLE', payload: shuffle });
  }, []);

  const setRepeat = useCallback((repeat: 'off' | 'one' | 'all') => {
    dispatch({ type: 'SET_REPEAT', payload: repeat });
  }, []);

  const setQuality = useCallback((quality: AudioQuality) => {
    dispatch({ type: 'SET_QUALITY', payload: quality });
  }, []);

  const togglePlayerVisibility = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAYER_VISIBILITY' });
  }, []);

  const togglePlayerExpanded = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAYER_EXPANDED' });
  }, []);

  const contextValue: AudioPlayerState & AudioPlayerActions = {
    ...state,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    addToQueue,
    addToQueueNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playAlbum,
    setShuffle,
    setRepeat,
    setQuality,
    togglePlayerVisibility,
    togglePlayerExpanded,
  };

  return <AudioPlayerContext.Provider value={contextValue}>{children}</AudioPlayerContext.Provider>;
}

// Hook
// eslint-disable-next-line react-refresh/only-export-components
export function useAudioPlayer(): AudioPlayerState & AudioPlayerActions {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    // Return a safe default - NO WARNINGS
    return {
      ...initialState,
      play: () => {}, // Silent no-op
      pause: () => {},
      togglePlayPause: () => {},
      next: () => {},
      previous: () => {},
      seek: () => {},
      setVolume: () => {},
      toggleMute: () => {},
      addToQueue: () => {},
      addToQueueNext: () => {},
      removeFromQueue: () => {},
      clearQueue: () => {},
      reorderQueue: () => {},
      playAlbum: () => {},
      setShuffle: () => {},
      setRepeat: () => {},
      setQuality: () => {},
      togglePlayerVisibility: () => {},
      togglePlayerExpanded: () => {},
    };
  }
  return context;
}
