import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as authService from '../../services/auth.service';

vi.mock('../../services/auth.service');

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
      expect(screen.getByText(/Canvas Coming Soon/i)).toBeInTheDocument();
    });
  });
});

