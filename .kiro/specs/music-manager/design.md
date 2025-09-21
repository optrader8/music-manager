# Design Document

## Overview

Music Manager는 마이크로서비스 아키텍처를 기반으로 한 웹 기반 음악 관리 및 스트리밍 시스템입니다. 시스템은 FastAPI 백엔드와 React 프론트엔드로 구성되며, SSHFS를 통해 원격 음악 서버에 접근하고 SQLite를 사용하여 메타데이터를 관리합니다.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        REACT[React Application]
        PLAYER[Audio Player]
    end
    
    subgraph "Backend Layer"
        API[FastAPI Server]
        AUTH[Authentication Service]
        STREAM[Streaming Service]
    end
    
    subgraph "Service Layer"
        SCANNER[File Scanner Service]
        DEJAVU[Dejavu Service]
        BROADCAST[Broadcast Service]
        METADATA[Metadata Service]
    end
    
    subgraph "Data Layer"
        DB[(SQLite Database)]
        CACHE[(Redis Cache)]
        FILES[/mnt/nas-music]
    end
    
    subgraph "External Services"
        MUSICBRAINZ[MusicBrainz API]
        FFMPEG[FFmpeg]
    end
    
    WEB --> REACT
    MOBILE --> REACT
    REACT --> API
    API --> AUTH
    API --> STREAM
    API --> SCANNER
    API --> DEJAVU
    API --> BROADCAST
    API --> METADATA
    
    SCANNER --> FILES
    SCANNER --> DB
    DEJAVU --> DB
    METADATA --> DB
    METADATA --> MUSICBRAINZ
    BROADCAST --> FFMPEG
    STREAM --> FILES
    
    API --> CACHE
```

### System Components

1. **Frontend Layer**: React 기반 SPA로 반응형 UI 제공
2. **API Gateway**: FastAPI를 통한 RESTful API 엔드포인트
3. **Service Layer**: 각 도메인별 비즈니스 로직 처리
4. **Data Layer**: SQLite 데이터베이스와 Redis 캐시
5. **File System**: SSHFS 마운트된 원격 음악 저장소

## Components and Interfaces

### Backend Components

#### 1. File Scanner Service
**Purpose**: 음악 파일 스캔 및 메타데이터 추출

**Key Methods**:
```python
class FileScannerService:
    async def scan_directory(self, path: str) -> ScanResult
    async def extract_metadata(self, file_path: str) -> TrackMetadata
    async def detect_file_changes(self) -> List[FileChange]
    async def calculate_file_hash(self, file_path: str) -> str
    async def detect_duplicates(self) -> List[DuplicateGroup]
```

**Dependencies**: 
- `mutagen` for metadata extraction
- `watchdog` for file system monitoring
- `hashlib` for duplicate detection

#### 2. Dejavu Service
**Purpose**: 음원 지문 생성 및 매칭

**Key Methods**:
```python
class DejavuService:
    async def generate_fingerprint(self, file_path: str) -> Fingerprint
    async def match_fingerprint(self, fingerprint: Fingerprint) -> MatchResult
    async def store_fingerprint(self, track_id: int, fingerprint: Fingerprint)
    async def get_confidence_score(self, match: MatchResult) -> float
```

**Dependencies**:
- `dejavu` library
- Audio processing utilities

#### 3. Streaming Service
**Purpose**: 음악 파일 스트리밍 및 HTTP 범위 요청 처리

**Key Methods**:
```python
class StreamingService:
    async def stream_audio(self, track_id: int, range_header: str) -> StreamResponse
    async def get_audio_info(self, track_id: int) -> AudioInfo
    async def create_hls_playlist(self, track_ids: List[int]) -> HLSPlaylist
    async def transcode_audio(self, file_path: str, format: str) -> bytes
```

#### 4. Broadcast Service
**Purpose**: 인터넷 방송 기능

**Key Methods**:
```python
class BroadcastService:
    async def start_broadcast(self, playlist_id: int, quality: BroadcastQuality)
    async def stop_broadcast(self, broadcast_id: int)
    async def get_broadcast_status(self, broadcast_id: int) -> BroadcastStatus
    async def schedule_broadcast(self, schedule: BroadcastSchedule)
```

**Dependencies**:
- `ffmpeg-python` for real-time encoding
- HLS segment generation

#### 5. Metadata Service
**Purpose**: 메타데이터 관리 및 외부 API 연동

**Key Methods**:
```python
class MetadataService:
    async def update_track_metadata(self, track_id: int, metadata: TrackMetadata)
    async def fetch_external_metadata(self, track: Track) -> ExternalMetadata
    async def suggest_metadata_corrections(self, track_id: int) -> List[MetadataSuggestion]
    async def batch_update_metadata(self, updates: List[MetadataUpdate])
