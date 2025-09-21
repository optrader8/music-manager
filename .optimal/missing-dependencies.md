# 누락된 의존성 및 패키지 (Missing Dependencies)

## 백엔드 의존성 누락

### 현재 requirements.txt 분석
```
fastapi==0.110.2
uvicorn[standard]==0.29.0
pydantic-settings==2.2.1
SQLAlchemy==2.0.29
alembic==1.13.1
python-multipart==0.0.9
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
mutagen==1.47.0
watchdog==4.0.1
redis[hiredis]==5.0.4
python-dotenv==1.0.1
```

### 필수 누락 패키지

#### 1. 음원 식별 (CRITICAL)
```
dejavu==1.0.1
PyAudio==0.2.11
scipy==1.11.0
matplotlib==3.7.0
```

#### 2. 오디오/비디오 처리 (HIGH)
```
ffmpeg-python==0.2.0
librosa==0.10.0
audioread==3.0.0
```

#### 3. 이미지 처리 (HIGH)
```
Pillow==10.0.0
```

#### 4. 웹 스크래핑/외부 API (MEDIUM)
```
httpx==0.24.0
aiohttp==3.8.5
musicbrainzngs==0.7.1
```

#### 5. 백그라운드 작업 (HIGH)
```
celery==5.3.0
kombu==5.3.0
```

#### 6. 모니터링/로깅 (MEDIUM)
```
structlog==23.1.0
prometheus_client==0.17.0
```

#### 7. 재시도/복원력 (HIGH)
```
tenacity==8.2.0
```

#### 8. 테스팅 (HIGH)
```
pytest==7.4.0
pytest-asyncio==0.21.0
pytest-mock==3.11.0
httpx[test]==0.24.0
```

## 프론트엔드 의존성 누락

### 현재 package.json 분석
현재 기본적인 React 패키지만 있고 음악 관련 기능이 전혀 없음

### 필수 누락 패키지

#### 1. 오디오 플레이어 (CRITICAL)
```json
{
  "howler": "^2.2.0",
  "react-h5-audio-player": "^3.8.0",
  "wavesurfer.js": "^7.0.0"
}
```

#### 2. UI 컴포넌트 (HIGH)
```json
{
  "@headlessui/react": "^1.7.0",
  "@heroicons/react": "^2.0.0",
  "react-beautiful-dnd": "^13.1.0",
  "react-virtualized": "^9.22.0"
}
```

#### 3. 상태 관리 개선 (MEDIUM)
```json
{
  "zustand": "^4.4.0",
  "@tanstack/react-table": "^8.9.0"
}
```

#### 4. 파일 업로드 (MEDIUM)
```json
{
  "react-dropzone": "^14.2.0"
}
```

#### 5. 스타일링 (MEDIUM)
```json
{
  "tailwindcss": "^3.3.0",
  "@tailwindcss/forms": "^0.5.0"
}
```

## 시스템 레벨 의존성

### 1. FFmpeg 설치 필요
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Docker
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y ffmpeg
```

### 2. SSHFS 설정
```bash
# Ubuntu/Debian
sudo apt-get install sshfs

# 마운트 예시
sshfs user@remote:/music /mnt/nas-music -o allow_other
```

### 3. 추가 오디오 라이브러리
```bash
# Ubuntu/Debian
sudo apt-get install libasound2-dev portaudio19-dev

# macOS
brew install portaudio
```

## 권장 설치 순서

### 1. 백엔드 의존성 설치
```bash
# 기본 패키지 업데이트
pip install --upgrade pip

# 오디오 처리 핵심 패키지
pip install mutagen librosa audioread

# Dejavu 설치 (복잡한 의존성)
pip install dejavu

# 나머지 패키지
pip install -r requirements-additional.txt
```

### 2. 프론트엔드 패키지 설치
```bash
# 오디오 플레이어 우선
npm install howler react-h5-audio-player

# UI 컴포넌트
npm install @headlessui/react @heroicons/react

# 나머지 패키지
npm install
```

## 버전 호환성 주의사항

### 1. Python 버전
- Python 3.9+ 필수 (Dejavu 호환성)
- Python 3.11 권장

### 2. Node.js 버전
- Node.js 18+ 필수
- npm 9+ 권장

### 3. 알려진 충돌
- `PyAudio`와 `portaudio` 버전 충돌 가능
- `ffmpeg-python`과 시스템 FFmpeg 버전 확인 필요