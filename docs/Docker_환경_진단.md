# Docker 환경 진단 가이드

## 개요

Docker 컨테이너 환경에서 Music Manager 애플리케이션이 정상적으로 작동하지 않을 때 사용하는 진단 가이드입니다.

---

## 1. 컨테이너 상태 확인

### 1.1 실행 중인 컨테이너 확인

```bash
# 모든 컨테이너 상태 확인
docker ps -a

# 특정 프로젝트의 컨테이너만 확인
docker-compose ps
```

**확인 사항:**
- [ ] 모든 필요한 컨테이너가 Up 상태인가?
- [ ] 컨테이너가 재시작을 반복하지 않는가?
- [ ] 포트 매핑이 올바른가?

### 1.2 컨테이너 리소스 사용량

```bash
# 리소스 사용량 실시간 모니터링
docker stats

# 특정 컨테이너 리소스 확인
docker stats <container_name>
```

**주의 사항:**
- CPU 사용률이 100%에 근접하면 성능 문제 가능
- 메모리 사용률이 높으면 OOM(Out of Memory) 위험
- 네트워크 I/O 병목 확인

---

## 2. 로그 분석

### 2.1 컨테이너 로그 확인

```bash
# 전체 로그 확인
docker logs <container_name>

# 최근 로그만 확인
docker logs <container_name> --tail=50

# 실시간 로그 스트리밍
docker logs <container_name> -f

# 타임스탬프 포함
docker logs <container_name> --timestamps

# 특정 시간 이후 로그
docker logs <container_name> --since="2025-11-10T00:00:00"
```

### 2.2 로그 패턴 분석

```bash
# 에러 로그만 필터링
docker logs <container_name> 2>&1 | grep -i error

# 경고 로그 확인
docker logs <container_name> 2>&1 | grep -i warning

# 특정 키워드 검색
docker logs <container_name> 2>&1 | grep -i "database\|connection\|failed"
```

### 2.3 Docker Compose 통합 로그

```bash
# 모든 서비스 로그 확인
docker-compose logs

# 특정 서비스만
docker-compose logs backend frontend

# 실시간 로그
docker-compose logs -f

# 최근 100줄
docker-compose logs --tail=100
```

---

## 3. 네트워크 진단

### 3.1 Docker 네트워크 확인

```bash
# 네트워크 목록
docker network ls

# 네트워크 상세 정보
docker network inspect <network_name>

# 특정 컨테이너의 네트워크 설정
docker inspect <container_name> | jq '.[0].NetworkSettings'
```

### 3.2 컨테이너 간 통신 테스트

```bash
# 컨테이너 내부에서 다른 컨테이너로 ping
docker exec -it <container_name> ping <other_container_name>

# HTTP 연결 테스트
docker exec -it <container_name> curl http://<other_container>:<port>/health

# DNS 해석 확인
docker exec -it <container_name> nslookup <other_container_name>
```

### 3.3 포트 매핑 확인

```bash
# 열린 포트 확인
docker port <container_name>

# 호스트에서 포트 접근 테스트
curl http://localhost:<port>/health

# 네트워크 리스닝 확인
netstat -tuln | grep <port>
```

---

## 4. 볼륨 및 파일 시스템

### 4.1 볼륨 확인

```bash
# 볼륨 목록
docker volume ls

# 볼륨 상세 정보
docker volume inspect <volume_name>

# 사용하지 않는 볼륨 찾기
docker volume ls -qf dangling=true
```

### 4.2 마운트된 볼륨 확인

```bash
# 컨테이너의 마운트 포인트 확인
docker inspect <container_name> | jq '.[0].Mounts'

# 컨테이너 내부에서 마운트 확인
docker exec -it <container_name> df -h

# 특정 디렉토리 내용 확인
docker exec -it <container_name> ls -la /path/to/mounted/dir
```

### 4.3 파일 권한 문제

