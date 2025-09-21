# 아키텍처 개선 제안 (Architecture Improvements)

## 현재 아키텍처 문제점

### 1. 모놀리식 접근
- 모든 서비스가 단일 FastAPI 앱에 집중
- 서비스간 책임 분리 부족
- 확장성 제약

### 2. 에러 처리 전략 부재
- 전역 예외 처리기 미구현
- 재시도 로직 없음
- 장애 복구 메커니즘 부재

### 3. 보안 고려사항 부족
- 파일 경로 검증 부족
- CORS 설정 미흡
- JWT 토큰 관리 개선 필요

## 제안하는 개선사항

### 1. 서비스 레이어 아키텍처

```
backend/app/
├── services/
│   ├── file_scanner.py      # 파일 스캔 서비스
│   ├── dejavu_service.py    # 음원 식별 서비스
│   ├── streaming.py         # 스트리밍 서비스
│   ├── metadata.py          # 메타데이터 관리
│   └── broadcast.py         # 방송 서비스
├── workers/
│   ├── scan_worker.py       # 백그라운드 스캔 작업
│   └── fingerprint_worker.py # Dejavu 처리 작업
└── exceptions/
    ├── base.py              # 기본 예외 클래스
    ├── filesystem.py        # 파일시스템 예외
    └── audio.py             # 오디오 처리 예외
```

### 2. 데이터베이스 최적화

- 복합 인덱스 추가
- FTS5 검색 테이블 구현
- 파티셔닝 전략 (대용량 라이브러리용)
- 연결 풀링 설정

### 3. 캐싱 전략

```python
# Redis 캐싱 레이어
class CacheService:
    async def cache_metadata(self, track_id: int, metadata: dict)
    async def cache_search_results(self, query: str, results: list)
    async def cache_album_art(self, album_id: int, image_data: bytes)
```

### 4. 스트리밍 최적화

- HTTP Range 요청 지원
- 적응형 비트레이트 스트리밍
- CDN 통합 준비
- 압축 최적화

### 5. 모니터링 및 로깅

```python
# 구조화된 로깅
import structlog

logger = structlog.get_logger()

# 메트릭 수집
from prometheus_client import Counter, Histogram

scan_files_total = Counter('scan_files_total', 'Total scanned files')
stream_duration = Histogram('stream_duration_seconds', 'Streaming duration')
```

## 보안 강화 방안

### 1. 입력 검증
- 파일 경로 화이트리스트
- SQL 인젝션 방지
- XSS 보호

### 2. 인증/인가 개선
- JWT 토큰 블랙리스트
- Role-based 권한 관리
- API 레이트 리미팅

### 3. 파일 시스템 보안
- 심볼릭 링크 검증
- 디렉토리 트래버설 방지
- 파일 권한 확인

## 성능 최적화 전략

### 1. 병렬 처리
- 파일 스캔 워커 풀
- 비동기 메타데이터 처리
- 백그라운드 작업 큐

### 2. 메모리 관리
- 스트리밍 버퍼 최적화
- 가비지 컬렉션 튜닝
- 메모리 리크 모니터링

### 3. I/O 최적화
- SSHFS 연결 풀링
- 파일 시스템 캐싱
- 배치 처리 최적화

## 확장성 고려사항

### 1. 마이크로서비스 전환 준비
- 서비스 경계 명확화
- API 버전 관리
- 서비스 디스커버리

### 2. 데이터베이스 확장
- 읽기 복제본 설정
- 샤딩 전략
- 백업/복원 자동화

### 3. 로드 밸런싱
- 세션 무상태화
- 헬스 체크 엔드포인트
- 그레이스풀 셧다운