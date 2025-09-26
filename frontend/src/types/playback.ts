export type AudioQuality = 'original' | 'high' | 'medium' | 'low';

export interface PlaybackTrack {
  track_id: number;
  title: string;
  stream_url: string;
  duration_seconds?: number | null;
  disc_number?: number | null;
  track_number?: number | null;
  artist_name?: string | null;
}

export interface PlaybackQueue {
  album_id?: number | null;
  album_title?: string | null;
  quality: AudioQuality;
  crossfade_seconds: number;
  gapless: boolean;
  total_duration_seconds: number;
  tracks: PlaybackTrack[];
  generated_at: string;
}
