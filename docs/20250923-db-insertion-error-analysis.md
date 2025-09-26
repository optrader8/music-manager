# DB 삽입 오류 분석 보고서

**날짜:** 2025-09-23
**분석 대상:** analyze.sh 실행 후 생성된 파일들
**목적:** 데이터베이스 삽입 오류 원인 파악

## 🔍 분석 결과: DB 삽입 오류 원인들

### 1. **Schema Constraints 문제** 📏
**Track 모델의 Unique Constraints:**
- `tracks:29` - `file_path`에 대한 unique constraint
- `tracks:29` - `file_hash`에 대한 unique constraint

**잠재적 문제:**
- 동일한 `file_path` 또는 `file_hash`를 가진 레코드가 이미 존재할 때 삽입 실패
- 중복 파일 처리 로직에서 constraint violation 발생 가능

### 2. **String Length 제한** 📝
**analysis_service.py의 Column 길이 제한:**
- `ScanLog.file_path`: 1024자 제한 (`scan_log.py:15`)
- `ScanLog.reason`: 255자 제한 (`scan_log.py:17`)
- `Track.title`: 255자 제한 (`track.py:39`)
- `Track.file_path`: 1024자 제한 (`track.py:44`)

**현재 데이터에서 확인된 긴 경로:**
```
/mnt/nas-music/jazz/Brad Mehldau/Brad Mehldau/2010 - Highway Rider/CD 2/05 Brad Mehldau - Old West.mp3
```

### 3. **Transaction 관리 문제** 🔄
**analysis_service.py:173에서 발견:**
```python
# Commit all database changes
self.session.commit()
```

**문제점:**
- 모든 레코드를 한 번에 커밋
- 하나의 레코드에서 오류 발생 시 전체 트랜잭션 롤백 가능
- 배치 처리 중 메모리 부족이나 락 타임아웃 발생 가능

### 4. **Foreign Key 참조 문제** 🔗
**Track 모델에서:**
- `artist_id` → `artists.id` (`track.py:34`)
- `album_id` → `albums.id` (`track.py:37`)

**오류 원인:**
- 존재하지 않는 artist_id나 album_id 참조 시도
- Album/Artist 생성 전에 Track 삽입 시도

### 5. **Data Type Mismatch** ⚠️
**Nullable 필드 처리:**
- `file_hash`가 필수(`nullable=False`)이지만 계산 실패 시 빈 문자열 반환 (`analysis_service.py:211`)
- `title`이 필수이지만 메타데이터에서 추출 실패 가능

### 6. **동시성 문제** 🔀
**분석된 코드에서:**
- 89,834개 파일을 순차 처리
- 각 파일마다 개별 DB 조작
- 동시 실행 시 race condition 가능

### 7. **메타데이터 추출 오류** 📊
**skipped_files.json에서 확인된 패턴:**
- `"reason": "unknown_skip"`
- `"error_message": "File not in database but metadata readable"`
- 187개 파일이 "unknown_skip" 상태

**근본 원인:**
메타데이터는 읽히지만 DB 삽입에서 실패하는 경우

## 📊 분석 데이터 요약

**전체 파일:** 89,834개
**처리된 파일:** 58,442개
**스킵된 파일:** 187개
**중복 파일:** 63개
**메타데이터 오류:** 5개

**주요 스킵 사유:**
- unknown_skip: 182개
- metadata_error: 5개

## 💡 해결 방안 제안

### 1. **Batch Processing 구현**
```python
# 트랜잭션을 작은 단위로 분할
batch_size = 100
for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    try:
        process_batch(batch)
        session.commit()
    except Exception as e:
        session.rollback()
        # 개별 레코드 처리
```

### 2. **Error Handling 개선**
- 개별 레코드 실패 시 계속 진행
- 상세한 오류 로깅
- 실패 원인별 분류

### 3. **데이터 검증 강화**
- Path Length Check: 1024자 초과 경로 사전 검증
- Foreign Key Validation: Artist/Album 존재 확인 후 Track 삽입
- 필수 필드 null/empty 검증

### 4. **중복 처리 개선**
```python
# ON CONFLICT 또는 INSERT IGNORE 패턴 사용
INSERT INTO tracks (...) VALUES (...)
ON CONFLICT (file_path) DO UPDATE SET ...
```

### 5. **성능 최적화**
- 벌크 삽입 사용
- 인덱스 최적화
- 메모리 사용량 모니터링

## 🔧 즉시 적용 가능한 수정사항

1. **analysis_service.py:158** - 스킵된 파일 저장 로직을 try-catch로 감싸기
2. **analysis_service.py:173** - 배치 커밋으로 변경
3. **track.py** - file_path 길이 검증 추가
4. **scan_log.py** - error_message 필드 길이 확장

## 📁 관련 파일

- `/backend/app/services/analysis_service.py` - 메인 분석 로직
- `/backend/app/db/models/track.py` - Track 모델 정의
- `/backend/app/db/models/scan_log.py` - ScanLog, DuplicateFile 모델
- `/analysis_reports/skipped_files.json` - 스킵된 파일 목록
- `/analysis_reports/analysis_summary.json` - 분석 요약