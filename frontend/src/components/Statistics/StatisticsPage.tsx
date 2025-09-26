import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Music2, Users, Album, Disc } from 'lucide-react';

import {
  fetchGenreStats,
  fetchArtistStats,
  fetchAlbumStats,
  fetchQualityStats,
  fetchMostPlayedTracks,
  fetchRecentAlbums,
} from '@/services/musicApi';
import type {
  GenreStats,
  ArtistStats,
  AlbumStats,
  QualityStats,
  TrackPlayStatsResponse,
  AlbumListResponse,
} from '@/types/stats';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
];

interface StatsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const StatsSection: React.FC<StatsSectionProps> = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="text-gray-600">{icon}</div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

export const StatisticsPage: React.FC = () => {
  const { data: genreStats, isLoading: genreLoading } = useQuery<GenreStats[]>({
    queryKey: ['stats', 'genres'],
    queryFn: fetchGenreStats,
  });

  const { data: artistStats, isLoading: artistLoading } = useQuery<ArtistStats[]>({
    queryKey: ['stats', 'artists'],
    queryFn: fetchArtistStats,
  });

  const { data: albumStats, isLoading: albumLoading } = useQuery<AlbumStats[]>({
    queryKey: ['stats', 'albums'],
    queryFn: fetchAlbumStats,
  });

  const { data: qualityStats, isLoading: qualityLoading } = useQuery<QualityStats>({
    queryKey: ['stats', 'quality'],
    queryFn: fetchQualityStats,
  });

  const { data: mostPlayedTracks, isLoading: mostPlayedLoading } = useQuery<TrackPlayStatsResponse>(
    {
      queryKey: ['stats', 'most-played'],
      queryFn: () => fetchMostPlayedTracks(1, 20),
    }
  );

  const { data: recentAlbums, isLoading: recentAlbumsLoading } = useQuery<AlbumListResponse>({
    queryKey: ['stats', 'recent-albums'],
    queryFn: () => fetchRecentAlbums(1, 9),
  });

  if (
    genreLoading ||
    artistLoading ||
    albumLoading ||
    qualityLoading ||
    mostPlayedLoading ||
    recentAlbumsLoading
  ) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mostPlayedItems = mostPlayedTracks?.items ?? [];
  const recentAlbumItems = recentAlbums?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Music Statistics</h1>
        <p className="text-gray-600 mt-2">Detailed analysis of your music library</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsSection title="Genre Distribution" icon={<Music2 size={24} />}>
          {genreStats && genreStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreStats.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ genre, percent }) => `${genre} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="track_count"
                >
                  {genreStats.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No genre data available
            </div>
          )}
        </StatsSection>

        <StatsSection title="Top Artists by Track Count" icon={<Users size={24} />}>
          {artistStats && artistStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={artistStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="track_count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No artist data available
            </div>
          )}
        </StatsSection>

        <StatsSection title="Audio Quality Distribution" icon={<Disc size={24} />}>
          {qualityStats?.bitrate_distribution?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qualityStats.bitrate_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bitrate" tickFormatter={(value) => `${value} kbps`} />
                <YAxis />
                <Tooltip formatter={(value: number) => [value, 'Tracks']} />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No quality data available
            </div>
          )}
        </StatsSection>

        <StatsSection title="Longest Albums by Duration" icon={<Album size={24} />}>
          {albumStats && albumStats.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {albumStats.slice(0, 10).map((album, index) => (
                <div
                  key={`${album.title}-${index}`}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{album.title}</h4>
                    <p className="text-sm text-gray-600">{album.artist_name ?? 'Unknown Artist'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {album.total_duration_minutes.toFixed(1)} min
                    </div>
                    <div className="text-xs text-gray-500">{album.track_count} tracks</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No album data available
            </div>
          )}
        </StatsSection>
      </div>

      {recentAlbumItems.length ? (
        <StatsSection title="Recently Added Albums" icon={<Album size={24} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlbumItems.map((album) => (
              <div
                key={album.id}
                className="flex items-center gap-4 p-4 rounded border border-gray-200 bg-white shadow-xs"
              >
                {album.cover_art_url ? (
                  <img
                    src={album.cover_art_url}
                    alt={album.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                    <Album size={20} />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{album.title}</h4>
                  <p className="text-sm text-gray-600">{album.artist?.name ?? 'Unknown Artist'}</p>
                  {album.release_year && (
                    <p className="text-xs text-gray-500 mt-1">Released {album.release_year}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </StatsSection>
      ) : null}

      {mostPlayedItems.length ? (
        <StatsSection title="Most Played Tracks" icon={<Music2 size={24} />}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Track
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Album
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plays
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Played
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mostPlayedItems.map((track) => (
                  <tr key={track.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {track.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {track.artist?.name ?? 'Unknown Artist'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {track.album?.title ?? 'Unknown Album'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {track.play_count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {track.last_played_at ? new Date(track.last_played_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StatsSection>
      ) : null}

      {genreStats && genreStats.length > 0 ? (
        <StatsSection title="Detailed Genre Statistics" icon={<Music2 size={24} />}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Genre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration (Hours)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration/Track
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {genreStats.map((genre) => {
                  const durationHours = genre.total_duration_seconds / 3600;
                  const averageMinutes =
                    genre.track_count > 0
                      ? genre.total_duration_seconds / genre.track_count / 60
                      : 0;

                  return (
                    <tr key={genre.genre}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {genre.genre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {genre.track_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {durationHours.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {averageMinutes.toFixed(2)} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </StatsSection>
      ) : null}
    </div>
  );
};
