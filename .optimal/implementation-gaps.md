# 구현 격차 분석 (Implementation Gaps Analysis)

## 현재 상태 요약

다른 에이전트가 기본 프로젝트 구조를 생성했지만, 핵심 기능들이 아직 구현되지 않은 상태입니다.

## 주요 미구현 항목

### 1. 핵심 서비스 레이어 누락
- **File Scanner Service**: 음악 파일 스캔 및 메타데이터 추출 (완전 누락)
- **Dejavu Service**: 음원 지문 생성 및 매칭 (완전 누락)
- **Streaming Service**: 음악 스트리밍 서비스 (완전 누락)
- **Metadata Service**: 메타데이터 관리 (완전 누락)

### 2. 데이터 모델 불완전
- 현재: 기본 user/auth 모델만 존재
- 필요: Album, Track, Artist, Playlist 모델 (requirements.txt에 mutagen 누락)

### 3. API 엔드포인트 부족
- 현재: `/health`, `/auth` 엔드포인트만 존재
- 필요: 음악 라이브러리, 검색, 플레이어, 스트리밍 API

### 4. 프론트엔드 기능 부족
- 현재: 기본 React 구조만 존재
- 필요: 음악 플레이어, 라이브러리 브라우저, 검색 UI

### 5. 의존성 누락
- `dejavu` 라이브러리 누락
- `ffmpeg-python` 누락 (스트리밍용)
- `Pillow` 누락 (이미지 처리용)
- `tenacity` 누락 (재시도 로직용)

## 우선순위별 구현 계획

### Phase 1: 기반 인프라 (CRITICAL)
1. 데이터 모델 완성 (Album, Track, Artist)
2. File Scanner Service 구현
3. Metadata 추출 기능

### Phase 2: 핵심 기능 (HIGH)
1. 기본 API 엔드포인트 구현
2. 음악 스트리밍 서비스
3. 프론트엔드 플레이어 컴포넌트

### Phase 3: 고급 기능 (MEDIUM)
1. Dejavu 통합
2. 검색 기능
3. 플레이리스트 관리

## 기술적 위험 요소

1. **SSHFS 의존성**: 마운트 실패 시 전체 시스템 중단
2. **대용량 처리**: 10,000곡+ 스캔 성능 최적화 미비
3. **동시성**: 멀티유저 스트리밍 고려 부족
4. **오류 처리**: 파일 시스템 오류 시 복구 로직 부재

## 성능 고려사항

1. **데이터베이스 인덱싱**: FTS5 검색 테이블 누락
2. **캐싱 전략**: Redis 설정되었지만 활용 코드 없음
3. **스트리밍 최적화**: HTTP Range 헤더 처리 미구현