// Default placeholder image as data URL
export const DEFAULT_ALBUM_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iIzlDQTlCQSIvPjxwYXRoIGQ9Ik03MCAzMGM4IDAgMTUgMyAyMCA4czUgMTIgNSAyMGMwIDggLTUgMTUgLTEwIDIwcy0xMiA1IC0yMCA1cy0xNSAtMyAtMjAgLThzLTUgLTEyIC01IC0yMGMwIC04IDUgLTE1IDEwIC0yMHMxMiAtNSAyMCAtNXoiIGZpbGw9IiM5Q0E5QkEiLz4KPHRleHQgeD0iMTAwIiB5PSIxNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZCNzg4RCI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Virtual scrolling constants
export const ALBUM_CARD_WIDTH = 200;
export const ALBUM_CARD_HEIGHT = 280;
export const GRID_PADDING = 16;

// Debounce delays
export const SEARCH_DEBOUNCE_MS = 300;
export const RESIZE_DEBOUNCE_MS = 100;

// Audio formats
export const SUPPORTED_AUDIO_FORMATS = ["MP3", "FLAC", "AAC", "OGG", "M4A", "WAV"] as const;

// Common genres
export const COMMON_GENRES = [
  "Rock",
  "Pop",
  "Jazz",
  "Classical",
  "Electronic",
  "Hip-Hop",
  "Country",
  "Blues",
  "Folk",
  "Reggae",
] as const;