```bash
# 파일 소유자 및 권한 확인
docker exec -it <container_name> ls -la /path/to/files

# 컨테이너 실행 사용자 확인
docker exec -it <container_name> whoami
docker exec -it <container_name> id

# 권한 문제 임시 해결 (테스트용)
docker exec -it <container_name> chmod -R 755 /path/to/files
```

---

## 5. 환경 변수 및 설정

### 5.1 환경 변수 확인

```bash
# 컨테이너의 환경 변수 확인
docker exec -it <container_name> env

# 특정 변수만 확인
docker exec -it <container_name> env | grep DATABASE

# docker-compose에서 정의된 환경 변수 확인
docker-compose config
```

### 5.2 설정 파일 확인

```bash
# 설정 파일 내용 확인
docker exec -it <container_name> cat /app/config/default.json

# .env 파일 확인 (호스트)
cat .env

# 환경별 설정 비교
diff .env.example .env
```

---

## 6. 데이터베이스 연결

### 6.1 데이터베이스 컨테이너 확인

```bash
# PostgreSQL 연결 테스트
docker exec -it <db_container> psql -U <username> -d <database> -c "SELECT version();"

# MySQL 연결 테스트
docker exec -it <db_container> mysql -u<username> -p<password> -e "SELECT VERSION();"

# MongoDB 연결 테스트
docker exec -it <db_container> mongo --eval "db.version()"
```

### 6.2 데이터베이스 상태 확인

```bash
# PostgreSQL 데이터베이스 목록
docker exec -it <db_container> psql -U <username> -l

# MySQL 데이터베이스 목록
docker exec -it <db_container> mysql -u<username> -p<password> -e "SHOW DATABASES;"

# 테이블 목록 확인
docker exec -it <db_container> psql -U <username> -d <database> -c "\dt"
```

### 6.3 연결 로그 확인

```bash
# PostgreSQL 로그
docker logs <db_container> 2>&1 | grep -i "connection\|error"

# 연결 수 확인 (PostgreSQL)
docker exec -it <db_container> psql -U <username> -d <database> -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 7. 컨테이너 내부 디버깅

### 7.1 셸 접근

```bash
# Bash 셸 실행
docker exec -it <container_name> /bin/bash

# sh 셸 실행 (Alpine Linux 등)
docker exec -it <container_name> /bin/sh

# 특정 명령어 실행
docker exec -it <container_name> <command>
```

### 7.2 프로세스 확인

```bash
# 컨테이너 내부 프로세스 확인
docker exec -it <container_name> ps aux

# 포트 리스닝 확인
docker exec -it <container_name> netstat -tuln

# 또는
docker exec -it <container_name> ss -tuln
```

### 7.3 디스크 사용량

```bash
# 디스크 사용량 확인
docker exec -it <container_name> df -h

