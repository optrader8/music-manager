# Music Manager

SSHFS로 연결된 원격 음악 서버를 관리하고 스트리밍할 수 있는 웹 기반 음악 관리 시스템

## 프로젝트 개요

이 프로젝트는 `/mnt/nas-music`으로 마운트된 원격 음악 서버의 MP3 및 기타 음악 파일들을 체계적으로 관리하고, 웹 인터페이스를 통해 스트리밍 서비스를 제공하는 시스템입니다. Plex Music Server와 유사한 기능을 제공하며, 추가로 인터넷 방송 기능과 Dejavu를 활용한 정확한 음원 식별 기능을 포함합니다.

## 주요 기능

- 🎵 **음악 라이브러리 자동 스캔 및 DB 구축**
- 🎨 **앨범 아트워크 및 메타데이터 관리**
- 🔍 **Dejavu 기반 음원 식별 및 정보 업데이트**
- 🎧 **웹 기반 음악 플레이어**
- 📻 **인터넷 방송 기능**
- ✏️ **음악 파일 태그 편집**
- 🔎 **고급 검색 및 필터링**
- 📁 **파일 브라우저 - 음악 파일 탐색 및 관리**
  - 디렉토리 브라우징 및 네비게이션
  - 파일/폴더 삭제 및 이름 변경
  - MP3 태그 편집 (제목, 아티스트, 앨범, 장르 등)
  - 실시간 파일 검색 및 필터링
  - 안전한 경로 접근 제어 (/mnt/nas-music 하위만 접근 가능)

## 기술 스택

### Backend
- **Python FastAPI** - REST API 서버
- **SQLite** - 메타데이터 저장소
- **Dejavu** - 음원 식별
- **FFmpeg** - 오디오 처리 및 스트리밍
- **Mutagen** - MP3 태그 읽기/쓰기

### Frontend
- **React** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **React Query** - 서버 상태 관리
- **UI Template** - `/home/optrader/dev/react-ui-template/` 기반

## 프로젝트 구조

```
music-manager/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/     # API 라우터
│   │   │       ├── files.py      # 파일 브라우저 API
│   │   │       ├── tracks.py     # 음악 트랙 API
│   │   │       └── albums.py     # 앨범 API
│   │   ├── core/           # 핵심 설정
│   │   ├── db/             # 데이터베이스 모델
│   │   ├── services/       # 비즈니스 로직
│   │   │   ├── file_service.py   # 파일 관리 서비스
│   │   │   └── file_scanner_service.py
│   │   ├── schemas/        # Pydantic 스키마
│   │   │   └── file.py           # 파일 관련 스키마
│   │   └── utils/          # 유틸리티
│   ├── requirements.txt
│   └── main.py
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   │   ├── Breadcrumb.tsx    # 경로 네비게이션
│   │   │   ├── FileItem.tsx      # 파일 아이템
│   │   │   ├── ConfirmDialog.tsx # 확인 대화상자
│   │   │   ├── RenameDialog.tsx  # 이름 변경 대화상자
│   │   │   └── MP3TagEditModal.tsx # MP3 태그 편집
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   └── FileBrowserPage.tsx # 파일 브라우저 페이지
│   │   ├── services/       # API 서비스
│   │   │   └── fileService.ts    # 파일 API 호출
│   │   ├── types/          # TypeScript 타입
│   │   │   └── file.ts           # 파일 관련 타입
│   │   └── hooks/          # 커스텀 훅
│   ├── package.json
│   └── vite.config.ts
├── .kiro/                  # 기능 명세 및 관리
│   └── specs/
│       └── file-browser/   # 파일 브라우저 명세
├── docs/                   # 문서
└── docker-compose.yml      # 개발 환경
```

## 시작하기

### 사전 요구사항

- Python 3.9+
- Node.js 18+
- FFmpeg
- SSHFS (원격 음악 서버 마운트용)
- Dejavu 라이브러리 의존성

### 설치

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd music-manager
   ```

2. **백엔드 설정**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```

3. **프론트엔드 설정**
   ```bash
   cd frontend
   npm install
   ```

4. **음악 디렉토리 마운트**
   ```bash
   # SSHFS로 원격 서버 마운트 (예시)
   sshfs user@server:/music /mnt/nas-music
   ```

### 개발 서버 실행

1. **백엔드 서버**
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 32000
   ```

2. **프론트엔드 서버**
   ```bash
   cd frontend
   npm run dev
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:32001
   ```

### 주요 페이지

- **Dashboard**: `http://localhost:32001/` - 음악 라이브러리 통계 및 개요
- **Statistics**: `http://localhost:32001/statistics` - 상세 음악 통계
- **File Browser**: `http://localhost:32001/files` - 파일 탐색 및 관리
- **Albums**: `http://localhost:32001/albums` - 앨범 목록 및 상세 정보

## API 문서

백엔드 서버 실행 후 다음 주소에서 API 문서를 확인할 수 있습니다:
- Swagger UI: `http://localhost:32000/docs`
- ReDoc: `http://localhost:32000/redoc`

### 파일 브라우저 API 엔드포인트

```
GET /api/v1/files/browse?path={path}&search={query}  # 디렉토리 탐색
DELETE /api/v1/files/{file_path}                     # 파일/폴더 삭제
PUT /api/v1/files/{file_path}/rename                 # 파일/폴더 이름 변경
GET /api/v1/files/{file_path}/mp3-tags              # MP3 태그 조회
PUT /api/v1/files/{file_path}/mp3-tags              # MP3 태그 수정
```

## 환경 설정

### 환경 변수

```bash
# .env 파일 생성
MUSIC_LIBRARY_PATH=/mnt/nas-music
DATABASE_URL=sqlite:///./music_manager.db
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:32001

# 개발 환경에서 사용하는 포트
BACKEND_PORT=32000
FRONTEND_PORT=32001
```

### 데이터베이스 초기화

```bash
cd backend
python -m app.db.init_db
```

## 개발 가이드

### 코딩 규칙
- Python: PEP 8 준수, Black 포매터 사용
- TypeScript: ESLint + Prettier 설정
- 커밋 메시지: Conventional Commits 형식

### 테스트
```bash
# 백엔드 테스트
cd backend
pytest

# 프론트엔드 테스트
cd frontend
npm test
```

## 배포

### Docker 배포
```bash
docker-compose up -d
```

### 프로덕션 설정
- 환경 변수 설정
- SSL 인증서 구성
- 리버스 프록시 설정 (nginx)

## 라이선스

MIT License

## 기여하기

프로젝트 기여를 위한 자세한 가이드는 [AGENTS.md](AGENTS.md)에서 확인할 수 있습니다.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 지원

이슈나 질문이 있으시면 GitHub Issues를 통해 문의해 주세요.
