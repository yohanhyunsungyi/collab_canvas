import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import * as authService from '../../services/auth.service';

vi.mock('../../services/auth.service');

// Mock canvas service
vi.mock('../../services/canvas.service', () => ({
  fetchAllShapes: vi.fn().mockResolvedValue([]),
  subscribeToShapes: vi.fn(() => vi.fn()), // Return unsubscribe function
  createShape: vi.fn().mockResolvedValue('test-id'),
  updateShape: vi.fn().mockResolvedValue(undefined),
  deleteShape: vi.fn().mockResolvedValue(undefined),
}));

// Mock Konva components to avoid canvas errors in tests
vi.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Transformer: () => <div data-testid="konva-transformer" />,
}));

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('basic rendering test', () => {
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows login page when not authenticated', async () => {
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    });
  });

  it('shows canvas when authenticated', async () => {
    const mockUser = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'CollabCanvas' })).toBeInTheDocument();
    });
  });
});

