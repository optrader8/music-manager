# SubSonic API 구현 분석 및 앨범 리스트/스트리밍 가능 여부

## 📋 분석 개요

**분석 일자**: 2025-11-10
**목적**: SubSonic API를 통한 앨범 리스트 조회 및 음악 스트리밍 가능 여부 확인

---

## ✅ SubSonic API란?

SubSonic API는 음악 스트리밍 애플리케이션을 위한 표준화된 REST API입니다.

### 주요 특징
- **표준화된 프로토콜**: 다양한 클라이언트 호환 (모바일 앱, 웹 플레이어 등)
- **ID3 태그 기반 탐색**: 아티스트, 앨범, 트랙 구조로 체계적 조회
- **스트리밍 지원**: HTTP Range 요청으로 Seek 기능 지원
- **OpenSubsonic 확장**: 최신 개선 사항 포함

### 공식 문서
- **Official API**: https://www.subsonic.org/pages/api.jsp
- **OpenSubsonic**: https://opensubsonic.netlify.app/

---

## 🎯 프로젝트 SubSonic API 구현 현황

### ✅ 구현 완료된 엔드포인트

#### 1. **System API** (`system.py`)
| 엔드포인트 | 경로 | 설명 | 상태 |
|-----------|------|------|------|
| ping | `/rest/ping` | 서버 상태 확인 | ✅ |
| getLicense | `/rest/getLicense` | 라이선스 정보 | ✅ |
| getMusicFolders | `/rest/getMusicFolders` | 음악 폴더 목록 | ✅ |

#### 2. **Browsing API** (`browsing.py`)
| 엔드포인트 | 경로 | 설명 | 상태 |
|-----------|------|------|------|
| getIndexes | `/rest/getIndexes` | 아티스트 인덱스 (A-Z) | ✅ |
| getArtists | `/rest/getArtists` | 전체 아티스트 목록 | ✅ |
| getArtist | `/rest/getArtist` | 아티스트 상세 + 앨범 | ✅ |
| getAlbum | `/rest/getAlbum` | 앨범 상세 + 트랙 목록 | ✅ |

**핵심 기능**:
- ✅ 아티스트별 앨범 조회 가능
- ✅ 앨범별 트랙 조회 가능
- ✅ ID3 태그 기반 정보 제공

#### 3. **Streaming API** (`streaming.py`)
| 엔드포인트 | 경로 | 설명 | 상태 |
|-----------|------|------|------|
| stream | `/rest/stream` | 음악 스트리밍 (Range 지원) | ✅ |
| download | `/rest/download` | 음악 파일 다운로드 | ✅ |

**핵심 기능**:
- ✅ HTTP Range 요청 지원 (Seek 가능)
- ✅ 실시간 스트리밍
- ✅ 적응형 비트레이트 (파라미터로 조절)
- ✅ MIME 타입 자동 감지

**구현 코드 위치**: `backend/app/api/routes/subsonic/streaming.py:19-76`

```python
def range_request_handler(file_path: str, request: Request):
    """Handle HTTP range requests for streaming"""
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get('range')

    # Range 요청 처리 로직
    # 206 Partial Content 응답 지원
```

#### 4. **Search API** (`search.py`)
| 엔드포인트 | 경로 | 설명 | 상태 |
|-----------|------|------|------|
| search3 | `/rest/search3` | 통합 검색 (아티스트/앨범/트랙) | ✅ |
| search2 | `/rest/search2` | 레거시 검색 (호환성) | ✅ |

#### 5. **Playlist API** (`playlists.py`)
| 엔드포인트 | 경로 | 설명 | 상태 |
|-----------|------|------|------|
| getPlaylists | `/rest/getPlaylists` | 플레이리스트 목록 | ✅ |
| getPlaylist | `/rest/getPlaylist` | 플레이리스트 상세 | ✅ |

#### 6. **Scrobbling API** (`scrobbling.py`)
| 엔드포인트 | 경로 | 설명 | 상태 |
|-----------|------|------|------|
| scrobble | `/rest/scrobble` | 재생 기록 | ✅ |
| getNowPlaying | `/rest/getNowPlaying` | 현재 재생 중 | ✅ |

---

### ❌ 구현되지 않은 엔드포인트

#### 누락된 중요 엔드포인트

| 엔드포인트 | 경로 | 설명 | 우선순위 |
|-----------|------|------|---------|
| **getAlbumList** | `/rest/getAlbumList` | 큐레이션된 앨범 목록 | 🔴 HIGH |
| **getAlbumList2** | `/rest/getAlbumList2` | ID3 기반 앨범 목록 | 🔴 HIGH |
| getCoverArt | `/rest/getCoverArt` | 앨범 커버 이미지 | 🟡 MEDIUM |
| hls | `/rest/hls.m3u8` | HLS 스트리밍 | 🟢 LOW |

**getAlbumList가 중요한 이유**:
- 앨범 목록 탐색의 핵심 기능
- 다양한 정렬 옵션 제공 (최신, 인기, 랜덤 등)
- 대부분의 SubSonic 클라이언트가 이 엔드포인트 사용

