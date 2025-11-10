# Navidrome 통합 가이드

## 개요

Music Manager는 Navidrome 서버를 백엔드 데이터 소스로 사용할 수 있습니다. 이를 통해:
- 로컬 데이터베이스 없이도 앨범 정보 조회 가능
- Navidrome의 음악 라이브러리를 Music Manager UI로 탐색
- 기존 Navidrome 서버를 그대로 활용

---

## 설정 방법

### 1. 환경 변수 설정

`.env` 파일을 생성하거나 수정하여 Navidrome 연결 정보를 추가합니다:

```bash
# Navidrome Integration
NAVIDROME_ENABLED=true
NAVIDROME_URL=https://nas-1.parrot-mine.ts.net
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password_here
```

### 2. 설정 옵션 설명

| 환경 변수 | 설명 | 기본값 | 필수 |
|----------|------|-------|------|
| `NAVIDROME_ENABLED` | Navidrome 사용 여부 (`true`/`false`) | `false` | Yes |
| `NAVIDROME_URL` | Navidrome 서버 URL (http:// 또는 https://) | - | Yes |
| `NAVIDROME_USERNAME` | Navidrome 사용자명 | - | Yes |
| `NAVIDROME_PASSWORD` | Navidrome 비밀번호 | - | Yes |

### 3. 재시작

환경 변수 설정 후 백엔드를 재시작합니다:

```bash
# Docker 환경
docker-compose restart backend

# 개발 환경
cd backend
uvicorn app.main:app --reload
```

---

## 동작 방식

### 자동 전환

Music Manager는 `NAVIDROME_ENABLED=true`로 설정되면:

1. **앨범 목록 API** (`GET /api/v1/albums`):
   - Navidrome 서버에 연결 시도
   - 연결 성공 시 Navidrome 데이터 사용
   - 연결 실패 시 자동으로 로컬 DB로 폴백

2. **인증 방식**:
   - SubSonic API 프로토콜 사용
   - 토큰 기반 인증 (MD5 hash of password + salt)

3. **데이터 변환**:
   - Navidrome의 앨범 데이터를 Music Manager 스키마로 자동 변환
   - 커버 아트 URL은 Navidrome의 `getCoverArt` 엔드포인트 사용

### 지원 기능

✅ **현재 지원**:
- 앨범 목록 조회 (무한 스크롤)
- 페이지네이션
- 검색 (제목, 아티스트, 장르)
- 정렬 (제목, 아티스트, 연도, 최신 추가)
- 장르/연도 필터링
- 커버 아트 표시

⏳ **향후 지원 예정**:
- 앨범 상세 정보 (트랙 목록)
- 음악 스트리밍
- 플레이리스트 연동

---

## SubSonic API 매핑

Music Manager는 다음 Navidrome SubSonic API 엔드포인트를 사용합니다:

| Music Manager 기능 | Navidrome API | 메서드 |
|------------------|--------------|--------|
| 앨범 목록 | `/rest/getAlbumList2` | GET |
| 앨범 상세 | `/rest/getAlbum` | GET |
| 아티스트 목록 | `/rest/getArtists` | GET |
| 커버 아트 | `/rest/getCoverArt` | GET |
| 검색 | `/rest/search3` | GET |
| 연결 테스트 | `/rest/ping` | GET |

---

## 정렬 옵션 매핑

| Music Manager 정렬 | Navidrome List Type |
|------------------|-------------------|
| `TITLE_ASC` | `alphabeticalByName` |
| `TITLE_DESC` | `alphabeticalByName` (reversed) |
| `ARTIST_ASC` | `alphabeticalByArtist` |
| `ARTIST_DESC` | `alphabeticalByArtist` (reversed) |
| `YEAR_ASC` | `byYear` |
| `YEAR_DESC` | `byYear` (reversed) |
| `RECENTLY_ADDED` | `newest` |

---

## 예제 설정

### 예제 1: Tailscale Funnel을 통한 Navidrome

```bash
NAVIDROME_ENABLED=true
NAVIDROME_URL=https://nas-1.parrot-mine.ts.net
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=HsNoh9765!!@@
```

### 예제 2: 로컬 Navidrome

```bash
NAVIDROME_ENABLED=true
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
```

### 예제 3: 로컬 DB 사용 (기본값)

```bash
NAVIDROME_ENABLED=false
# 또는 환경 변수 미설정
```

---

## 문제 해결

### 연결 실패

**증상**: Music Manager에서 앨범이 표시되지 않음

**확인 사항**:
1. Navidrome 서버가 실행 중인지 확인:
   ```bash
   curl https://nas-1.parrot-mine.ts.net/rest/ping?u=admin&p=YOUR_PASSWORD&f=json
   ```

2. 백엔드 로그 확인:
   ```bash
   docker-compose logs backend
   ```

3. 환경 변수 확인:
   ```bash
   docker-compose exec backend env | grep NAVIDROME
   ```

### 인증 오류

**증상**: "Navidrome API error: Wrong username or password"

**해결**:
- 사용자명/비밀번호 정확히 확인
- 특수 문자가 포함된 경우 큰따옴표로 감싸기:
  ```bash
  NAVIDROME_PASSWORD="HsNoh9765!!@@"
  ```

### 느린 응답

**증상**: 앨범 목록 로딩이 느림

**원인**: Navidrome은 최대 500개 앨범을 한 번에 가져와 클라이언트 측에서 필터링

**해결**:
- 검색어 사용하여 결과 범위 축소
- 장르/연도 필터 활용
- 또는 로컬 DB 사용 (더 빠른 쿼리)

---

## 아키텍처

```
┌─────────────────┐
│  Music Manager  │
│    Frontend     │
└────────┬────────┘
         │ HTTP Request
         │ GET /api/v1/albums
         ▼
┌─────────────────┐
│  Music Manager  │
│     Backend     │
└────────┬────────┘
         │
         ├─ If NAVIDROME_ENABLED=true
         │  │
         │  ▼
         │  ┌──────────────────┐
         │  │ NavidromeClient  │
         │  │  (SubSonic API)  │
         │  └────────┬─────────┘
         │           │
         │           │ HTTPS
         │           ▼
         │  ┌──────────────────┐
         │  │   Navidrome      │
         │  │   Server         │
         │  │ (4533 / Funnel)  │
         │  └──────────────────┘
         │
         └─ If NAVIDROME_ENABLED=false
            │
            ▼
         ┌──────────────────┐
         │   Local SQLite   │
         │    Database      │
         └──────────────────┘
```

---

## 코드 구조

```
backend/app/
├── services/
│   ├── navidrome_client.py        # SubSonic API 클라이언트
│   ├── navidrome_album_service.py # Navidrome → Music Manager 변환
│   └── album_service.py           # 로컬 DB 서비스
├── api/routes/
│   └── albums.py                  # Navidrome/Local DB 자동 전환
└── core/
    └── config.py                  # Navidrome 환경 변수 설정
```

---

## 성능 고려사항

### Navidrome 모드
- **장점**: 로컬 DB 스캔 불필요, 항상 최신 데이터
- **단점**: 네트워크 지연, 대용량 라이브러리에서 느림 (500개 제한)

### 로컬 DB 모드
- **장점**: 빠른 쿼리, 복잡한 필터링 가능
- **단점**: 초기 스캔 필요, 실시간 업데이트 안됨

### 권장 사항
- **소규모 라이브러리 (<1000 앨범)**: Navidrome 모드 권장
- **대규모 라이브러리 (>1000 앨범)**: 로컬 DB 모드 권장
- **외부 접속 필요**: Navidrome + Tailscale Funnel

---

## 다음 단계

### Phase 2 개발 계획
1. **앨범 상세 페이지**: Navidrome에서 트랙 목록 가져오기
2. **스트리밍 통합**: Navidrome의 `stream` 엔드포인트 사용
3. **플레이리스트**: Navidrome 플레이리스트 연동
4. **캐싱**: 자주 조회하는 데이터 캐시하여 성능 개선

---

**작성일**: 2025-11-10
**버전**: 1.0
**상태**: ✅ 구현 완료 (앨범 목록 조회)
