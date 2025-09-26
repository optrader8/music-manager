import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Music,
  Users,
  Album,
  Clock,
  HardDrive,
  Headphones,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Search,
  RefreshCw,
  Plus,
  TrendingUp,
  Star,
  Disc3,
  Activity,
  Zap,
  Heart,
  AlertCircle,
} from "lucide-react";
import * as Progress from "@radix-ui/react-progress";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Separator from "@radix-ui/react-separator";

import { fetchDashboardData } from "@/services/musicApi";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import type { DashboardData } from "@/types/stats";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface MusicPlayerWidgetProps {
  currentTrack?: {
    title: string;
    artist: string;
    album?: string;
    duration: number;
    coverArt?: string;
  };
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onClick }) => (
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div
          className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
            onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg" : ""
          } ${color}`}
          onClick={onClick}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
              <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {icon}
              </div>
            </div>
          </div>
          {onClick && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl"
          sideOffset={5}
        >
          Click to view {title.toLowerCase()}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

const QuickAction: React.FC<QuickActionProps> = ({
  label,
  icon,
  onClick,
  variant = "secondary",
}) => (
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
            variant === "primary"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white hover:from-blue-600 hover:to-purple-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <div
            className={`transition-transform group-hover:scale-110 ${
              variant === "primary" ? "text-white" : "text-current"
            }`}
          >
            {icon}
          </div>
          <span className="font-medium">{label}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl"
          sideOffset={5}
        >
          {label}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

const MusicPlayerWidget: React.FC<MusicPlayerWidgetProps> = ({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
}) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 rounded-2xl shadow-xl">
    <div className="absolute inset-0 bg-black/20" />
    <div className="relative p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="text-lg font-semibold">Now Playing</h3>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 size={20} className="text-white/70" />
          <Progress.Root className="relative overflow-hidden bg-white/20 rounded-full w-20 h-1">
            <Progress.Indicator
              className="bg-white h-full transition-transform duration-300"
              style={{ transform: "translateX(-40%)" }}
            />
          </Progress.Root>
        </div>
      </div>

      {currentTrack ? (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 relative">
            {currentTrack.coverArt ? (
              <img
                src={currentTrack.coverArt}
                alt={currentTrack.album}
                className="w-16 h-16 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Disc3
                  size={24}
                  className="text-white animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
            )}
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{currentTrack.title}</h4>
            <p className="text-sm text-white/80 truncate">{currentTrack.artist}</p>
            {currentTrack.album && (
              <p className="text-xs text-white/60 truncate">{currentTrack.album}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={onPrev}
                    className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
                  >
                    <SkipBack size={18} className="text-white" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
                    sideOffset={5}
                  >
                    Previous
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-lg"
            >
              {isPlaying ? (
                <Pause size={20} className="text-white" />
              ) : (
                <Play size={20} className="text-white fill-white" />
              )}
            </button>

            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={onNext}
                    className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110"
                  >
                    <SkipForward size={18} className="text-white" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
                    sideOffset={5}
                  >
                    Next
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Disc3 size={48} className="text-white/30 mx-auto mb-3" />
          <p className="text-white/70">No track selected</p>
          <button className="mt-2 text-white/90 hover:text-white font-medium text-sm px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
            Browse Library
          </button>
        </div>
      )}
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["stats", "dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 30_000,
  });

  // Use real audio player state
  const { currentTrack, isPlaying, play, pause, next, previous } = useAudioPlayer();

  // Convert current track for display
  const displayTrack = currentTrack
    ? {
        title: currentTrack.title,
        artist: currentTrack.artist?.name || "Unknown Artist",
        album: currentTrack.album?.title,
        duration: currentTrack.duration_seconds || 0,
        coverArt: currentTrack.album?.cover_art_url,
      }
    : undefined;

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Handle navigation or modal opening
  };

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

  const {
    overview,
    recent_albums: recentAlbums,
    top_tracks: topTracks,
    scan_status: scanStatus,
  } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Music Dashboard</h1>
          <p className="text-gray-600 mt-1">Control your music library and discover new content</p>
        </div>
        <div className="text-sm text-gray-500">
          Updated {new Date(data.generated_at).toLocaleString()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={20} className="text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            label="Scan Library"
            icon={<RefreshCw size={18} />}
            onClick={() => handleQuickAction("scan")}
            variant="primary"
          />
          <QuickAction
            label="Search Music"
            icon={<Search size={18} />}
            onClick={() => handleQuickAction("search")}
          />
          <QuickAction
            label="New Playlist"
            icon={<Plus size={18} />}
            onClick={() => handleQuickAction("playlist")}
          />
          <QuickAction
            label="Analytics"
            icon={<TrendingUp size={18} />}
            onClick={() => handleQuickAction("analytics")}
          />
        </div>
      </div>

      {/* Music Player Widget */}
      <MusicPlayerWidget
        currentTrack={displayTrack}
        isPlaying={isPlaying}
        onPlay={() => play()}
        onPause={() => pause()}
        onNext={() => next()}
        onPrev={() => previous()}
      />

      {/* Library Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900">Library Overview</h2>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                scanStatus === "completed" ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                scanStatus === "completed"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}
            >
              {scanStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Tracks"
            value={overview.total_tracks.toLocaleString()}
            icon={<Music size={20} />}
            color="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            onClick={() => handleQuickAction("tracks")}
          />
          <StatCard
            title="Artists"
            value={overview.total_artists.toLocaleString()}
            icon={<Users size={20} />}
            color="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            onClick={() => handleQuickAction("artists")}
          />
          <StatCard
            title="Albums"
            value={overview.total_albums.toLocaleString()}
            icon={<Album size={20} />}
            color="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
            onClick={() => handleQuickAction("albums")}
          />
          <StatCard
            title="Duration"
            value={`${overview.total_duration_hours.toFixed(0)}h`}
            subtitle={`${Math.round(overview.total_duration_seconds / 60).toLocaleString()} min`}
            icon={<Clock size={20} />}
            color="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
          />
          <StatCard
            title="Size"
            value={`${(overview.estimated_size_mb / 1024).toFixed(1)} GB`}
            subtitle={`${Math.round(overview.average_bitrate || 0)} kbps`}
            icon={<HardDrive size={20} />}
            color="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
          />
          <StatCard
            title="Avg Length"
            value={
              overview.average_track_duration
                ? `${(overview.average_track_duration / 60).toFixed(1)}m`
                : "—"
            }
            icon={<Headphones size={20} />}
            color="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Albums */}
        {recentAlbums.length > 0 && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recently Added</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentAlbums.slice(0, 4).map((album) => (
                  <div
                    key={album.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="relative">
                      {album.cover_art_url ? (
                        <img
                          src={album.cover_art_url}
                          alt={album.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Album size={16} className="text-blue-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{album.title}</h3>
                      <p className="text-xs text-gray-600 truncate">
                        {album.artist?.name ?? "Unknown Artist"}
                      </p>
                      {album.release_year && (
                        <p className="text-xs text-gray-400">{album.release_year}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats & Charts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle size={20} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-900">Library Health</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">Complete metadata</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">89%</span>
                </div>
                <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-full h-2">
                  <Progress.Indicator
                    className="bg-green-400 h-full transition-transform duration-1000"
                    style={{ transform: "translateX(-11%)" }}
                  />
                </Progress.Root>
              </div>

              <Separator.Root className="bg-gray-200 h-px" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <span className="text-sm font-medium text-gray-700">Missing artwork</span>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  23 files
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <span className="text-sm font-medium text-gray-700">Duplicate files</span>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  5 files
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top Genres</h3>
            </div>
            <div className="space-y-4">
              {["Rock", "Pop", "Jazz", "Classical", "Electronic"].map((genre, index) => {
                const percentage = Math.floor(Math.random() * 60) + 20;
                const trackCount = Math.floor(Math.random() * 500) + 100;
                return (
                  <div
                    key={genre}
                    className="group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                            : index === 1
                              ? "bg-gradient-to-r from-gray-400 to-gray-500"
                              : index === 2
                                ? "bg-gradient-to-r from-amber-600 to-amber-700"
                                : "bg-gradient-to-r from-blue-500 to-purple-500"
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">{genre}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">{trackCount}</span>
                            <Heart
                              size={12}
                              className="text-gray-400 group-hover:text-red-400 transition-colors"
                            />
                          </div>
                        </div>
                        <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-full h-2">
                          <Progress.Indicator
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-transform duration-1000"
                            style={{ transform: `translateX(-${100 - percentage}%)` }}
                          />
                        </Progress.Root>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Tracks - More Compact Display */}
      {topTracks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-amber-500" />
              <h2 className="text-xl font-semibold text-gray-900">Most Played</h2>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topTracks.slice(0, 5).map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-blue-200"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                        : index === 2
                          ? "bg-gradient-to-r from-amber-600 to-amber-700"
                          : "bg-gradient-to-r from-blue-500 to-purple-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Music size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{track.title}</h3>
                  <p className="text-xs text-gray-600 truncate">
                    {track.artist?.name ?? "Unknown Artist"} ·{" "}
                    {track.album?.title ?? "Unknown Album"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-900">{track.play_count}</div>
                    <div className="text-xs text-gray-500">plays</div>
                  </div>
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-full hover:bg-blue-100">
                          <Play size={14} className="text-blue-600" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
                          sideOffset={5}
                        >
                          Play track
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
