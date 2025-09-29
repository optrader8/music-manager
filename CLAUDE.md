# Music Manager - Claude 개발 지침

## ⚠️ 절대 금지 사항 - 필수 확인

### 포트 사용 규칙
- **Backend**: 반드시 32000번 포트만 사용
- **Frontend**: 반드시 32001번 포트만 사용
- **절대 금지**: 32002, 32003 등 다른 포트 사용 금지
- **Docker 환경**: docker-compose로 32000, 32001 포트 할당됨
- **개발 시**: 반드시 Docker 컨테이너 내에서 실행

## 프로젝트 개요

**Product**: Music Manager - 로컬 음악 라이브러리 관리 시스템
**Backend**: FastAPI (Python) - Port 32000 고정
**Frontend**: React + TypeScript - Port 32001 고정
**Database**: SQLite (개발), PostgreSQL (배포)
**Port Configuration**: Backend(32000), Frontend(32001) - 절대 변경 금지

---

## 핵심 개발 원칙

### 1. 최소한의 코드 작성
- 필요한 최소한의 코드만 작성
- 기존 작동하는 코드는 수정하지 않음
- 중복 제거 및 불필요한 추상화 방지

### 2. Docker 환경 설정
- **절대 금지**: 3000, 8000번 포트 사용
- **할당된 포트**: Backend(32000), Frontend(32001)
- **HMR 지원**: 개발 환경에서 핫 모듈 리로딩 필수
- **외부 네트워킹**: host.docker.internal 사용

### 3. 기존 템플릿 활용
- `/home/optrader/react-ui-template/` 구조 그대로 사용
- Header + Sidebar + Content 레이아웃 유지
- 기존 컴포넌트 재사용

---

## 데이터베이스 스키마

### 주요 테이블
1. **tracks**: 음악 파일 정보
   - id, title, artist_id, album_id
   - file_path, file_hash, duration_seconds
   - bit_rate, sample_rate, genre

2. **artists**: 아티스트 정보
   - id, name, country, bio

3. **albums**: 앨범 정보
   - id, title, artist_id, release_date
   - cover_image_path

4. **playlists**: 플레이리스트
   - id, name, description, user_id

---

## 개발 우선순위

### Phase 1: 기본 구조
1. React UI 템플릿 복사 및 설정
2. Docker 환경 구성 (HMR 포함)
3. 기본 라우팅 설정

### Phase 2: Dashboard & Statistics
1. Dashboard 페이지: 전체 통계 개요
2. Statistics 페이지: 상세 음악 통계
3. Backend API 엔드포인트 구현

### Phase 3: 기능 확장
1. 음악 파일 목록 조회
2. 검색 기능
3. 플레이리스트 관리

---

## API 엔드포인트 설계

### 통계 및 라이브러리 API
```
GET /api/v1/stats/overview     # 전체 통계
GET /api/v1/stats/genres       # 장르별 통계
GET /api/v1/stats/artists      # 아티스트별 통계
GET /api/v1/stats/albums       # 앨범별 통계
GET /api/v1/tracks             # 트랙 목록
GET /api/v1/artists            # 아티스트 목록
GET /api/v1/albums             # 앨범 목록
```

### 파일 브라우저 API (✅ 구현 완료)
```
GET /api/v1/files/browse              # 디렉토리 탐색
DELETE /api/v1/files/{file_path}      # 파일/폴더 삭제
PUT /api/v1/files/{file_path}/rename  # 파일/폴더 이름 변경
GET /api/v1/files/{file_path}/mp3-tags # MP3 태그 조회
PUT /api/v1/files/{file_path}/mp3-tags # MP3 태그 수정
```

---

## Frontend 페이지 구조

```
/dashboard     # 대시보드 (전체 개요)
/statistics    # 통계 페이지 (상세 분석)
/files         # 파일 브라우저 (✅ 구현 완료)
/albums        # 앨범 목록 및 상세
/tracks        # 음악 목록 (향후)
/playlists     # 플레이리스트 (향후)
```

### 파일 브라우저 페이지 기능 (✅ 구현 완료)
- 디렉토리 탐색 및 Breadcrumb 네비게이션
- 실시간 파일 검색 및 필터링
- 파일/폴더 삭제 및 이름 변경
- MP3 태그 편집 (제목, 아티스트, 앨범, 장르, 연도, 트랙번호)
- 반응형 그리드 레이아웃 및 가상 스크롤링
- 안전한 경로 접근 제어 (/mnt/nas-music 하위만)

---

## Docker 설정 요구사항

### docker-compose.yml
- Backend: 포트 32000
- Frontend: 포트 32001
- 볼륨 마운트: 음악 파일 접근
- HMR 지원: 개발용 설정

### Dockerfile
- Multi-stage build (개발/프로덕션)
- Python 가상환경 활용
- Node.js 개발 서버 설정

---

## 금지사항

1. **포트 충돌**: 3000, 8000번 포트 절대 사용 금지
2. **기존 코드 수정**: 작동하는 백엔드 코드 임의 수정 금지
3. **하드코딩**: API 키, 경로 등 하드코딩 금지
4. **Mock 데이터**: 실제 데이터베이스 사용 필수

---

## 품질 체크리스트

**코드 작성 전:**
- [ ] 기존 코드 구조 파악
- [ ] 필요한 최소 변경사항 식별
- [ ] 포트 충돌 확인

**개발 중:**
- [ ] TypeScript 타입 안전성
- [ ] API 엔드포인트 테스트
- [ ] HMR 동작 확인

**배포 전:**
- [ ] Docker 빌드 성공
- [ ] 포트 바인딩 확인
- [ ] 실제 데이터 연동 테스트

---

## 현재 프로젝트 상태

- **Database**: 음악 스캔 완료, SQLite에 저장됨
- **Backend**: FastAPI 구조 완성, 파일 브라우저 API 구현 완료
- **Frontend**: React 프로젝트 완성, 파일 브라우저 기능 구현 완료
- **완료된 기능**:
  - ✅ Dashboard + Statistics 페이지
  - ✅ File Browser (디렉토리 탐색, 파일 관리, MP3 태그 편집)
  - ✅ Albums 페이지 및 상세 정보
- **진행 중**: 성능 최적화 및 테스트 작성

---

*이 문서는 Music Manager 프로젝트의 개발 지침이며, 모든 개발 작업은 이 원칙을 따라야 합니다.*