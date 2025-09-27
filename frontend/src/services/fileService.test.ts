import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileService } from './fileService';
import apiClient from './apiClient';

// Mock apiClient
vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('browseDirectory', () => {
    it('calls apiClient.get with correct params', async () => {
      const mockResponse = {
        data: {
          currentPath: '/',
          items: [],
          totalItems: 0,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await fileService.browseDirectory('', 'search');

      expect(mockApiClient.get).toHaveBeenCalledWith('/files/browse?path=&search=search');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteFile', () => {
    it('calls apiClient.delete with correct path', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await fileService.deleteFile('/test.mp3');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/files/%2Ftest.mp3');
    });
  });

  describe('renameFile', () => {
    it('calls apiClient.put with correct params', async () => {
      const mockResponse = {
        data: { newPath: '/new.mp3' },
      };
      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await fileService.renameFile('/test.mp3', 'new.mp3');

      expect(mockApiClient.put).toHaveBeenCalledWith('/files/%2Ftest.mp3/rename', {
        new_name: 'new.mp3',
      });
      expect(result).toEqual({ newPath: '/new.mp3' });
    });
  });

  describe('getMP3Tags', () => {
    it('calls apiClient.get for MP3 tags', async () => {
      const mockTags = { title: 'Test', artist: 'Artist' };
      const mockResponse = { data: mockTags };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await fileService.getMP3Tags('/test.mp3');

      expect(mockApiClient.get).toHaveBeenCalledWith('/files/%2Ftest.mp3/mp3-tags');
      expect(result).toEqual(mockTags);
    });
  });

  describe('updateMP3Tags', () => {
    it('calls apiClient.put with tag data', async () => {
      const tagData = { title: 'New Title' };
      mockApiClient.put.mockResolvedValue({});

      await fileService.updateMP3Tags('/test.mp3', tagData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/files/%2Ftest.mp3/mp3-tags', tagData);
    });
  });
});
