# 즉시 실행 계획 (Immediate Action Plan)

## 현재 상황 요약
다른 에이전트가 기본 프로젝트 구조를 생성했지만, 핵심 음악 관리 기능이 전혀 구현되지 않은 상태입니다.

## 즉시 수정이 필요한 항목들

### 1. CRITICAL - 데이터베이스 모델 누락
**문제**: 현재 User/Auth 모델만 있고 핵심 음악 관련 모델이 없음
**영향**: 전체 시스템이 작동하지 않음

**필요한 작업**:
```python
# backend/app/db/models/에 추가 필요
- track.py (음악 파일 모델)
- album.py (앨범 모델)
- artist.py (아티스트 모델)
- playlist.py (플레이리스트 모델)
```

### 2. CRITICAL - 핵심 서비스 구현
**문제**: 음악 스캔, 메타데이터 추출, 스트리밍 서비스가 완전히 누락
**영향**: 기본 기능 전무

**필요한 작업**:
```python
# backend/app/services/에 추가 필요
- file_scanner.py (파일 스캔)
- metadata_extractor.py (메타데이터 추출)
- streaming_service.py (스트리밍)
```

### 3. HIGH - API 엔드포인트 부족
**문제**: /health, /auth만 있고 음악 관련 API 없음
**영향**: 프론트엔드에서 음악 데이터 접근 불가

**필요한 작업**:
```python
# backend/app/api/routes/에 추가 필요
- tracks.py (음악 파일 API)
- albums.py (앨범 API)
- artists.py (아티스트 API)
- playlists.py (플레이리스트 API)
- streaming.py (스트리밍 API)
```

### 4. HIGH - 프론트엔드 핵심 컴포넌트 누락
**문제**: 기본 React 구조만 있고 음악 플레이어 없음
**영향**: 사용자가 음악을 재생할 수 없음

**필요한 작업**:
```typescript
// frontend/src/components/에 추가 필요
- AudioPlayer.tsx (음악 플레이어)
- TrackList.tsx (음악 목록)
- AlbumGrid.tsx (앨범 그리드)
- SearchBox.tsx (검색)
```

## 단계별 즉시 실행 계획

### Phase 1 (1-2일): 기반 구조 완성
1. **데이터베이스 모델 추가**
   - Track, Album, Artist, Playlist 모델 생성
   - Alembic 마이그레이션 파일 생성

2. **의존성 패키지 추가**
   - requirements.txt에 mutagen, librosa 추가
   - package.json에 howler.js 추가

3. **기본 서비스 구현**
   - FileScanner 기본 구조
   - MetadataExtractor 기본 구조

### Phase 2 (2-3일): 핵심 기능 구현
1. **API 엔드포인트 구현**
   - 트랙 CRUD API
   - 앨범 CRUD API
   - 기본 검색 API

2. **프론트엔드 플레이어**
   - 기본 AudioPlayer 컴포넌트
   - 재생/일시정지/탐색 기능

3. **파일 스캔 기능**
   - /mnt/nas-music 디렉토리 스캔
   - 메타데이터 추출 및 DB 저장

### Phase 3 (3-4일): 통합 및 테스트
1. **스트리밍 서비스**
   - 파일 스트리밍 API
   - HTTP Range 요청 지원

2. **검색 기능**
   - 실시간 검색
   - 필터링

3. **테스트 및 디버깅**
   - 기본 기능 테스트
   - 통합 테스트

## 즉시 수정해야 할 설정 파일들

### 1. requirements.txt 업데이트
```bash
# 현재 파일에 추가 필요
mutagen==1.47.0  # 이미 있음
librosa==0.10.0
Pillow==10.0.0
aiofiles==23.2.1
```

### 2. package.json 업데이트
```json
{
  "dependencies": {
    // 기존 의존성...
    "howler": "^2.2.0",
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.0.0"
  }
}
```

### 3. Alembic 설정 확인
- 현재 migration이 user 테이블만 생성
- music 관련 테이블 migration 필요

## 위험 요소 및 대응

### 1. SSHFS 마운트 의존성
**위험**: /mnt/nas-music 마운트 실패 시 전체 시스템 중단
**대응**:
- 로컬 테스트용 더미 음악 파일 준비
- 마운트 상태 체크 로직 추가

### 2. 대용량 파일 처리
**위험**: 메모리 부족으로 스캔 실패
**대응**:
- 스트리밍 방식으로 파일 처리
- 배치 크기 제한

### 3. 동시성 문제
**위험**: 여러 사용자 동시 접속 시 성능 저하
**대응**:
- 비동기 처리 우선 적용
- 연결 풀링 설정

## 성공 지표

### 1일차 목표
- [ ] Track, Album, Artist 모델 생성 완료
- [ ] 기본 파일 스캔 서비스 동작
- [ ] /tracks API 기본 CRUD 완료

### 3일차 목표
- [ ] 음악 플레이어에서 파일 재생 가능
- [ ] 기본 검색 기능 동작
- [ ] 10개 이상 음악 파일 스캔/표시 가능

### 7일차 목표
- [ ] 전체 음악 라이브러리 스캔 완료
- [ ] 플레이리스트 생성/관리 가능
- [ ] 모바일에서 기본 음악 재생 가능

## 즉시 시작 가능한 작업

1. **데이터베이스 모델 생성** (30분)
2. **requirements.txt 업데이트** (10분)
3. **기본 API 엔드포인트 추가** (1시간)
4. **간단한 파일 스캔 스크립트** (1시간)

이러한 작업들을 우선적으로 진행하면 기본적인 음악 관리 시스템이 작동하게 될 것입니다.