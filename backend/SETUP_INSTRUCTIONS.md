# Music Manager - Setup Instructions

## 🚀 Quick Setup (Recommended)

전체 설정을 한 번에 실행하려면:

```bash
cd backend
python scripts/full_setup.py
```

이 스크립트는 다음 작업을 순서대로 실행합니다:
1. 데이터베이스 스키마 생성
2. 관리자 계정 생성
3. `/mnt/nas-music` 라이브러리 스캔

## 📋 단계별 Setup

개별 단계로 실행하려면:

### 1. 의존성 설치
```bash
cd backend
pip install -r requirements.txt
```

### 2. 데이터베이스 설정
```bash
python scripts/setup_database.py
```

### 3. 음악 라이브러리 스캔
```bash
python scripts/scan_music_library.py
```

### 4. 서버 실행
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 예상 결과

### 라이브러리 구조:
- `/mnt/nas-music/jazz/` - Jazz 음악
- `/mnt/nas-music/rock/` - Rock 음악
- `/mnt/nas-music/classical/` - Classical 음악
- 기타 폴더들...

### 스캔 예상 소요시간:
- **1.1GB 음악 파일**: 약 2-5분
- **처리 속도**: 약 50-100 파일/초

### 관리자 계정:
- **Email**: admin@music-manager.local
- **Password**: admin123
- **Role**: Admin

## 🔧 문제 해결

### 마운트 확인
```bash
# /mnt/nas-music 마운트 상태 확인
df -h | grep nas-music
ls -la /mnt/nas-music/
```

### 로그 확인
```bash
# 스캔 로그 확인
tail -f music_scan.log
```

### 데이터베이스 확인
```bash
# SQLite 데이터베이스 확인
sqlite3 music_manager.db "SELECT COUNT(*) FROM tracks;"
sqlite3 music_manager.db "SELECT COUNT(*) FROM albums;"
sqlite3 music_manager.db "SELECT COUNT(*) FROM artists;"
```

## 🌐 API 접근

### API 문서
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 주요 엔드포인트
- `GET /tracks` - 트랙 목록
- `GET /albums` - 앨범 목록
- `GET /artists` - 아티스트 목록
- `GET /stream/tracks/{id}` - 음악 스트리밍
- `POST /library/scan` - 라이브러리 스캔

### 인증 테스트
```bash
# 로그인으로 JWT 토큰 받기
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@music-manager.local", "password": "admin123"}'

# 트랙 목록 조회
curl -X GET "http://localhost:8000/tracks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📈 성능 최적화

### 대용량 라이브러리의 경우
- 스캔 중 다른 작업을 피해주세요
- SSD 스토리지 사용 권장
- 충분한 메모리 (4GB+) 권장

### 중복 파일 처리
- 스캔 후 중복 파일 목록이 표시됩니다
- `music_scan.log`에서 상세 정보 확인 가능
- 중복 파일은 자동으로 스킵됩니다

## ✅ 설정 완료 확인

모든 설정이 완료되면:

1. ✅ 데이터베이스에 트랙/앨범/아티스트 데이터 존재
2. ✅ API 서버 정상 실행 (http://localhost:8000)
3. ✅ 관리자 계정으로 로그인 가능
4. ✅ 음악 스트리밍 동작 확인

이제 프론트엔드 개발을 진행할 수 있습니다! 🎉