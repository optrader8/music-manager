import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicService } from "../services/musicService";
import type { PaginationParams, SearchFilters } from "../types/api";
import type { AudioQuality, PlaybackQueue } from "../types/playback";

// Query keys for cache management
export const musicQueryKeys = {
  all: ["music"] as const,
  stats: () => [...musicQueryKeys.all, "stats"] as const,
  albums: () => [...musicQueryKeys.all, "albums"] as const,
  albumList: (params: PaginationParams & SearchFilters) =>
    [...musicQueryKeys.albums(), "list", params] as const,
  album: (id: number) => [...musicQueryKeys.albums(), "detail", id] as const,
  albumTracks: (id: number, params?: PaginationParams) =>
    [...musicQueryKeys.album(id), "tracks", params] as const,
  albumQueue: (
    id: number,
    options?: { quality?: string; crossfadeSeconds?: number; gapless?: boolean },
  ) => [...musicQueryKeys.album(id), "queue", options] as const,
  artists: () => [...musicQueryKeys.all, "artists"] as const,
  artistList: (params: PaginationParams & SearchFilters) =>
    [...musicQueryKeys.artists(), "list", params] as const,
  artist: (id: number) => [...musicQueryKeys.artists(), "detail", id] as const,
  tracks: () => [...musicQueryKeys.all, "tracks"] as const,
  trackList: (params: PaginationParams & SearchFilters) =>
    [...musicQueryKeys.tracks(), "list", params] as const,
  track: (id: number) => [...musicQueryKeys.tracks(), "detail", id] as const,
};

// Library stats hook
export function useLibraryStats() {
  return useQuery({
    queryKey: musicQueryKeys.stats(),
    queryFn: musicService.getLibraryStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Albums hooks
export function useAlbums(params: PaginationParams & SearchFilters) {
  return useQuery({
    queryKey: musicQueryKeys.albumList(params),
    queryFn: () => musicService.getAlbums(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useInfiniteAlbums(baseParams: Omit<PaginationParams, "page"> & SearchFilters) {
  return useInfiniteQuery({
    queryKey: musicQueryKeys.albumList({ ...baseParams, page: 1 }),
    queryFn: ({ pageParam = 1 }) => musicService.getAlbums({ ...baseParams, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.has_next ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAlbum(id: number) {
  return useQuery({
    queryKey: musicQueryKeys.album(id),
    queryFn: () => musicService.getAlbum(id),
    enabled: !!id,
  });
}

export function useAlbumTracks(albumId: number, params?: PaginationParams) {
  return useQuery({
    queryKey: musicQueryKeys.albumTracks(albumId, params),
    queryFn: () => musicService.getAlbumTracks(albumId, params),
    enabled: !!albumId,
  });
}

export function useAlbumPlaybackQueue(
  albumId: number,
  options?: { quality?: AudioQuality; crossfadeSeconds?: number; gapless?: boolean },
) {
  return useQuery<PlaybackQueue>({
    queryKey: musicQueryKeys.albumQueue(albumId, options),
    queryFn: () => musicService.getAlbumPlaybackQueue(albumId, options),
    enabled: !!albumId,
    staleTime: 1000 * 30,
  });
}

// Artists hooks
export function useArtists(params: PaginationParams & SearchFilters) {
  return useQuery({
    queryKey: musicQueryKeys.artistList(params),
    queryFn: () => musicService.getArtists(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useArtist(id: number) {
  return useQuery({
    queryKey: musicQueryKeys.artist(id),
    queryFn: () => musicService.getArtist(id),
    enabled: !!id,
  });
}

// Tracks hooks
export function useTracks(params: PaginationParams & SearchFilters) {
  return useQuery({
    queryKey: musicQueryKeys.trackList(params),
    queryFn: () => musicService.getTracks(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTrack(id: number) {
  return useQuery({
    queryKey: musicQueryKeys.track(id),
    queryFn: () => musicService.getTrack(id),
    enabled: !!id,
  });
}

// Library scan hooks
export function useLibraryScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: musicService.scanLibrary,
    onSuccess: () => {
      // Invalidate all music-related queries after scan
      queryClient.invalidateQueries({ queryKey: musicQueryKeys.all });
    },
  });
}

export function useScanStatus(taskId: string | null) {
  return useQuery({
    queryKey: ["scan-status", taskId],
    queryFn: () => musicService.getScanStatus(taskId!),
    enabled: !!taskId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}
