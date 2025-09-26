import React from "react";
import { Card, CardContent } from "./ui/card";
import { useLibraryStats } from "../hooks/useMusicLibrary";
import { formatFileSize } from "../lib/utils";

export function LibraryStats() {
  const { data: stats, isLoading, error } = useLibraryStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30"
          >
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/30">
        <CardContent className="p-6">
          <p className="text-red-600 dark:text-red-400">Failed to load library statistics</p>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: "Tracks",
      value: stats.total_tracks.toLocaleString(),
      color: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30",
      icon: "🎵",
    },
    {
      label: "Albums",
      value: stats.total_albums.toLocaleString(),
      color: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30",
      icon: "💿",
    },
    {
      label: "Artists",
      value: stats.total_artists.toLocaleString(),
      color: "from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30",
      icon: "🎤",
    },
    {
      label: "Total Size",
      value: formatFileSize(stats.total_size),
      color: "from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30",
      icon: "💾",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card
          key={index}
          className={`bg-gradient-to-br ${item.color} border-none shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
              </div>
              <div className="text-2xl opacity-60">{item.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
