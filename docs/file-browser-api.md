# File Browser API Documentation

파일 브라우저 기능을 위한 REST API 엔드포인트 문서입니다.

## 개요

File Browser API는 Music Manager 시스템에서 `/mnt/nas-music` 디렉토리 하위의 음악 파일들을 안전하게 탐색, 관리할 수 있는 기능을 제공합니다.

## 인증

모든 File Browser API 엔드포인트는 관리자 권한이 필요합니다.

```http
Authorization: Bearer <access_token>
```

## 기본 URL

```
http://localhost:32000/api/v1/files
```

## 엔드포인트

### 1. 디렉토리 탐색

**GET** `/browse`

지정된 경로의 디렉토리 내용을 조회합니다.

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `path` | string | 선택 | 상대 경로 (기본값: "") |
| `search` | string | 선택 | 파일명 검색어 |

#### 예시 요청

```bash
# 루트 디렉토리 탐색
GET /api/v1/files/browse

# 특정 디렉토리 탐색
GET /api/v1/files/browse?path=Albums/Artist1

# 검색과 함께 탐색
GET /api/v1/files/browse?path=Albums&search=song
```

#### 응답

```json
{
  "current_path": "/Albums/Artist1",
  "parent_path": "/Albums",
  "items": [
    {
      "name": "album.mp3",
      "path": "Albums/Artist1/album.mp3",
      "is_directory": false,
      "size": 5242880,
      "modified_time": "2024-01-15T10:30:00",
      "file_type": "audio",
      "permissions": "644"
    },
    {
      "name": "Subfolder",
      "path": "Albums/Artist1/Subfolder",
      "is_directory": true,
      "size": null,
      "modified_time": "2024-01-15T10:30:00",
      "file_type": null,
      "permissions": "755"
    }
  ],
  "total_items": 2
}
```

#### 오류 응답

| 상태 코드 | 설명 |
|----------|------|
| 400 | 잘못된 경로 (보안 제한) |
| 403 | 권한 없음 |
| 404 | 디렉토리를 찾을 수 없음 |

---

### 2. 파일/폴더 삭제

**DELETE** `/{file_path}`

지정된 파일 또는 폴더를 삭제합니다.

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file_path` | string | 필수 | 삭제할 파일/폴더의 상대 경로 |

#### 예시 요청

```bash
# 파일 삭제
DELETE /api/v1/files/Albums/Artist1/song.mp3

# 폴더 삭제 (하위 모든 내용 포함)
DELETE /api/v1/files/Albums/Artist1/Subfolder
```

#### 응답

```json
{
  "message": "File deleted successfully"
}
```

#### 오류 응답

| 상태 코드 | 설명 |
|----------|------|
| 400 | 잘못된 경로 |
| 403 | 권한 없음 |
| 404 | 파일을 찾을 수 없음 |
| 500 | 삭제 실패 |

---

### 3. 파일/폴더 이름 변경

**PUT** `/{file_path}/rename`

파일 또는 폴더의 이름을 변경합니다.

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file_path` | string | 필수 | 이름을 변경할 파일/폴더의 상대 경로 |

#### 요청 본문

```json
{
  "new_name": "new_filename.mp3"
}
```

#### 예시 요청

```bash
PUT /api/v1/files/Albums/Artist1/old_song.mp3/rename
Content-Type: application/json

{
  "new_name": "new_song.mp3"
}
```

#### 응답

```json
{
  "message": "File renamed successfully",
  "new_path": "Albums/Artist1/new_song.mp3"
}
```

#### 오류 응답

| 상태 코드 | 설명 |
|----------|------|
| 400 | 잘못된 파일명 |
| 403 | 권한 없음 |
| 404 | 파일을 찾을 수 없음 |
| 409 | 동일한 이름의 파일이 이미 존재 |

---

### 4. MP3 태그 조회

**GET** `/{file_path}/mp3-tags`

MP3 파일의 메타데이터 태그를 조회합니다.

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file_path` | string | 필수 | MP3 파일의 상대 경로 |

#### 예시 요청

```bash
GET /api/v1/files/Albums/Artist1/song.mp3/mp3-tags
```

#### 응답

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "genre": "Pop",
  "year": "2024",
  "tracknumber": "1"
}
```

#### 오류 응답

| 상태 코드 | 설명 |
|----------|------|
| 400 | MP3 파일이 아님 또는 태그 읽기 실패 |
| 403 | 권한 없음 |
| 404 | 파일을 찾을 수 없음 |

