import { describe, it, expect, vi } from 'vitest';
import { formatDuration, formatFileSize, debounce } from '../utils';

describe('utils', () => {
  describe('formatDuration', () => {
    it('should format seconds to MM:SS for durations under 1 hour', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3599)).toBe('59:59');
    });

    it('should format seconds to H:MM:SS for durations over 1 hour', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    it('should handle decimal seconds by flooring', () => {
      expect(formatDuration(90.7)).toBe('1:30');
      expect(formatDuration(3600.9)).toBe('1:00:00');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0.0 B');
      expect(formatFileSize(500)).toBe('500.0 B');
      expect(formatFileSize(1023)).toBe('1023.0 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1023)).toBe('1023.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call function multiple times quickly
      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(100);

      // Function should be called with the last argument
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');

      vi.useRealTimers();
    });

    it('should reset debounce timer on new calls', () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      vi.advanceTimersByTime(50);

      // Call again before debounce completes
      debouncedFn('second');
      vi.advanceTimersByTime(50);

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Complete the debounce
      vi.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');

      vi.useRealTimers();
    });
  });
});
