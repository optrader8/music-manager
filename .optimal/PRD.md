# Product Requirements Document (PRD)
# Music Manager System

## 1. 제품 개요

### 1.1 제품 비전
SSHFS로 연결된 원격 음악 서버를 효율적으로 관리하고, 사용자가 언제 어디서나 접근할 수 있는 개인 음악 스트리밍 플랫폼

### 1.2 제품 목표
- 대용량 음악 라이브러리의 체계적 관리
- 직관적이고 반응형 웹 인터페이스 제공
- 고품질 음악 스트리밍 서비스
- 정확한 메타데이터 관리 및 음원 식별
- 인터넷 방송 기능으로 확장 가능

### 1.3 대상 사용자
- **Primary**: 개인 음악 컬렉션 관리자
- **Secondary**: 소규모 인터넷 라디오 운영자
- **Tertiary**: 가정용 미디어 서버 사용자

## 2. 핵심 기능 요구사항

### 2.1 음악 라이브러리 관리

#### 2.1.1 파일 스캔 및 인덱싱
**우선순위: HIGH**
- `/mnt/nas-music` 디렉토리 재귀적 스캔
- 지원 포맷: MP3, FLAC, AAC, OGG, M4A
- 실시간 파일 변경 감지 (inotify)
- 중복 파일 감지 및 처리
- 배치 처리를 통한 대용량 라이브러리 효율적 스캔

**기술 요구사항:**
- Python: `watchdog`, `mutagen` 라이브러리
- 파일 해시 기반 중복 감지
- 비동기 처리로 UI 블로킹 방지

#### 2.1.2 메타데이터 추출 및 저장
**우선순위: HIGH**
- 기본 태그 정보 추출 (제목, 아티스트, 앨범, 장르, 년도)
- 앨범 아트워크 추출 및 저장
- 오디오 특성 정보 (비트레이트, 샘플레이트, 길이)
- 파일 정보 (경로, 크기, 수정일)

**데이터 모델:**
```sql
-- Albums
id, title, artist_id, album_artist, year, genre, cover_art_path, back_cover_path,
booklet_path, description, disc_id, total_tracks, total_discs, created_at, updated_at

-- Artists
id, name, bio, image_path, created_at, updated_at

-- Tracks
id, title, album_id, artist_id, track_number, disc_number, duration, file_path,
file_size, bitrate, sample_rate, format, performer, composer, comment,
id3v1_comment, created_at, updated_at

-- Playlists
id, name, description, user_id, is_public, created_at, updated_at

-- Album Metadata Files
id, album_id, file_type, file_path, file_name, file_size, created_at

-- External Identifiers
id, entity_type, entity_id, identifier_type, identifier_value, created_at
```

### 2.2 Dejavu 음원 식별 시스템

#### 2.2.1 음원 지문 생성 및 매칭
**우선순위: MEDIUM**
- 신규 파일 자동 지문 생성
- 기존 데이터베이스와 매칭
- 메타데이터 자동 보완 제안
- 정확도 신뢰도 점수 표시

**구현 세부사항:**
- Dejavu 라이브러리 통합
- 백그라운드 작업으로 처리
- 매칭 결과 검증 인터페이스

#### 2.2.2 외부 음악 데이터베이스 연동
**우선순위: LOW**
- MusicBrainz API 연동
- Spotify Web API 연동 (선택사항)
- 자동 메타데이터 업데이트
- 사용자 승인 기반 업데이트

### 2.3 웹 기반 음악 플레이어

#### 2.3.1 기본 재생 기능
**우선순위: HIGH**
- 재생/일시정지/이전/다음 컨트롤
- 볼륨 조절 및 음소거
- 재생 위치 탐색 바
- 셔플 및 반복 모드
- 교차 페이드 기능

**기술 요구사항:**
- HTML5 Audio API 또는 Howler.js
- 실시간 재생 상태 동기화
- 키보드 단축키 지원

#### 2.3.2 플레이리스트 관리
**우선순위: HIGH**
- 플레이리스트 생성/편집/삭제
- 드래그 앤 드롭으로 순서 변경
- 스마트 플레이리스트 (장르, 아티스트 기반)
- 즐겨찾기 관리

