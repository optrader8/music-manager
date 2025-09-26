import React, { useState } from 'react';
import { AlbumGrid } from '../components/AlbumGrid';
import { AlbumDetailModal } from '../components/AlbumDetailModal';
import { useAlbum } from '../hooks/useMusicLibrary';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import type { Album } from '../types/api';

export function LibraryPage() {
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);

  const { data: selectedAlbum } = useAlbum(selectedAlbumId || 0, {
    enabled: !!selectedAlbumId,
  });
  const { playAlbum } = useAudioPlayer();

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbumId(album.id);
  };

  const handleCloseModal = () => {
    setSelectedAlbumId(null);
  };

  const handlePlayAlbum = (album: Album) => {
    // Convert album tracks to playback format and play
    if (album.tracks) {
      const playbackTracks = album.tracks.map((track) => ({
        track_id: track.id,
        title: track.title,
        stream_url: `/api/v1/stream/tracks/${track.id}`,
        duration_seconds: track.duration_seconds,
        disc_number: track.disc_number,
        track_number: track.track_number,
        artist_name: track.artist?.name,
      }));
      playAlbum(playbackTracks, 0);
    }
  };

  const handlePlayTrack = (trackId: number) => {
    // Individual track play would be implemented here
    console.log('Play track:', trackId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Browse your music collection</p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <AlbumGrid onAlbumClick={handleAlbumClick} />
        </div>
      </div>

      {/* Album Detail Modal */}
      <AlbumDetailModal
        album={selectedAlbum}
        isOpen={!!selectedAlbumId}
        onClose={handleCloseModal}
        onPlayAlbum={handlePlayAlbum}
        onPlayTrack={handlePlayTrack}
      />
    </div>
  );
}
