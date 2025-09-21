# 데이터베이스 설정 및 초기 스캔 계획

## 현재 상태

- ✅ SQLAlchemy 모델 완성 (User, Artist, Album, Track, Playlist)
- ✅ Alembic 마이그레이션 설정 완료
- ✅ FileScannerService 구현 완료
- ⚠️ 초기 데이터베이스 구축 필요
- ⚠️ 기존 MP3 파일 스캔 필요

## 데이터베이스 초기화 단계

### 1. 환경 설정 확인
```bash
# .env 파일 생성 필요
DATABASE_URL=sqlite:///./music_manager.db
MUSIC_LIBRARY_PATH=/mnt/nas-music
SECRET_KEY=your-super-secret-key
```

### 2. 마이그레이션 실행
```bash
cd backend
alembic upgrade head
```

### 3. 초기 사용자 생성
```python
# scripts/create_admin_user.py
from app.core.security import get_password_hash
from app.db.models import User, UserRole
from app.db.session import SessionLocal

def create_admin_user():
    session = SessionLocal()
    admin_user = User(
        email="admin@music-manager.local",
        display_name="Administrator",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    session.add(admin_user)
    session.commit()
    print("Admin user created: admin@music-manager.local / admin123")
```

## 파일 시스템 준비

### 1. SSHFS 마운트 확인
```bash
# 마운트 상태 확인
df -h | grep "/mnt/nas-music"

# 마운트되지 않은 경우
sudo mkdir -p /mnt/nas-music
sudo sshfs user@remote-server:/music /mnt/nas-music -o allow_other
```

### 2. 테스트 음악 파일 준비 (개발용)
```bash
# 테스트용 로컬 디렉토리 생성
mkdir -p /tmp/test-music
# 샘플 MP3 파일들을 /tmp/test-music에 복사
# 환경변수에서 MUSIC_LIBRARY_PATH=/tmp/test-music로 설정
```

## 초기 스캔 프로세스

### 1. 수동 스캔 스크립트
```python
# scripts/initial_scan.py
import sys
import logging
from pathlib import Path
from app.db.session import SessionLocal
from app.services import FileScannerService
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_initial_scan():
    if not settings.music_library_path.exists():
        logger.error(f"Music library path does not exist: {settings.music_library_path}")
        sys.exit(1)

    session = SessionLocal()
    try:
        scanner = FileScannerService(session, settings.music_library_path)
        logger.info("Starting initial library scan...")

        result = scanner.scan()

        logger.info(f"Scan completed!")
        logger.info(f"Files scanned: {result.scanned_files}")
        logger.info(f"Tracks created: {result.created_tracks}")
        logger.info(f"Tracks updated: {result.updated_tracks}")
        logger.info(f"Files skipped: {result.skipped_files}")
        logger.info(f"Duplicates found: {len(result.duplicates)}")

        if result.duplicates:
            logger.warning("Duplicate files found:")
            for dup in result.duplicates:
                logger.warning(f"  Original: {dup.existing_path}")
                logger.warning(f"  Duplicate: {dup.duplicate_path}")

    except Exception as e:
        logger.error(f"Scan failed: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    run_initial_scan()
```

### 2. API를 통한 스캔
```bash
# 서버 실행 후
curl -X POST "http://localhost:8000/library/scan" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 예상 문제점 및 해결책

### 1. 대용량 라이브러리 처리
**문제**: 수만 개의 파일이 있을 경우 메모리 부족 및 긴 처리 시간

**해결책**:
- 배치 처리로 1000개씩 나누어 처리
- 진행률 표시 기능 추가
- 메모리 사용량 모니터링

### 2. 파일 권한 문제
**문제**: SSHFS 마운트된 파일에 대한 접근 권한

**해결책**:
- allow_other 옵션으로 마운트
- 적절한 사용자 권한 설정

### 3. 메타데이터 추출 오류
**문제**: 손상된 파일이나 지원하지 않는 포맷

**해결책**:
- try-catch로 개별 파일 오류 처리
- 스킵된 파일 로그 기록
- 부분적 성공 허용

## 성능 최적화 방안

### 1. 데이터베이스 최적화
```sql
-- 인덱스 추가 (마이그레이션에 포함)
CREATE INDEX idx_tracks_title ON tracks(title);
CREATE INDEX idx_tracks_artist_album ON tracks(artist_id, album_id);
CREATE INDEX idx_albums_artist_year ON albums(artist_id, release_year);
```

### 2. 병렬 처리
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def parallel_scan(file_paths, max_workers=4):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        tasks = [
            loop.run_in_executor(executor, process_file, path)
            for path in file_paths
        ]
        return await asyncio.gather(*tasks)
```

## 검증 체크리스트

- [ ] 데이터베이스 스키마 생성 확인
- [ ] Admin 사용자 로그인 가능
- [ ] 음악 파일 경로 접근 가능
- [ ] 최소 10개 파일 스캔 성공
- [ ] API 엔드포인트 동작 확인
- [ ] 스트리밍 기능 테스트
- [ ] 중복 파일 감지 테스트
- [ ] 메타데이터 정확성 확인

이 계획에 따라 단계적으로 진행하면 안정적인 백엔드 시스템을 구축할 수 있습니다.