#### 2.3.3 고급 재생 기능
**우선순위: MEDIUM**
- 이퀄라이저
- 재생 히스토리
- 최근 재생 목록
- 가사 표시 (LRC 파일 지원)

### 2.4 검색 및 브라우징

#### 2.4.1 통합 검색
**우선순위: HIGH**
- 전체 텍스트 검색
- 실시간 검색 결과
- 필터 기능 (아티스트, 앨범, 장르, 년도)
- 검색 히스토리

**검색 인덱스:**
- SQLite FTS5 활용
- 한글/영문 혼합 검색 지원
- 부분 일치 검색

#### 2.4.2 라이브러리 브라우징
**우선순위: HIGH**
- 앨범 그리드 뷰
- 아티스트 목록 뷰
- 장르별 분류
- 최근 추가된 음악
- 가상 스크롤링으로 성능 최적화

### 2.5 스트리밍 및 인터넷 방송

#### 2.5.1 로컬 스트리밍
**우선순위: HIGH**
- HTTP 기반 오디오 스트리밍
- 적응형 비트레이트 스트리밍
- 범위 요청 지원 (Range header)
- 캐싱 최적화

#### 2.5.2 인터넷 방송
**우선순위: LOW**
- HLS 스트리밍 프로토콜
- 실시간 인코딩 (FFmpeg)
- 여러 품질 옵션 제공
- 방송 스케줄링

**기술 요구사항:**
- FFmpeg HLS 세그먼트 생성
- CDN 연동 준비
- 동시 접속자 관리

### 2.6 메타데이터 편집

#### 2.6.1 개별 편집
**우선순위: MEDIUM**
- 인라인 편집 인터페이스
- 앨범 아트워크 업로드/변경
- 태그 정보 직접 편집
- 변경사항 실시간 저장

#### 2.6.2 배치 편집
**우선순위: LOW**
- 다중 선택 편집
- 템플릿 기반 자동 편집
- 정규표현식 기반 치환
- 실행 취소/재실행

## 3. 비기능적 요구사항

### 3.1 성능 요구사항
- **응답 시간**: API 응답 < 200ms (95%)
- **파일 스캔**: 10,000곡 라이브러리 < 5분
- **동시 사용자**: 최대 10명 동시 스트리밍
- **메모리 사용량**: 백엔드 < 512MB

### 3.2 확장성 요구사항
- 최대 100,000곡 라이브러리 지원
- 수평 확장 가능한 아키텍처 준비
- 데이터베이스 마이그레이션 지원

### 3.3 보안 요구사항
- JWT 기반 인증
- HTTPS 통신 (프로덕션)
- 파일 접근 권한 검증
- SQL 인젝션 방지

### 3.4 가용성 요구사항
- 99% 업타임 목표
- 자동 재시작 메커니즘
- 로그 기반 모니터링

## 4. 사용자 인터페이스 요구사항

### 4.1 반응형 디자인
- 모바일, 태블릿, 데스크톱 지원
- 터치 인터페이스 최적화
- 다크/라이트 테마 지원

### 4.2 접근성
- WCAG 2.1 AA 준수
- 키보드 내비게이션 지원
- 스크린 리더 호환성

### 4.3 사용자 경험
- 로딩 상태 표시
- 오프라인 상태 알림
- 진행률 표시 (스캔, 업로드 등)

## 5. 기술 명세

### 5.1 백엔드 기술 스택
```python
# 핵심 프레임워크
FastAPI==0.104.0
SQLAlchemy==2.0.0
Pydantic==2.0.0

# 오디오 처리
mutagen==1.47.0
dejavu==1.0.0
ffmpeg-python==0.2.0

# 유틸리티
watchdog==3.0.0
Pillow==10.0.0
aiofiles==23.2.1
```

