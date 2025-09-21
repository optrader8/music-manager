# 코드 리뷰 및 수정 필요사항

## 현재 백엔드 상태 분석

다른 에이전트가 추가로 구현한 내용:
- ✅ MetadataService - 메타데이터 업데이트 서비스
- ✅ MusicBrainzClient - 외부 음악 데이터베이스 연동
- ✅ 모든 주요 API 엔드포인트 (tracks, albums, artists, library, streaming)
- ✅ 스키마 정의 완료

## 발견된 문제점들

### 1. CRITICAL 문제 - Library Scan API 로직 오류

**파일**: `app/api/routes/library.py:22-25`

**문제**:
```python
def run_scan():
    scanner = FileScannerService(session, settings.music_library_path)
    result = scanner.scan()
    return result
```

**이슈**:
- BackgroundTasks에서 새로운 DB session을 사용하면 연결이 끊어짐
- 반환값이 백그라운드 태스크에서 무시됨
- 에러 처리가 없음

**수정 필요**:
- 백그라운드 태스크 내에서 새 세션 생성
- 에러 처리 및 로깅 추가
- 스캔 결과를 데이터베이스에 저장

### 2. HIGH - Stream Service의 파일 리소스 관리

**파일**: `app/services/streaming_service.py:28-32`

**문제**:
```python
file_obj = await aiofiles.open(file_path, "rb")
await file_obj.seek(start)
return file_obj, start, end, content_type
```

**이슈**:
- 파일 객체가 반환되지만 적절히 닫히지 않을 수 있음
- Context manager 사용 권장

### 3. MEDIUM - 중복된 Artist/Album 생성 로직

**파일**:
- `app/services/file_scanner_service.py:185-214`
- `app/services/metadata_service.py:92-121`

**문제**:
- 동일한 로직이 두 서비스에 중복됨
- DRY 원칙 위반

**수정 필요**:
- 공통 유틸리티로 추출

### 4. MEDIUM - MusicBrainz Client 리소스 정리

**파일**: `app/services/musicbrainz_client.py:26-27`

**문제**:
```python
def close(self) -> None:
    self._client.close()
```

**이슈**:
- 수동으로 close() 호출 필요
- Context manager 패턴 미사용

### 5. LOW - 미완성된 스캔 상태 추적

**파일**: `app/api/routes/library.py:37-39`

**문제**:
```python
# For now, return a simple status
# In a production environment, you'd want to track scan jobs in the database
return {"status": "idle", "message": "No scan in progress"}
```

**이슈**:
- 하드코딩된 상태 반환
- 실제 스캔 진행 상황 추적 없음

## 제안하는 수정사항

### 1. Library Scan 개선
```python
@router.post("/scan")
async def scan_library(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    async def run_scan():
        from app.db.session import get_session
        async for session in get_session():
            try:
                scanner = FileScannerService(session, settings.music_library_path)
                result = scanner.scan()
                # TODO: Save scan result to database
                logger.info(f"Scan completed: {result}")
            except Exception as e:
                logger.error(f"Scan failed: {e}")
            finally:
                session.close()

    background_tasks.add_task(run_scan)
    return {"message": "Library scan started"}
```

### 2. Streaming Service 개선
```python
async def stream_file(self, file_path: Path, range_header: Optional[str] = None):
    # Use context manager for proper resource management
    async with aiofiles.open(file_path, "rb") as file_obj:
        # ... existing logic
        yield chunk
```

### 3. 공통 Repository 패턴 도입
```python
class ArtistRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_or_create(self, name: str) -> Artist:
        # Centralized artist creation logic
```

## 권장 다음 단계

1. **CRITICAL 문제 우선 해결**: Library scan API 수정
2. **리소스 관리 개선**: File streaming context manager 적용
3. **코드 중복 제거**: Repository 패턴 도입
4. **에러 처리 강화**: 전역 예외 처리기 구현
5. **로깅 추가**: 구조화된 로깅 시스템 구축

## 테스트 필요 영역

1. 백그라운드 스캔 작업 테스트
2. 파일 스트리밍 범위 요청 테스트
3. MusicBrainz API 통합 테스트
4. 동시성 처리 테스트 (여러 사용자 스트리밍)

## 추가 고려사항

- CORS 설정 검토 필요
- API 레이트 리미팅 구현
- 캐싱 전략 수립 (Redis 활용)
- 모니터링 및 헬스체크 강화