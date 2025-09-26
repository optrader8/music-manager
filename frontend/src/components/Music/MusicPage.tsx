import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid, List, SortAsc } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import { MusicCard } from "@/components/MusicCard/MusicCard";

// Mock API call - replace with actual API
const fetchMusicLibrary = async () => {
  return {
    albums: [
      {
        id: "1",
        title: "Abbey Road",
        artist: "The Beatles",
        coverArt: undefined,
        trackCount: 17,
        year: 1969,
      },
      {
        id: "2",
        title: "The Dark Side of the Moon",
        artist: "Pink Floyd",
        coverArt: undefined,
        trackCount: 10,
        year: 1973,
      },
      {
        id: "3",
        title: "Thriller",
        artist: "Michael Jackson",
        coverArt: undefined,
        trackCount: 9,
        year: 1982,
      },
      {
        id: "4",
        title: "Led Zeppelin IV",
        artist: "Led Zeppelin",
        coverArt: undefined,
        trackCount: 8,
        year: 1971,
      },
      {
        id: "5",
        title: "Rumours",
        artist: "Fleetwood Mac",
        coverArt: undefined,
        trackCount: 11,
        year: 1977,
      },
      {
        id: "6",
        title: "Hotel California",
        artist: "Eagles",
        coverArt: undefined,
        trackCount: 9,
        year: 1976,
      },
    ],
    artists: [
      { id: "1", name: "The Beatles", albumCount: 13 },
      { id: "2", name: "Pink Floyd", albumCount: 15 },
      { id: "3", name: "Michael Jackson", albumCount: 10 },
    ],
    folders: [
      { id: "1", name: "Rock Classics", path: "/music/rock", trackCount: 245 },
      { id: "2", name: "Jazz Collection", path: "/music/jazz", trackCount: 189 },
      { id: "3", name: "Electronic", path: "/music/electronic", trackCount: 156 },
      { id: "4", name: "Classical", path: "/music/classical", trackCount: 98 },
    ],
  };
};

export const MusicPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");

  const { data, isLoading, error } = useQuery({
    queryKey: ["music-library"],
    queryFn: fetchMusicLibrary,
    staleTime: 300_000, // 5 minutes
  });

  const handlePlayItem = (id: string, type: string) => {
    console.log(`Playing ${type}:`, id);
  };

  const handleAddToPlaylist = (id: string) => {
    console.log("Add to playlist:", id);
  };

  const handleShowDetails = (id: string) => {
    console.log("Show details:", id);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl" />
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
          <h3 className="text-red-800 font-medium">Error Loading Music Library</h3>
          <p className="text-red-600 mt-1">Unable to load your music collection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Music Library</h1>
          <p className="text-gray-600 mt-1">Browse and organize your music collection</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search music..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Sort */}
          <Select.Root value={sortBy} onValueChange={setSortBy}>
            <Select.Trigger className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <SortAsc size={16} />
              <Select.Value />
              <Select.Icon />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[120px] z-50">
                <Select.Item
                  value="name"
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Select.ItemText>Name</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="artist"
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Select.ItemText>Artist</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="year"
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Select.ItemText>Year</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="tracks"
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Select.ItemText>Track Count</Select.ItemText>
                </Select.Item>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="folders" className="w-full">
        <Tabs.List className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <Tabs.Trigger
            value="folders"
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
          >
            Folders ({data.folders.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="albums"
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
          >
            Albums ({data.albums.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="artists"
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
          >
            Artists ({data.artists.length})
          </Tabs.Trigger>
        </Tabs.List>

        {/* Folders Tab */}
        <Tabs.Content value="folders" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {data.folders.map((folder) => (
              <MusicCard
                key={folder.id}
                id={folder.id}
                title={folder.name}
                subtitle={folder.path}
                type="folder"
                trackCount={folder.trackCount}
                onClick={() => console.log("Open folder:", folder.id)}
                onPlay={() => handlePlayItem(folder.id, "folder")}
                onAddToPlaylist={() => handleAddToPlaylist(folder.id)}
                onShowDetails={() => handleShowDetails(folder.id)}
              />
            ))}
          </div>
        </Tabs.Content>

        {/* Albums Tab */}
        <Tabs.Content value="albums" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {data.albums.map((album) => (
              <MusicCard
                key={album.id}
                id={album.id}
                title={album.title}
                subtitle={`${album.artist} • ${album.year}`}
                coverArt={album.coverArt}
                type="album"
                trackCount={album.trackCount}
                onClick={() => console.log("Open album:", album.id)}
                onPlay={() => handlePlayItem(album.id, "album")}
                onAddToPlaylist={() => handleAddToPlaylist(album.id)}
                onShowDetails={() => handleShowDetails(album.id)}
              />
            ))}
          </div>
        </Tabs.Content>

        {/* Artists Tab */}
        <Tabs.Content value="artists" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {data.artists.map((artist) => (
              <MusicCard
                key={artist.id}
                id={artist.id}
                title={artist.name}
                subtitle={`${artist.albumCount} albums`}
                type="artist"
                onClick={() => console.log("Open artist:", artist.id)}
                onPlay={() => handlePlayItem(artist.id, "artist")}
                onAddToPlaylist={() => handleAddToPlaylist(artist.id)}
                onShowDetails={() => handleShowDetails(artist.id)}
              />
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