---

### 5. MP3 태그 수정

**PUT** `/{file_path}/mp3-tags`

MP3 파일의 메타데이터 태그를 수정합니다.

#### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file_path` | string | 필수 | MP3 파일의 상대 경로 |

#### 요청 본문

```json
{
  "title": "Updated Song Title",
  "artist": "Updated Artist Name",
  "album": "Updated Album Name",
  "genre": "Rock",
  "year": "2024",
  "tracknumber": "2"
}
```

#### 예시 요청

```bash
PUT /api/v1/files/Albums/Artist1/song.mp3/mp3-tags
Content-Type: application/json

{
  "title": "My Favorite Song",
  "artist": "Great Artist",
  "album": "Best Album",
  "genre": "Jazz",
  "year": "2024",
  "tracknumber": "3"
}
```

#### 응답

```json
{
  "message": "MP3 tags updated successfully"
}
```

#### 오류 응답

| 상태 코드 | 설명 |
|----------|------|
| 400 | MP3 파일이 아님 또는 태그 수정 실패 |
| 403 | 권한 없음 |
| 404 | 파일을 찾을 수 없음 |

---

## 데이터 타입

### FileItem

```typescript
interface FileItem {
  name: string;           // 파일/폴더명
  path: string;           // 상대 경로
  is_directory: boolean;  // 디렉토리 여부
  size: number | null;    // 파일 크기 (바이트)
  modified_time: string;  // 수정 시간 (ISO 8601)
  file_type: string | null; // 파일 타입 ('audio', 'image', 'text', 'file')
  permissions: string;    // 권한 (octal)
}
```

### DirectoryListing

```typescript
interface DirectoryListing {
  current_path: string;   // 현재 경로
  parent_path: string | null; // 부모 경로
  items: FileItem[];      // 파일/폴더 목록
  total_items: number;    // 총 항목 수
}
```

### MP3TagData

```typescript
interface MP3TagData {
  title: string | null;       // 곡 제목
  artist: string | null;      // 아티스트
  album: string | null;       // 앨범명
  genre: string | null;       // 장르
  year: string | null;        // 연도
  tracknumber: string | null; // 트랙 번호
}
```

---

## 보안 고려사항

1. **경로 제한**: 모든 접근은 `/mnt/nas-music` 하위로 제한됩니다.
2. **경로 정규화**: 상대 경로 공격(`../`)을 방지합니다.
3. **심볼릭 링크**: 심볼릭 링크를 통한 경로 우회를 차단합니다.
4. **권한 검증**: 모든 요청에 관리자 권한이 필요합니다.
5. **파일명 검증**: 안전하지 않은 문자가 포함된 파일명을 거부합니다.

---

## 사용 예시

### Python 클라이언트 예시

```python
import requests

base_url = "http://localhost:32000/api/v1/files"
headers = {"Authorization": "Bearer your_token_here"}

# 디렉토리 탐색
response = requests.get(f"{base_url}/browse?path=Albums", headers=headers)
directory_data = response.json()

# 파일 삭제
response = requests.delete(f"{base_url}/old_file.mp3", headers=headers)

# 파일 이름 변경
response = requests.put(
    f"{base_url}/old_name.mp3/rename",
    json={"new_name": "new_name.mp3"},
    headers=headers
)

# MP3 태그 수정
response = requests.put(
    f"{base_url}/song.mp3/mp3-tags",
    json={
        "title": "New Title",
        "artist": "New Artist",
        "album": "New Album"
    },
    headers=headers
)
```

### JavaScript/TypeScript 클라이언트 예시

```typescript
const baseUrl = 'http://localhost:32000/api/v1/files';
const headers = {
  'Authorization': 'Bearer your_token_here',
  'Content-Type': 'application/json'
};

// 디렉토리 탐색
const browseDirectory = async (path: string = '', search?: string) => {
  const params = new URLSearchParams();
  if (path) params.append('path', path);
  if (search) params.append('search', search);

  const response = await fetch(`${baseUrl}/browse?${params}`, { headers });
  return response.json();
};

// MP3 태그 수정
const updateMp3Tags = async (filePath: string, tags: MP3TagData) => {
  const response = await fetch(`${baseUrl}/${filePath}/mp3-tags`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(tags)
  });
  return response.json();
};
```