```

### Frontend Components

#### 1. Audio Player Component
**Purpose**: 음악 재생 제어 및 상태 관리

**Key Features**:
- HTML5 Audio API 기반 재생
- 플레이리스트 관리
- 재생 상태 동기화
- 키보드 단축키 지원

```typescript
interface AudioPlayerProps {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}
```

#### 2. Library Browser Component
**Purpose**: 음악 라이브러리 브라우징 및 검색

**Key Features**:
- 가상 스크롤링으로 성능 최적화
- 실시간 검색 및 필터링
- 그리드/리스트 뷰 전환
- 정렬 및 그룹화

#### 3. Metadata Editor Component
**Purpose**: 메타데이터 편집 인터페이스

**Key Features**:
- 인라인 편집
- 배치 편집
- 앨범 아트워크 업로드
- 실행 취소/재실행

## Data Models

### Database Schema

```sql
-- Artists table
CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    bio TEXT,
    image_path TEXT,
    musicbrainz_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Albums table
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist_id INTEGER NOT NULL,
    album_artist TEXT, -- For compilation albums
    year INTEGER,
    genre TEXT,
    cover_art_path TEXT,
    back_cover_path TEXT, -- Back cover image
    booklet_path TEXT, -- PDF booklet or additional docs
    description TEXT, -- Album description
    musicbrainz_id TEXT UNIQUE,
    disc_id TEXT, -- CD DISCID for tracking
    total_tracks INTEGER,
    total_discs INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Tracks table
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    album_id INTEGER,
    artist_id INTEGER NOT NULL,
    track_number INTEGER,
    disc_number INTEGER DEFAULT 1,
    duration INTEGER, -- in seconds
    file_path TEXT UNIQUE NOT NULL,
    file_size INTEGER,
    file_hash TEXT UNIQUE,
    bitrate INTEGER,
    sample_rate INTEGER,
    format TEXT,
    performer TEXT, -- Performer information
    composer TEXT, -- Composer information
    comment TEXT, -- Additional comments/notes
    id3v1_comment TEXT, -- ID3v1 comment field
    dejavu_fingerprint BLOB,
    play_count INTEGER DEFAULT 0,
    last_played DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Playlists table
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    user_id INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    is_smart BOOLEAN DEFAULT FALSE,
    smart_criteria JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Playlist tracks junction table
CREATE TABLE playlist_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, track_id)
);

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Scan jobs table
CREATE TABLE scan_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    started_at DATETIME,
    completed_at DATETIME,
    files_scanned INTEGER DEFAULT 0,
    files_added INTEGER DEFAULT 0,
    files_updated INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Broadcast sessions table
CREATE TABLE broadcast_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    playlist_id INTEGER,
    quality TEXT NOT NULL,
    status TEXT NOT NULL, -- 'scheduled', 'live', 'ended'
    scheduled_start DATETIME,
    actual_start DATETIME,
    ended_at DATETIME,
    listener_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id)
);

-- Album metadata files table (for folder.info.md, booklet.pdf, etc.)
CREATE TABLE album_metadata_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    file_type TEXT NOT NULL, -- 'info', 'booklet', 'back_cover', 'liner_notes'
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- External identifiers table (for DISCID, MusicBrainz, etc.)
CREATE TABLE external_identifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'album', 'track', 'artist'
    entity_id INTEGER NOT NULL,
    identifier_type TEXT NOT NULL, -- 'discid', 'musicbrainz', 'spotify', 'lastfm'
    identifier_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, identifier_type)
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE tracks_fts USING fts5(
    title, album_title, artist_name, genre,
    content='tracks',
    content_rowid='id'
);