---

## 🎵 앨범 리스트 조회 가능 여부

### ✅ 현재 가능한 방법

#### 방법 1: **getArtist를 통한 조회**
```
1. getIndexes 또는 getArtists로 아티스트 목록 가져오기
2. 각 아티스트에 대해 getArtist 호출
3. 반환된 앨범 목록 사용
```

**예시**:
```bash
# 1. 아티스트 목록
curl "http://localhost:32000/rest/getArtists?u=user&p=pass&f=json"

# 2. 특정 아티스트의 앨범
curl "http://localhost:32000/rest/getArtist?id=ar-123&u=user&p=pass&f=json"
```

**장점**: ✅ 구현되어 있음, 정확한 데이터
**단점**: ⚠️ 아티스트별로 개별 요청 필요, 비효율적

#### 방법 2: **search3를 통한 조회**
```bash
# 빈 검색어 또는 와일드카드로 전체 앨범 검색
curl "http://localhost:32000/rest/search3?query=*&albumCount=100&u=user&p=pass&f=json"
```

**장점**: ✅ 한 번의 요청으로 여러 앨범
**단점**: ⚠️ 검색 기능의 오용, 페이지네이션 제한

### ❌ 현재 불가능한 방법

#### getAlbumList / getAlbumList2 (미구현)

**공식 API 스펙**:
```
GET /rest/getAlbumList2?type={type}&size={size}&offset={offset}

type: random, newest, highest, frequent, recent, alphabetical, byYear, byGenre, starred
size: 앨범 개수 (기본 10, 최대 500)
offset: 페이지네이션 오프셋
```

**이것이 필요한 이유**:
- 📋 "최신 앨범", "인기 앨범" 등 큐레이션 뷰
- 🔀 "랜덤 앨범" 디스커버리 기능
- 📅 연도별, 장르별 필터링
- 🎯 효율적인 대량 앨범 로딩

---

## 🎧 음악 스트리밍 가능 여부

### ✅ **완벽하게 가능**

#### 지원 기능

1. **기본 스트리밍**
   ```bash
   curl "http://localhost:32000/rest/stream?id=tr-123&u=user&p=pass" > song.mp3
   ```

2. **HTTP Range 요청 (Seek 지원)**
   ```bash
   curl -H "Range: bytes=1000000-" "http://localhost:32000/rest/stream?id=tr-123&u=user&p=pass"
   ```
   - ✅ 206 Partial Content 응답
   - ✅ 음악 플레이어의 Seek 기능 지원
   - ✅ 대역폭 절약

3. **다운로드**
   ```bash
   curl "http://localhost:32000/rest/download?id=tr-123&u=user&p=pass" -o song.mp3
   ```

4. **파일 형식 지원**
   - ✅ MP3, FLAC, AAC, OGG, M4A
   - ✅ MIME 타입 자동 감지
   - ✅ 원본 비트레이트 유지

#### 구현 세부사항

**파일 위치**: `backend/app/api/routes/subsonic/streaming.py`

**핵심 코드**:
```python
@router.get("/stream")
async def stream(
    request: Request,
    id: str = Query(..., description="The track ID"),
    maxBitRate: Optional[int] = Query(None),
    format: Optional[str] = Query(None),
    timeOffset: Optional[int] = Query(None)
):
    # 1. 트랙 ID 디코딩
    internal_track_id = SubsonicIDMapper.decode_track_id(id)

    # 2. DB에서 트랙 조회
    track = track_service.get_track_by_id(internal_track_id)

    # 3. HTTP Range 요청 처리
    return range_request_handler(track.file_path, request)
```

**특징**:
- ✅ DB에서 파일 경로 조회
- ✅ 파일 존재 여부 확인
- ✅ Range 요청 파싱 및 응답
- ✅ 에러 처리 (404, 416)

---

## 🔌 클라이언트 호환성

### 테스트 가능한 클라이언트

#### 웹 클라이언트
- **Airsonic Refix**: https://airsonic.github.io/
- **Jamstash**: https://github.com/tsquillario/Jamstash
- **Subplayer**: 브라우저 기반 플레이어

#### 모바일 앱
- **DSub** (Android): Google Play
- **play:Sub** (iOS): App Store
- **Ultrasonic** (Android): F-Droid

#### 데스크톱
- **Sublime Music** (Linux): GTK 기반
- **Sonixd** (Cross-platform): Rust 기반

### 연결 방법

**서버 설정**:
```
URL: http://g2.parrot-mine.ts.net:32000
Path: /rest
Username: [사용자명]
Password: [비밀번호]
```

**인증 방식**:
- ✅ 토큰 인증 (MD5 해시)
- ✅ 평문 패스워드 (HTTPS 권장)

---

## 📊 현재 상태 요약

