import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MP3TagEditModal from './MP3TagEditModal';
import type { MP3TagData } from '@/types/file';

const mockTags: MP3TagData = {
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  genre: 'Rock',
  year: '2024',
  tracknumber: '1',
};

describe('MP3TagEditModal', () => {
  it('does not render when not open', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <MP3TagEditModal
        filePath="/test.mp3"
        currentTags={mockTags}
        isOpen={false}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.queryByText('Edit MP3 Tags')).not.toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <MP3TagEditModal
        filePath="/test.mp3"
        currentTags={mockTags}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Edit MP3 Tags')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Song')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Artist')).toBeInTheDocument();
  });

  it('calls onSave with updated tags', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <MP3TagEditModal
        filePath="/test.mp3"
        currentTags={mockTags}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Song');
    fireEvent.change(titleInput, { target: { value: 'Updated Song' } });

    fireEvent.click(screen.getByText('Save Tags'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        ...mockTags,
        title: 'Updated Song',
      });
    });
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <MP3TagEditModal
        filePath="/test.mp3"
        currentTags={mockTags}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
