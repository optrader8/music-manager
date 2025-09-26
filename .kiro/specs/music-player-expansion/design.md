# Design Document

## Overview

This design expands the existing music management system into a comprehensive music player and library management platform similar to Plex or Navidrome. The system will provide paginated backend APIs, enhanced frontend components for album browsing, integrated music playback, and comprehensive library statistics. The architecture maintains the existing FastAPI backend with SQLAlchemy ORM and React frontend while adding new pagination patterns, audio streaming capabilities, and responsive UI components.

## Architecture

### Backend Architecture

The backend follows a layered architecture pattern:

```
┌─────────────────────────────────────────┐
│              API Layer                  │
│  (FastAPI Routes with Pagination)       │
├─────────────────────────────────────────┤
│            Service Layer                │
│  (Business Logic & Data Processing)     │
├─────────────────────────────────────────┤
│           Repository Layer              │
│  (Data Access with SQLAlchemy)          │
├─────────────────────────────────────────┤
│            Database Layer               │
│        (SQLite with FTS)                │
└─────────────────────────────────────────┘
```

### Frontend Architecture

The frontend uses a component-based architecture with React:

```
┌─────────────────────────────────────────┐
│            Pages Layer                  │
│  (Route Components & Layout)            │
├─────────────────────────────────────────┤
│          Components Layer               │
│  (Reusable UI Components)               │
├─────────────────────────────────────────┤
│           Services Layer                │
│  (API Clients & Business Logic)         │
├─────────────────────────────────────────┤
│            Hooks Layer                  │
│  (State Management & Side Effects)      │
├─────────────────────────────────────────┤
│           Context Layer                 │
│  (Global State & Audio Player)          │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Pagination Service
```python
@dataclass
class PaginationParams:
    page: int = 1
    page_size: int = 20
    max_page_size: int = 100

@dataclass
class PaginatedResponse[T]:
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
```

#### 2. Enhanced Album Service
```python
class AlbumService:
    def get_albums_paginated(
        self, 
        pagination: PaginationParams,
        filters: AlbumFilters,
        sort: AlbumSortOptions
    ) -> PaginatedResponse[AlbumWithTracks]
    
    def get_album_with_tracks(self, album_id: int) -> AlbumWithTracks
    
    def search_albums(
        self,
        query: str,
        pagination: PaginationParams
    ) -> PaginatedResponse[AlbumWithTracks]
```

#### 3. Enhanced Streaming Service
```python
class StreamingService:
    async def stream_track(self, track_id: int, range_header: str) -> StreamingResponse
    
    async def get_album_cover(self, album_id: int, size: CoverSize) -> StreamingResponse
    
    async def transcode_track(
        self, 
        track_id: int, 
        format: AudioFormat, 
        bitrate: str
    ) -> StreamingResponse
```

#### 4. Statistics Service
```python
class StatisticsService:
    def get_library_overview(self) -> LibraryOverview
    
    def get_recently_added_albums(self, limit: int) -> List[AlbumWithTracks]
    
    def get_most_played_tracks(self, limit: int) -> List[TrackWithPlayCount]
    
    def get_genre_distribution(self) -> List[GenreStats]
```

### Frontend Components

#### 1. Audio Player Context
```typescript
interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  repeat: RepeatMode;
  shuffle: boolean;
}

interface AudioPlayerActions {
  play: (track?: Track) => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (tracks: Track[]) => void;
  playAlbum: (album: Album) => void;
}
```

#### 2. Paginated Album Grid
```typescript
interface PaginatedAlbumGridProps {
  filters?: AlbumFilters;
  sortBy?: AlbumSortOption;
  onAlbumClick?: (album: Album) => void;
  pageSize?: number;
}

interface UsePaginatedAlbumsResult {
  albums: Album[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
  loadMore: () => void;
  refresh: () => void;
}
```

#### 3. Album Detail Modal
```typescript
interface AlbumDetailModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayAlbum: (album: Album) => void;
  onPlayTrack: (track: Track) => void;
}
```

#### 4. Player Controls
```typescript
interface PlayerControlsProps {
  className?: string;
  showQueue?: boolean;
  showVolume?: boolean;
  compact?: boolean;
}

