# Navidrome 서버 연결 가이드

## 📋 서버 정보

**Navidrome 서버 URL**: https://nas-1.parrot-mine.ts.net
**접근 방식**: Tailscale Funnel (HTTPS)
**포트**: 4533 (Funnel을 통해 자동 매핑)
**인증 방식**: SubSonic API 호환

---

## 🌐 웹 브라우저 접속

### 직접 접속
```
URL: https://nas-1.parrot-mine.ts.net
```

1. 브라우저에서 URL 접속
2. Navidrome 로그인 페이지 표시
3. 계정 정보 입력
4. "Remember me" 체크 (선택사항)
5. 로그인

### 로그인 후 화면
- 🎵 앨범 그리드/리스트 뷰
- 🎨 좌측 사이드바 (Artists, Albums, Playlists, Genres)
- 🔍 상단 검색 바
- 🎧 하단 플레이어 컨트롤

---

## 📱 모바일 앱 연결

### iOS - play:Sub (추천)

**설정**:
```
Server Name: My Navidrome
Server URL: nas-1.parrot-mine.ts.net
Port: (비워두기)
Path: /
Username: admin
Password: [your_password]
Use SSL: ✅ 체크
```

**연결 순서**:
1. App Store에서 "play:Sub" 다운로드
2. Settings → Servers → Add Server
3. 위 정보 입력
4. Test Connection
5. 성공 시 라이브러리 동기화

**기능**:
- ✅ 오프라인 캐싱
- ✅ 플레이리스트 동기화
- ✅ 가사 표시
- ✅ AirPlay/CarPlay 지원

### Android - DSub

**설정**:
```
Server: nas-1.parrot-mine.ts.net
Use SSL: ✅
Port: (비워두기)
Username: admin
Password: [your_password]
```

**연결 순서**:
1. Google Play에서 "DSub" 설치
2. Settings → Servers → Add New Server
3. 정보 입력
4. Test Connection
5. Sync

**기능**:
- ✅ 다운로드 관리
- ✅ 크로스페이드
- ✅ 이퀄라이저
- ✅ Chromecast 지원

---

## 💻 데스크톱 클라이언트

### Sonixd (Windows/Mac/Linux)

**다운로드**: https://github.com/jeffvli/sonixd/releases

**연결 설정**:
```
Server URL: https://nas-1.parrot-mine.ts.net
Username: admin
Password: [your_password]
```

**특징**:
- 현대적인 UI
- 키보드 단축키
- 스마트 플레이리스트
- 로컬 캐싱

### Sublime Music (Linux)

**설치** (Ubuntu):
```bash
sudo apt install sublime-music
```

**연결**:
- File → Add Server
- URL: `https://nas-1.parrot-mine.ts.net`
- Credentials 입력

---

## 🔧 SubSonic API 테스트

### cURL로 연결 테스트

#### 1. Ping 테스트
```bash
curl "https://nas-1.parrot-mine.ts.net/rest/ping?u=admin&p=enc:YOUR_ENCODED_PASSWORD&f=json"
```

**예상 응답**:
```json
{
  "subsonic-response": {
    "status": "ok",
    "version": "1.16.1",
    "type": "navidrome",
    "serverVersion": "0.52.5",
    "openSubsonic": true
  }
}
```

#### 2. 음악 폴더 조회
```bash
curl "https://nas-1.parrot-mine.ts.net/rest/getMusicFolders?u=admin&p=enc:YOUR_ENCODED_PASSWORD&f=json"
```

#### 3. 아티스트 목록
```bash
curl "https://nas-1.parrot-mine.ts.net/rest/getArtists?u=admin&p=enc:YOUR_ENCODED_PASSWORD&f=json"
```

#### 4. 앨범 리스트 (최신순)
```bash
curl "https://nas-1.parrot-mine.ts.net/rest/getAlbumList2?type=newest&size=20&u=admin&p=enc:YOUR_ENCODED_PASSWORD&f=json"
```

### 인증 방식

SubSonic API는 두 가지 인증 방식을 지원합니다:

#### 방법 1: 평문 패스워드 (간단, HTTPS 필수)
```
?u=admin&p=YourPassword&f=json
```

#### 방법 2: 토큰 기반 (보안, 권장)
```bash
# Salt 생성
SALT=$(openssl rand -hex 16)

# Token 계산 (password + salt를 MD5 해시)
TOKEN=$(echo -n "YourPassword${SALT}" | md5sum | awk '{print $1}')

# API 호출
curl "https://nas-1.parrot-mine.ts.net/rest/ping?u=admin&t=${TOKEN}&s=${SALT}&f=json"
```

---

## 🎵 Music Manager와 병행 사용

### 시스템 구성도

```
/mnt/nas-music (음악 라이브러리)
     ↓
     ├─→ Music Manager (Docker)
     │   ├─ Backend: http://g2.parrot-mine.ts.net:32000
     │   ├─ Frontend: http://g2.parrot-mine.ts.net:32001
     │   └─ 기능: 파일 관리, 태그 편집, DB 관리
     │
     └─→ Navidrome
         ├─ URL: https://nas-1.parrot-mine.ts.net
         └─ 기능: SubSonic API, 모바일 스트리밍
```

