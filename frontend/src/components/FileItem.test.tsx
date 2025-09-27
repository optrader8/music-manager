import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileItem from './FileItem';
import type { FileItem as FileItemType } from '@/types/file';

const mockItem: FileItemType = {
  name: 'test.mp3',
  path: '/test.mp3',
  isDirectory: false,
  size: 1024,
  modifiedTime: '2024-01-01T00:00:00Z',
  fileType: 'audio',
  permissions: '644',
};

describe('FileItem', () => {
  it('renders file item correctly', () => {
    const onClick = vi.fn();
    const onAction = vi.fn();

    render(<FileItem item={mockItem} onClick={onClick} onAction={onAction} />);

    expect(screen.getByText('test.mp3')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Size: 1.0 KB')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const onAction = vi.fn();

    render(<FileItem item={mockItem} onClick={onClick} onAction={onAction} />);

    fireEvent.click(screen.getByText('test.mp3').closest('.cursor-pointer')!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows actions menu on hover', () => {
    const onClick = vi.fn();
    const onAction = vi.fn();

    render(<FileItem item={mockItem} onClick={onClick} onAction={onAction} />);

    const item = screen.getByText('test.mp3').closest('.group')!;
    fireEvent.mouseEnter(item);

    // MoreVertical icon should be visible on hover
    const moreIcon =
      item.querySelector('[data-testid="more-vertical"]') || item.querySelector('svg');
    expect(moreIcon).toBeInTheDocument();
  });
});
