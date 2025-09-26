import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music, Users, Album, Clock, HardDrive, Headphones } from 'lucide-react';

import { fetchDashboardData } from '@/services/musicApi';
import type { DashboardData } from '@/types/stats';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <div className={`p-6 rounded-lg shadow-sm border border-gray-200 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['stats', 'dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-600 mt-1">Unable to load music library statistics.</p>
        </div>
      </div>
    );
  }

  const { overview, recent_albums: recentAlbums, top_tracks: topTracks, scan_status: scanStatus } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Music Library Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your music collection</p>
        </div>
        <div className="text-sm text-gray-500">
          Updated {new Date(data.generated_at).toLocaleString()} · Scan status: {scanStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Tracks"
          value={overview.total_tracks.toLocaleString()}
          icon={<Music size={24} />}
          color="bg-blue-50"
        />

        <StatCard
          title="Artists"
          value={overview.total_artists.toLocaleString()}
          icon={<Users size={24} />}
          color="bg-green-50"
        />

        <StatCard
          title="Albums"
          value={overview.total_albums.toLocaleString()}
          icon={<Album size={24} />}
          color="bg-purple-50"
        />

        <StatCard
          title="Total Duration"
          value={`${overview.total_duration_hours.toFixed(1)} hours`}
          subtitle={`${Math.round(overview.total_duration_seconds / 60).toLocaleString()} minutes`}
          icon={<Clock size={24} />}
          color="bg-orange-50"
        />

        <StatCard
          title="Estimated Size"
          value={`${overview.estimated_size_mb.toFixed(1)} MB`}
          subtitle={overview.average_bitrate ? `${Math.round(overview.average_bitrate)} kbps avg` : undefined}
          icon={<HardDrive size={24} />}
          color="bg-yellow-50"
        />

        <StatCard
          title="Avg Track Length"
          value={overview.average_track_duration ? `${(overview.average_track_duration / 60).toFixed(1)} min` : '—'}
          subtitle={overview.recently_added_at ? `Last added ${new Date(overview.recently_added_at).toLocaleDateString()}` : undefined}
          icon={<Headphones size={24} />}
          color="bg-indigo-50"
        />
      </div>

      {recentAlbums.length ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recently Added Albums</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAlbums.map((album) => (
              <div
                key={album.id}
                className="flex items-center gap-4 p-4 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {album.cover_art_url ? (
                  <img src={album.cover_art_url} alt={album.title} className="h-16 w-16 rounded object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                    <Album size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{album.title}</h3>
                  <p className="text-sm text-gray-600">{album.artist?.name ?? 'Unknown Artist'}</p>
                  {album.release_year && (
                    <p className="text-xs text-gray-500 mt-1">Released {album.release_year}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {topTracks.length ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Top Played Tracks</h2>
            <span className="text-sm text-gray-500">Showing top {topTracks.length} tracks</span>
          </div>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topTracks.map((track) => (
                  <tr key={track.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{track.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {track.artist?.name ?? 'Unknown Artist'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {track.album?.title ?? 'Unknown Album'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {track.play_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