interface PlayerQueueProps {
  isOpen: boolean;
  onClose: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}
```

## Data Models

### Enhanced Schemas

#### Album Schema Extensions
```python
class AlbumWithTracks(AlbumWithArtist):
    tracks: List[TrackRead] = []
    total_tracks: int = 0
    total_duration: float = 0
    cover_art_url: Optional[str] = None

class AlbumFilters(BaseModel):
    search: Optional[str] = None
    artist_id: Optional[int] = None
    genre: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    has_cover_art: Optional[bool] = None

class AlbumSortOptions(str, Enum):
    TITLE_ASC = "title_asc"
    TITLE_DESC = "title_desc"
    ARTIST_ASC = "artist_asc"
    ARTIST_DESC = "artist_desc"
    YEAR_ASC = "year_asc"
    YEAR_DESC = "year_desc"
    RECENTLY_ADDED = "recently_added"
    MOST_PLAYED = "most_played"
```

#### Track Schema Extensions
```python
class TrackWithPlayback(TrackRead):
    stream_url: str
    cover_art_url: Optional[str] = None
    waveform_url: Optional[str] = None

class PlaybackSession(BaseModel):
    track_id: int
    started_at: datetime
    duration_played: float
    completed: bool
```

### Frontend Type Extensions
```typescript
interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface AlbumWithTracks extends Album {
  tracks: Track[];
  totalTracks: number;
  totalDuration: number;
  coverArtUrl?: string;
}

interface AudioPlayerQueue {
  tracks: Track[];
  currentIndex: number;
  originalAlbum?: Album;
  originalPlaylist?: Playlist;
}
```

## Error Handling

### Backend Error Handling

#### API Error Responses
```python
class APIError(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

class PaginationError(HTTPException):
    def __init__(self, message: str):
        super().__init__(status_code=400, detail=message)

class StreamingError(HTTPException):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=message)
```

#### Error Handling Middleware
- Request validation errors with detailed field information
- Database connection error handling with retry logic
- File streaming errors with appropriate HTTP status codes
- Rate limiting for streaming endpoints

### Frontend Error Handling

#### Error Boundary Components
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface AudioErrorHandling {
  onLoadError: (track: Track, error: Error) => void;
  onPlaybackError: (track: Track, error: Error) => void;
  onNetworkError: (error: Error) => void;
}
```

#### Error Recovery Strategies
- Automatic retry for failed API requests
- Fallback to lower quality streams on playback errors
- Graceful degradation when cover art fails to load
- User notification system for persistent errors

## Testing Strategy

### Backend Testing

#### Unit Tests
- Service layer tests with mocked dependencies
- Repository pattern tests with in-memory database
- Pagination logic validation
- Audio streaming functionality tests

#### Integration Tests
- API endpoint tests with test database
- Database migration tests
- File streaming integration tests
- Search functionality end-to-end tests

#### Performance Tests
- Pagination performance with large datasets
- Concurrent streaming load tests
- Database query optimization validation
- Memory usage monitoring during streaming

### Frontend Testing

#### Component Tests
- Album grid rendering and pagination
- Audio player controls functionality
- Modal interactions and state management
- Responsive design validation

#### Integration Tests
- API integration with mock server
- Audio playback functionality
- Navigation and routing tests
- Error handling scenarios

#### End-to-End Tests
- Complete user workflows (browse → play → queue)
- Cross-browser compatibility
- Mobile device functionality
- Performance benchmarks

### Test Data Management
- Automated test music library generation
- Mock audio files for streaming tests
- Database seeding for consistent test scenarios
- CI/CD pipeline integration with test coverage reporting

## Performance Considerations

### Backend Optimizations
- Database query optimization with proper indexing
- Lazy loading for album track relationships
- Caching layer for frequently accessed data
- Connection pooling for database connections
- Streaming optimization with range request support

### Frontend Optimizations
- Virtual scrolling for large album grids
- Image lazy loading and progressive enhancement
- Audio preloading and buffering strategies
- Component memoization and React optimization
- Service worker for offline functionality

### Caching Strategy
- Redis cache for API responses
- Browser cache for static assets
- CDN integration for audio streaming
- Database query result caching
- Client-side state persistence