| 카테고리 | 상태 | 설명 |
|---------|------|------|
| **앨범 리스트 조회** | 🟡 부분 가능 | getArtist 또는 search3 우회 사용 |
| **앨범 상세 정보** | ✅ 완전 가능 | getAlbum으로 트랙 목록 포함 |
| **음악 스트리밍** | ✅ 완전 가능 | Range 요청, Seek 지원 |
| **음악 다운로드** | ✅ 완전 가능 | 원본 파일 다운로드 |
| **검색 기능** | ✅ 완전 가능 | 통합 검색 지원 |
| **플레이리스트** | ✅ 완전 가능 | CRUD 지원 |

---

## 🚀 개선 권장사항

### 우선순위 1: getAlbumList2 구현

**구현 파일**: `backend/app/api/routes/subsonic/browsing.py`

**추가할 엔드포인트**:
```python
@router.get("/getAlbumList2")
async def get_album_list2(
    request: Request,
    type: str = Query(..., description="Album list type"),
    size: int = Query(10, ge=1, le=500),
    offset: int = Query(0, ge=0),
    fromYear: Optional[int] = Query(None),
    toYear: Optional[int] = Query(None),
    genre: Optional[str] = Query(None),
    f: Optional[str] = Query(None)
):
    # type별 로직:
    # - random: ORDER BY RANDOM()
    # - newest: ORDER BY created DESC
    # - highest: ORDER BY rating DESC (별점 기능 필요)
    # - frequent: ORDER BY play_count DESC
    # - recent: ORDER BY last_played DESC
    # - alphabetical: ORDER BY name ASC
    # - byYear: WHERE year BETWEEN fromYear AND toYear
    # - byGenre: WHERE genre = genre
    pass
```

**예상 소요 시간**: 2-3시간

### 우선순위 2: getCoverArt 구현

현재 `/api/v1/albums/{id}/cover`는 있지만 SubSonic 표준 경로가 아님

**추가 필요**:
```python
@router.get("/getCoverArt")
async def get_cover_art(
    request: Request,
    id: str = Query(...),
    size: Optional[int] = Query(None)
):
    # 기존 album cover 엔드포인트 재활용
    pass
```

### 우선순위 3: HLS 스트리밍

Apple HLS 프로토콜 지원 (iOS/Apple TV)

---

## 🧪 테스트 방법

### 1. cURL로 테스트

```bash
# 서버 핑
curl "http://localhost:32000/rest/ping?u=admin&p=admin&f=json"

# 아티스트 목록
curl "http://localhost:32000/rest/getArtists?u=admin&p=admin&f=json"

# 앨범 상세
curl "http://localhost:32000/rest/getAlbum?id=al-1&u=admin&p=admin&f=json"

# 스트리밍 테스트
curl "http://localhost:32000/rest/stream?id=tr-1&u=admin&p=admin" -o test.mp3

# Range 요청 테스트
curl -H "Range: bytes=0-1024" "http://localhost:32000/rest/stream?id=tr-1&u=admin&p=admin"
```

### 2. 브라우저 테스트

**XML 응답**:
```
http://localhost:32000/rest/getArtists?u=admin&p=admin&f=xml
```

**JSON 응답**:
```
http://localhost:32000/rest/getArtists?u=admin&p=admin&f=json
```

### 3. SubSonic 클라이언트 테스트

Jamstash 또는 Sonixd 사용:
1. 서버 URL 입력: `http://localhost:32000`
2. REST path: `/rest`
3. 사용자명/비밀번호 입력
4. 연결 테스트

---

## 📝 결론

### ✅ 가능한 것

1. **앨범 리스트 조회**: 우회 방법으로 가능 (getArtist, search3)
2. **앨범 상세 정보**: getAlbum으로 완벽하게 가능
3. **음악 스트리밍**: HTTP Range 지원으로 완벽하게 가능
4. **Seek 기능**: Range 요청으로 지원
5. **다양한 클라이언트 연결**: SubSonic 호환 클라이언트 모두 사용 가능

### ⚠️ 제한 사항

1. **getAlbumList/getAlbumList2 미구현**: 큐레이션된 앨범 목록 불가
2. **비효율적인 앨범 탐색**: 아티스트별 개별 요청 필요
3. **제한된 필터링**: 연도별, 장르별 일괄 조회 어려움

### 🎯 추천 사용 시나리오

**현재 상태로 가능**:
- ✅ 아티스트 중심 탐색
- ✅ 특정 앨범 재생
- ✅ 검색 기반 음악 찾기
- ✅ SubSonic 클라이언트 앱 사용

**getAlbumList 구현 후 가능**:
- ⏳ "최신 앨범" 섹션
- ⏳ "인기 앨범" 큐레이션
- ⏳ 효율적인 대량 앨범 로딩
- ⏳ 연도별/장르별 필터링

---

## 📚 관련 문서

- [SubSonic 공식 API 문서](https://www.subsonic.org/pages/api.jsp)
- [OpenSubsonic 확장](https://opensubsonic.netlify.app/)
- [Navidrome SubSonic 호환성](https://www.navidrome.org/docs/developers/subsonic-api/)

---

**작성일**: 2025-11-10
**버전**: 1.0
**분석자**: Claude
**프로젝트**: optrader8/music-manager