# 특정 디렉토리 크기
docker exec -it <container_name> du -sh /app/*

# 큰 파일 찾기
docker exec -it <container_name> find / -type f -size +100M
```

---

## 8. Docker Compose 진단

### 8.1 설정 검증

```bash
# docker-compose.yml 문법 확인
docker-compose config

# 특정 서비스만 표시
docker-compose config --services

# 환경 변수 치환 결과 확인
docker-compose config
```

### 8.2 서비스 재시작

```bash
# 모든 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart backend

# 서비스 중지 및 시작
docker-compose stop backend
docker-compose start backend

# 완전히 재구성
docker-compose down
docker-compose up -d
```

### 8.3 빌드 문제

```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 특정 서비스만 빌드
docker-compose build backend

# 빌드 후 재시작
docker-compose up -d --build
```

---

## 9. 일반적인 문제 해결

### 문제 1: 컨테이너가 즉시 종료됨

**진단:**
```bash
docker ps -a
docker logs <container_name>
```

**가능한 원인:**
- 애플리케이션 시작 실패
- 환경 변수 누락
- 포트 충돌
- 의존성 문제

**해결:**
- 로그에서 정확한 에러 메시지 확인
- 환경 변수 검증
- 포트 변경 또는 충돌 프로세스 종료

### 문제 2: 컨테이너 간 통신 불가

**진단:**
```bash
docker network inspect <network_name>
docker exec -it <container> ping <other_container>
```

**가능한 원인:**
- 다른 네트워크에 속함
- 서비스 이름 불일치
- 방화벽 규칙

**해결:**
```yaml
# docker-compose.yml
services:
  backend:
    networks:
      - app-network
  frontend:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 문제 3: 볼륨 데이터가 보이지 않음

**진단:**
```bash
docker exec -it <container> ls -la /mounted/path
docker inspect <container> | jq '.[0].Mounts'
```

**가능한 원인:**
- 경로 오타
- 상대 경로 사용
- 권한 문제

**해결:**
```yaml
# docker-compose.yml - 절대 경로 사용
services:
  backend:
    volumes:
      - /absolute/path/on/host:/app/data
      # 또는 named volume
      - data-volume:/app/data

volumes:
  data-volume:
```

### 문제 4: 메모리 부족

**진단:**
```bash
docker stats
docker logs <container> | grep -i "out of memory\|oom"
```

**해결:**
```yaml
# docker-compose.yml
services:
  backend:
    mem_limit: 2g
    mem_reservation: 1g
```

### 문제 5: 느린 성능

**진단:**
```bash
docker stats
docker exec -it <container> top
```

**가능한 원인:**
- 리소스 제한
- 비효율적인 코드
- 과도한 로깅
- I/O 병목

**해결:**
- 리소스 할당 증가
- 코드 최적화
- 로그 레벨 조정
- 볼륨 마운트 최적화 (일부 파일 시스템에서는 cached/delegated 옵션 사용)

---

## 10. 유용한 명령어 모음

### 정리 명령어

```bash
# 중지된 컨테이너 삭제
docker container prune

# 사용하지 않는 이미지 삭제
docker image prune

# 사용하지 않는 볼륨 삭제
docker volume prune

# 사용하지 않는 네트워크 삭제
docker network prune

# 모든 것 정리 (주의!)
docker system prune -a
```

### 모니터링

```bash
# 실시간 이벤트 모니터링
docker events

# 특정 컨테이너 이벤트
docker events --filter container=<container_name>

# 시스템 정보
docker info

# 디스크 사용량
docker system df
```

### 백업 및 복구

```bash
# 컨테이너를 이미지로 저장
docker commit <container_name> backup-image

# 볼륨 백업
docker run --rm -v <volume_name>:/data -v $(pwd):/backup ubuntu tar czf /backup/backup.tar.gz /data

# 볼륨 복구
docker run --rm -v <volume_name>:/data -v $(pwd):/backup ubuntu tar xzf /backup/backup.tar.gz -C /
```

---

## 진단 체크리스트

단계별로 다음 항목들을 확인하세요:

- [ ] **1단계**: 모든 컨테이너가 실행 중인가?
- [ ] **2단계**: 로그에 에러 메시지가 있는가?
- [ ] **3단계**: 네트워크 연결이 정상인가?
- [ ] **4단계**: 볼륨이 올바르게 마운트되었는가?
- [ ] **5단계**: 환경 변수가 올바르게 설정되었는가?
- [ ] **6단계**: 데이터베이스 연결이 가능한가?
- [ ] **7단계**: 포트가 올바르게 매핑되었는가?
- [ ] **8단계**: 리소스(CPU/메모리)가 충분한가?

---

## 관련 문서

- `음악파일_조회_문제_진단.md` - 음악 파일 관련 특화 진단
- `빠른_진단_체크리스트.md` - 빠른 문제 파악을 위한 체크리스트
- `문제점_분석_리포트.md` - 발견된 문제점 기록

---

**작성일:** 2025-11-10
**버전:** 1.0
**상태:** 초안
