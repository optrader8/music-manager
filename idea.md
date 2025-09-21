# Music Manager Project Concept

## 개요
SSHFS를 통해 연결된 원격 음악 서버(/mnt/nas-music)의 음악 파일들을 관리하고 스트리밍할 수 있는 포괄적인 음악 관리 시스템

## 핵심 기능

### 1. 음악 라이브러리 관리
- MP3 및 기타 음악 파일 자동 스캔 및 DB 구축
- 메타데이터 추출 및 관리 (제목, 아티스트, 앨범, 장르 등)
- 앨범 아트워크 관리 및 표시
- 폴더 구조 기반 자동 분류

### 2. 음악 식별 및 정보 업데이트
- Dejavu 라이브러리를 활용한 정확한 음원 식별
- 온라인 음악 데이터베이스 연동으로 메타데이터 자동 보완
- 중복 파일 감지 및 관리

### 3. 스트리밍 및 재생
- 로컬 웹 기반 음악 플레이어
- 플레이리스트 생성 및 관리
- 앨범/아티스트/장르별 브라우징
- 검색 기능

### 4. 원격 접속 및 인터넷 방송
- 외부 네트워크에서 접근 가능한 웹 인터페이스
- 인터넷 라디오 방송 기능
- 실시간 스트리밍 서비스

### 5. 메타데이터 편집
- 음악 파일 태그 정보 편집
- 앨범 아트워크 업로드/변경
- 배치 편집 기능

## 기술 스택

### Backend
- **Framework**: Python FastAPI
- **Database**: SQLite
- **Audio Processing**: Dejavu, python-acoustid
- **File Management**: SSHFS 연동
- **Streaming**: FFmpeg, HLS

### Frontend
- **Framework**: React
- **UI Template**: /home/optrader/dev/react-ui-template/ 기반
- **Audio Player**: HTML5 Audio API 또는 Howler.js
- **State Management**: React Query + Zustand

### Infrastructure
- **File Storage**: SSHFS mounted /mnt/nas-music
- **Metadata Cache**: SQLite 로컬 DB
- **Streaming Protocol**: HTTP/HLS
- **Authentication**: JWT 기반

## 아키텍처 개념

```
[원격 음악 서버] ←→ [SSHFS] ←→ [Music Manager System]
                                        ↓
                                   [SQLite DB]
                                        ↓
                                   [FastAPI Backend]
                                        ↓
                                   [React Frontend]
                                        ↓
                                   [사용자/인터넷 방송]
```

## 주요 도전 과제
1. 대용량 음악 라이브러리의 효율적인 스캔 및 인덱싱
2. SSHFS를 통한 안정적인 파일 접근
3. 실시간 스트리밍 품질 및 지연 최소화
4. 메타데이터 정확성 및 일관성 유지
5. 확장 가능한 DB 스키마 설계

## 예상 사용 시나리오
1. 개인 음악 컬렉션 관리 및 감상
2. 가정용 네트워크 내 음악 서버
3. 소규모 인터넷 라디오 방송국
4. 음악 메타데이터 정리 및 관리 도구