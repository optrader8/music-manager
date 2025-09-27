import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Breadcrumb from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders root path correctly', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb path="/" onNavigate={onNavigate} />);

    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  it('renders nested path correctly', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb path="/folder1/folder2" onNavigate={onNavigate} />);

    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('folder1')).toBeInTheDocument();
    expect(screen.getByText('folder2')).toBeInTheDocument();
  });

  it('calls onNavigate when breadcrumb clicked', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb path="/folder1/folder2" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText('folder1'));
    expect(onNavigate).toHaveBeenCalledWith('/folder1');
  });
});