### 역할 분담

| 작업 | 사용 시스템 | 이유 |
|------|------------|------|
| 파일 이름 변경 | Music Manager | 강력한 파일 브라우저 |
| MP3 태그 편집 | Music Manager | 웹 기반 태그 에디터 |
| 앨범 커버 업로드 | Music Manager | 커버 관리 기능 |
| 모바일 스트리밍 | Navidrome | 앱 지원 완벽 |
| 외부 접속 | Navidrome | Tailscale Funnel |
| 데스크톱 감상 | 둘 다 | 취향에 맞게 |
| 통계/분석 | Music Manager | 상세한 통계 |

### 라이브러리 동기화

두 시스템이 같은 음악 파일을 사용하므로:

1. **Music Manager에서 파일 수정**
   ```bash
   # Music Manager에서 태그 편집
   # → 파일 시스템 변경
   ```

2. **Navidrome에서 새로고침**
   ```
   Settings → Scan Library Now
   # 또는 자동 스캔 대기 (기본 1분마다)
   ```

3. **변경사항 반영**
   - Navidrome이 파일 변경 감지
   - 메타데이터 자동 업데이트
   - 모바일 앱에 동기화

---

## 🔒 보안 설정

### Tailscale Funnel 보안

**현재 설정**:
- ✅ HTTPS 자동 (Let's Encrypt)
- ✅ Tailscale 네트워크 보안
- ✅ 방화벽 규칙 자동 관리

**추가 보안 (선택사항)**:

#### 1. IP 제한
Navidrome 설정 파일에 신뢰할 수 있는 IP만 허용:

```toml
# /etc/navidrome/navidrome.toml
[RateLimiting]
Enabled = true
RequestsPerSecond = 10
BurstSize = 30
```

#### 2. 비밀번호 변경
```
Navidrome 웹 UI → Settings → Change Password
```

#### 3. Two-Factor Authentication
Navidrome은 현재 2FA를 지원하지 않으므로:
- 강력한 비밀번호 사용 ✅
- 정기적인 비밀번호 변경 권장
- 신뢰할 수 있는 기기만 "Remember me"

---

## 📊 성능 최적화

### Navidrome 설정

```toml
# /etc/navidrome/navidrome.toml

# 스캔 간격 (초)
ScanInterval = "5m"

# 트랜스코딩 (필요시)
[Transcoding]
  CacheSize = "100MB"

# 커버 캐시
[CoverArtPriority]
  "cover.*" = 1
  "folder.*" = 2
```

### 클라이언트 최적화

**모바일 앱**:
- 비트레이트: WiFi 320kbps, LTE 192kbps
- 캐시 크기: 2-5GB
- 프리로딩: 다음 3곡

**데스크톱**:
- 원본 품질 스트리밍
- 로컬 캐시 활성화

---

## 🎯 시작하기 (Quick Start)

### 1단계: 웹 접속
```
https://nas-1.parrot-mine.ts.net
```

### 2단계: 로그인
- Username: `admin`
- Password: [your_password]

### 3단계: 라이브러리 확인
- 좌측 "Albums" 클릭
- 앨범 목록 확인

### 4단계: 모바일 앱 설치
- iOS: play:Sub
- Android: DSub

### 5단계: 앱 연결
```
Server: nas-1.parrot-mine.ts.net
Username: admin
Password: [your_password]
SSL: ON
```

### 6단계: 음악 감상 🎵
- 어디서나 접속
- 오프라인 캐싱
- 완벽한 스트리밍

---

## 🐛 문제 해결

### 연결 실패

**증상**: "Server not reachable"

**해결**:
1. URL 확인: `https://nas-1.parrot-mine.ts.net` (http 아님!)
2. 인터넷 연결 확인
3. Tailscale Funnel 상태 확인:
   ```bash
   tailscale funnel status
   ```

### 인증 실패

**증상**: "Wrong username or password"

**해결**:
1. 대소문자 정확히 입력
2. 특수문자 확인
3. 웹 UI에서 먼저 로그인 테스트

### 음악 파일 없음

**증상**: 빈 라이브러리

**해결**:
1. Settings → Scan Library Now
2. 음악 폴더 경로 확인: `/mnt/nas-music`
3. 파일 권한 확인

---

## 📚 참고 문서

- [Navidrome 공식 문서](https://www.navidrome.org/docs/)
- [SubSonic API 문서](https://www.subsonic.org/pages/api.jsp)
- [Tailscale Funnel 가이드](https://tailscale.com/kb/1223/funnel/)

---

## 🎉 다음 단계

1. ✅ 웹 브라우저로 접속 완료
2. ✅ 모바일 앱 연결
3. ⏳ 플레이리스트 생성
4. ⏳ 즐겨찾기 추가
5. ⏳ 외출 중 음악 감상

---

**작성일**: 2025-11-10
**버전**: 1.0
**서버 URL**: https://nas-1.parrot-mine.ts.net
**상태**: 운영 중 ✅
