# Design Document

## Overview

파일 브라우저 기능은 음악 관리 시스템에 `/mnt/nas-music/` 디렉토리를 탐색하고 파일을 관리할 수 있는 웹 기반 인터페이스를 제공합니다. 이 기능은 기존의 FastAPI 백엔드와 React 프론트엔드 아키텍처를 확장하여 구현됩니다.

## Architecture

### Backend Architecture

파일 브라우저 기능은 다음과 같은 백엔드 컴포넌트로 구성됩니다:

1. **API Router** (`backend/app/api/routes/files.py`)
   - RESTful API 엔드포인트 제공
   - 인증 및 권한 검증
   - 요청 검증 및 응답 포맷팅

2. **File Service** (`backend/app/services/file_service.py`)
   - 파일 시스템 작업 로직
   - 보안 검증 및 경로 정규화
   - 파일/폴더 메타데이터 수집

3. **Schemas** (`backend/app/schemas/file.py`)
   - API 요청/응답 데이터 모델
   - 데이터 검증 및 직렬화

### Frontend Architecture

프론트엔드는 기존 React 구조를 확장하여 구현됩니다:

1. **File Browser Page** (`frontend/src/pages/FileBrowserPage.tsx`)
   - 메인 파일 브라우저 인터페이스
   - 라우팅 및 상태 관리

2. **File Browser Components**
   - `FileList.tsx`: 파일/폴더 목록 표시
   - `FileItem.tsx`: 개별 파일/폴더 아이템
   - `Breadcrumb.tsx`: 경로 네비게이션
   - `FileActions.tsx`: 파일 작업 메뉴
   - `ConfirmDialog.tsx`: 삭제/수정 확인 대화상자

3. **File Service** (`frontend/src/services/fileService.ts`)
   - API 호출 및 데이터 관리
   - 에러 처리

## Components and Interfaces

### Backend API Endpoints

```
GET /api/v1/files/browse?path={path}&search={search}
- 디렉토리 내용 조회
- 검색 기능 지원

DELETE /api/v1/files/{file_path}
- 파일 삭제

PUT /api/v1/files/{file_path}/rename
- 파일 이름 변경

DELETE /api/v1/files/directory/{dir_path}
- 폴더 삭제 (재귀적)
```

### Data Models

#### FileItem Schema
```python
class FileItem(BaseModel):
    name: str
    path: str
    is_directory: bool
    size: Optional[int] = None
    modified_time: datetime
    file_type: Optional[str] = None
    permissions: str
```

#### DirectoryListing Schema
```python
class DirectoryListing(BaseModel):
    current_path: str
    parent_path: Optional[str] = None
    items: List[FileItem]
    total_items: int
```

### Frontend Interfaces

#### FileItem Interface
```typescript
interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedTime: string;
  fileType?: string;
  permissions: string;
}

interface DirectoryListing {
  currentPath: string;
  parentPath?: string;
  items: FileItem[];
  totalItems: number;
}
```

## Data Models

### File System Security Model

1. **Path Validation**
   - 모든 경로는 `/mnt/nas-music/` 하위로 제한
   - 상대 경로 공격 방지 (`../` 등)
   - 심볼릭 링크 검증

2. **Permission Model**
   - 관리자 권한 사용자만 파일 수정/삭제 가능
   - 읽기 전용 사용자는 탐색만 가능
   - 시스템 파일 접근 제한

3. **File Type Restrictions**
   - 허용된 파일 확장자만 표시
   - 숨김 파일 처리 정책
   - 실행 파일 접근 제한

## Error Handling

### Backend Error Handling

1. **File System Errors**
   - 파일 없음 (404 Not Found)
   - 권한 없음 (403 Forbidden)
   - 디스크 공간 부족 (507 Insufficient Storage)
   - I/O 오류 (500 Internal Server Error)

2. **Security Errors**
   - 경로 접근 거부 (403 Forbidden)
   - 인증 실패 (401 Unauthorized)
   - 권한 부족 (403 Forbidden)

3. **Validation Errors**
   - 잘못된 경로 형식 (400 Bad Request)
   - 파일명 규칙 위반 (400 Bad Request)

### Frontend Error Handling

1. **User-Friendly Messages**
   - 한국어 오류 메시지 제공
   - 구체적인 해결 방법 제시
   - 재시도 옵션 제공

2. **Error Recovery**
   - 자동 재시도 메커니즘
   - 이전 상태로 복원
   - 오프라인 상태 처리

## Testing Strategy

### Backend Testing

1. **Unit Tests**
   - FileService 메서드별 테스트
   - 경로 검증 로직 테스트
   - 권한 검증 테스트

2. **Integration Tests**
   - API 엔드포인트 테스트
   - 파일 시스템 작업 테스트
   - 인증/권한 통합 테스트

3. **Security Tests**
   - 경로 탐색 공격 테스트
   - 권한 우회 시도 테스트
   - 입력 검증 테스트

### Frontend Testing

1. **Component Tests**
   - 각 컴포넌트 렌더링 테스트
   - 사용자 상호작용 테스트
   - 상태 변화 테스트

2. **Integration Tests**
   - API 호출 테스트
   - 라우팅 테스트
   - 에러 처리 테스트

3. **E2E Tests**
   - 전체 파일 브라우저 워크플로우 테스트
   - 파일 작업 시나리오 테스트
   - 다양한 브라우저 호환성 테스트

## Security Considerations

### Path Security
- 모든 파일 경로는 `/mnt/nas-music/` 하위로 제한
- `os.path.realpath()`를 사용하여 심볼릭 링크 해결
- 상대 경로 공격 방지를 위한 경로 정규화

### Authentication & Authorization
- JWT 토큰 기반 인증 사용
- 관리자 권한 검증 미들웨어
- 세션 타임아웃 관리

### Input Validation
- 파일명 특수문자 제한
- 경로 길이 제한
- 파일 크기 제한

### Audit Logging
- 모든 파일 작업 로깅
- 사용자 행동 추적
- 보안 이벤트 모니터링

## Performance Considerations

### Backend Optimization
- 디렉토리 스캔 결과 캐싱
- 대용량 디렉토리 페이지네이션
- 비동기 파일 작업

### Frontend Optimization
- 가상 스크롤링으로 대용량 목록 처리
- 이미지 썸네일 지연 로딩
- 검색 결과 디바운싱

### Caching Strategy
- 디렉토리 메타데이터 Redis 캐싱
- 브라우저 캐싱 헤더 설정
- API 응답 캐싱

## Integration Points

### Existing System Integration
- 기존 인증 시스템 활용
- 현재 네비게이션 메뉴에 파일 브라우저 추가
- 기존 UI 컴포넌트 재사용

### Music Library Integration
- 음악 파일 메타데이터 표시
- 라이브러리 스캔과 연동
- 플레이리스트 생성 연결

## Deployment Considerations

### Environment Variables
```
FILE_BROWSER_ROOT_PATH=/mnt/nas-music/
FILE_BROWSER_MAX_FILE_SIZE=100MB
FILE_BROWSER_CACHE_TTL=300
```

### Docker Configuration
- 볼륨 마운트 설정
- 파일 권한 관리
- 보안 컨텍스트 설정

### Monitoring
- 파일 작업 메트릭 수집
- 에러율 모니터링
- 성능 지표 추적