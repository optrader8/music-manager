import { apiClient } from './apiClient';
import type { DirectoryListing, MP3TagData, MP3TagUpdate } from '@/types/file';

export const fileService = {
  async browseDirectory(path: string = '', search?: string): Promise<DirectoryListing> {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    if (search) params.append('search', search);

    const response = await apiClient.get(`/files/browse?${params}`);
    return response.data;
  },

  async deleteFile(filePath: string): Promise<void> {
    await apiClient.delete(`/files/${encodeURIComponent(filePath)}`);
  },

  async renameFile(filePath: string, newName: string): Promise<{ newPath: string }> {
    const response = await apiClient.put(`/files/${encodeURIComponent(filePath)}/rename`, {
      new_name: newName,
    });
    return response.data;
  },

  async getMP3Tags(filePath: string): Promise<MP3TagData> {
    const response = await apiClient.get(`/files/${encodeURIComponent(filePath)}/mp3-tags`);
    return response.data;
  },

  async updateMP3Tags(filePath: string, tagData: MP3TagUpdate): Promise<void> {
    await apiClient.put(`/files/${encodeURIComponent(filePath)}/mp3-tags`, tagData);
  },
};
