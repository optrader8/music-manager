export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedTime: string;
  fileType?: string;
  permissions: string;
}

export interface DirectoryListing {
  currentPath: string;
  parentPath?: string;
  items: FileItem[];
  totalItems: number;
}

export interface RenameRequest {
  newName: string;
}

export interface MP3TagData {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  tracknumber?: string;
}

export interface MP3TagUpdate {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  tracknumber?: string;
}
