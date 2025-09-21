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

## 기술 스택

### Backend
- **Python FastAPI** - REST API 서버
- **SQLite** - 메타데이터 저장소
- **Dejavu** - 음원 식별
- **FFmpeg** - 오디오 처리 및 스트리밍

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
│   │   ├── api/            # API 라우터
│   │   ├── core/           # 핵심 설정
│   │   ├── db/             # 데이터베이스 모델
│   │   ├── services/       # 비즈니스 로직
│   │   └── utils/          # 유틸리티
│   ├── requirements.txt
│   └── main.py
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   └── types/          # TypeScript 타입
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # 문서
├── .optimal/               # 프로젝트 관리
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
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **프론트엔드 서버**
   ```bash
   cd frontend
   npm run dev
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

## API 문서

백엔드 서버 실행 후 다음 주소에서 API 문서를 확인할 수 있습니다:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 환경 설정

### 환경 변수

```bash
# .env 파일 생성
MUSIC_LIBRARY_PATH=/mnt/nas-music
DATABASE_URL=sqlite:///./music_manager.db
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
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

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 지원

이슈나 질문이 있으시면 GitHub Issues를 통해 문의해 주세요.