-- Indexes for performance
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_tracks_album_id ON tracks(album_id);
CREATE INDEX idx_tracks_file_hash ON tracks(file_hash);
CREATE INDEX idx_albums_artist_id ON albums(artist_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
```

### API Models

```python
# Pydantic models for API
class TrackBase(BaseModel):
    title: str
    track_number: Optional[int] = None
    disc_number: int = 1
    duration: Optional[int] = None

class TrackCreate(TrackBase):
    file_path: str
    artist_id: int
    album_id: Optional[int] = None

class Track(TrackBase):
    id: int
    artist: Artist
    album: Optional[Album] = None
    file_size: Optional[int] = None
    bitrate: Optional[int] = None
    format: Optional[str] = None
    play_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class Playlist(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    track_count: int
    total_duration: int
    created_at: datetime
    
class ScanJobStatus(BaseModel):
    id: int
    status: str
    progress: float
    files_scanned: int
    files_added: int
    error_message: Optional[str] = None
```

## Error Handling

### Error Categories

1. **File System Errors**
   - SSHFS connection failures
   - File permission issues
   - Disk space limitations

2. **Audio Processing Errors**
   - Corrupted audio files
   - Unsupported formats
   - Metadata extraction failures

3. **Database Errors**
   - Connection timeouts
   - Constraint violations
   - Migration failures

4. **Streaming Errors**
   - Network interruptions
   - Encoding failures
   - Client disconnections

### Error Handling Strategy

```python
class MusicManagerException(Exception):
    """Base exception for Music Manager"""
    pass

class FileSystemError(MusicManagerException):
    """File system related errors"""
    pass

class AudioProcessingError(MusicManagerException):
    """Audio processing related errors"""
    pass

class StreamingError(MusicManagerException):
    """Streaming related errors"""
    pass

# Global error handler
@app.exception_handler(MusicManagerException)
async def music_manager_exception_handler(request: Request, exc: MusicManagerException):
    return JSONResponse(
        status_code=500,
        content={
            "error": exc.__class__.__name__,
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

### Retry Mechanisms

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def scan_file_with_retry(file_path: str) -> TrackMetadata:
    """Scan file with automatic retry on failure"""
    try:
        return await extract_metadata(file_path)
    except FileSystemError as e:
        logger.warning(f"File scan failed for {file_path}: {e}")
        raise
```

## Testing Strategy

### Unit Testing

1. **Service Layer Testing**
   - Mock external dependencies (file system, Dejavu)
   - Test business logic in isolation
   - Validate error handling scenarios

2. **API Testing**
   - Test all endpoints with various inputs
   - Validate request/response schemas
   - Test authentication and authorization

3. **Database Testing**
   - Test model relationships
   - Validate constraints and indexes
   - Test migration scripts

### Integration Testing

1. **File System Integration**
   - Test with sample audio files
   - Validate metadata extraction accuracy
   - Test file watching functionality

2. **Streaming Integration**
   - Test audio streaming with different formats
   - Validate range request handling
   - Test concurrent streaming scenarios

3. **Frontend Integration**
   - Test API integration
   - Validate audio player functionality
   - Test responsive design

### Performance Testing

1. **Load Testing**
   - Simulate multiple concurrent users
   - Test streaming performance under load
   - Validate database query performance

2. **Scalability Testing**
   - Test with large music libraries (100k+ tracks)
   - Validate search performance
   - Test memory usage patterns

### Test Data Setup

```python
# Test fixtures
@pytest.fixture
async def sample_tracks():
    """Create sample tracks for testing"""
    return [
        {
            "title": "Test Song 1",
            "artist": "Test Artist",
            "album": "Test Album",
            "file_path": "/test/song1.mp3"
        },
        # ... more test data
    ]

@pytest.fixture
async def mock_file_system():
    """Mock file system for testing"""
    with patch('os.path.exists') as mock_exists:
        mock_exists.return_value = True
        yield mock_exists
```

## Security Considerations

### Authentication & Authorization

1. **JWT Token Management**
   - Short-lived access tokens (15 minutes)
   - Refresh token rotation
   - Secure token storage

2. **Role-Based Access Control**
   - Admin: Full system access
   - User: Library access and playlist management
   - Guest: Read-only access (if enabled)

### Data Protection

1. **Input Validation**
   - Sanitize all user inputs
   - Validate file paths to prevent directory traversal
   - Rate limiting on API endpoints

2. **File Access Security**
   - Validate file permissions before access
   - Restrict access to music directory only
   - Log all file access attempts

### Network Security

1. **HTTPS Enforcement**
   - Redirect HTTP to HTTPS in production
   - Secure cookie settings
   - HSTS headers

2. **CORS Configuration**
   - Restrict origins in production
   - Validate request headers
   - Limit allowed methods

## Performance Optimizations

### Database Optimizations

1. **Indexing Strategy**
   - Composite indexes for common queries
   - Full-text search indexes
   - Partial indexes for filtered queries

2. **Query Optimization**
   - Use prepared statements
   - Implement query result caching
   - Optimize N+1 query problems

### Caching Strategy

1. **Redis Caching**
   - Cache frequently accessed metadata
   - Cache search results
   - Cache user sessions

2. **HTTP Caching**
   - Set appropriate cache headers for static assets
   - Implement ETags for conditional requests
   - Use CDN for album artwork

### File System Optimizations

1. **Efficient Scanning**
   - Parallel file processing
   - Incremental scanning
   - Skip unchanged files using modification time

2. **Streaming Optimizations**
   - HTTP range request support
   - Adaptive bitrate streaming
   - Connection pooling for SSHFS

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /mnt/nas-music:/music:ro
    environment:
      - DATABASE_URL=sqlite:///./music_manager.db
      - MUSIC_LIBRARY_PATH=/music
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Production Considerations

1. **Reverse Proxy Setup**
   - Nginx for static file serving
   - Load balancing for multiple backend instances
   - SSL termination

2. **Monitoring & Logging**
   - Application performance monitoring
   - Error tracking and alerting
   - Structured logging with correlation IDs

3. **Backup Strategy**
   - Regular database backups
   - Metadata export/import functionality
   - Configuration backup