### 5.2 프론트엔드 기술 스택
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "@tanstack/react-query": "^4.0.0",
    "zustand": "^4.0.0",
    "react-router-dom": "^6.0.0",
    "howler": "^2.2.0"
  }
}
```

### 5.3 데이터베이스 스키마

```sql
-- 핵심 테이블
CREATE TABLE artists (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    bio TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE albums (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id INTEGER REFERENCES artists(id),
    album_artist TEXT, -- For compilation albums
    year INTEGER,
    genre TEXT,
    cover_art_path TEXT,
    back_cover_path TEXT, -- Back cover image
    booklet_path TEXT, -- PDF booklet or additional docs
    description TEXT, -- Album description
    disc_id TEXT, -- CD DISCID for tracking
    total_tracks INTEGER,
    total_discs INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    album_id INTEGER REFERENCES albums(id),
    artist_id INTEGER REFERENCES artists(id),
    track_number INTEGER,
    disc_number INTEGER DEFAULT 1,
    duration INTEGER,
    file_path TEXT UNIQUE NOT NULL,
    file_size INTEGER,
    bitrate INTEGER,
    sample_rate INTEGER,
    format TEXT,
    performer TEXT, -- Performer information
    composer TEXT, -- Composer information
    comment TEXT, -- Additional comments/notes
    id3v1_comment TEXT, -- ID3v1 comment field
    file_hash TEXT UNIQUE,
    dejavu_fingerprint BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Album metadata files table (for folder.info.md, booklet.pdf, etc.)
CREATE TABLE album_metadata_files (
    id INTEGER PRIMARY KEY,
    album_id INTEGER REFERENCES albums(id),
    file_type TEXT NOT NULL, -- 'info', 'booklet', 'back_cover', 'liner_notes'
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- External identifiers table (for DISCID, MusicBrainz, etc.)
CREATE TABLE external_identifiers (
    id INTEGER PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'album', 'track', 'artist'
    entity_id INTEGER NOT NULL,
    identifier_type TEXT NOT NULL, -- 'discid', 'musicbrainz', 'spotify', 'lastfm'
    identifier_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, identifier_type)
);

-- FTS 검색 테이블
CREATE VIRTUAL TABLE tracks_fts USING fts5(
    title, album_name, artist_name, genre,
    content=tracks
);
```

## 6. 개발 일정

### Phase 1: 기반 시설 (4주)
- [ ] 프로젝트 설정 및 개발 환경
- [ ] 데이터베이스 스키마 및 모델
- [ ] 기본 API 구조
- [ ] 파일 스캔 시스템

### Phase 2: 핵심 기능 (6주)
- [ ] 메타데이터 추출 및 관리
- [ ] 기본 웹 플레이어
- [ ] 검색 및 브라우징
- [ ] 사용자 인터페이스

### Phase 3: 고급 기능 (4주)
- [ ] Dejavu 통합
- [ ] 플레이리스트 관리
- [ ] 메타데이터 편집
- [ ] 성능 최적화

### Phase 4: 확장 기능 (4주)
- [ ] 인터넷 방송 기능
- [ ] 외부 API 연동
- [ ] 모바일 최적화
- [ ] 배포 및 모니터링

## 7. 위험 요소 및 대응책

### 7.1 기술적 위험
- **SSHFS 연결 불안정**: 자동 재연결 메커니즘, 로컬 캐싱
- **대용량 라이브러리 성능**: 배치 처리, 인덱싱 최적화
- **Dejavu 성능**: 백그라운드 처리, 선택적 적용

### 7.2 사용자 경험 위험
- **초기 스캔 시간**: 진행률 표시, 점진적 로딩
- **네트워크 지연**: 오프라인 모드, 프리페칭

## 8. 성공 지표

### 8.1 기능적 지표
- 라이브러리 스캔 완료율 > 99%
- 메타데이터 정확도 > 95%
- 재생 오류율 < 1%

### 8.2 성능 지표
- 페이지 로드 시간 < 3초
- 검색 응답 시간 < 500ms
- 스트리밍 버퍼링 < 5%

### 8.3 사용자 만족도
- 인터페이스 직관성 평가
- 기능 완성도 평가
- 전반적 만족도 측정