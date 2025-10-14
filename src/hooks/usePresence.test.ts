import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePresence } from './usePresence';
import * as presenceService from '../services/presence.service';
import * as useAuthModule from './useAuth';

vi.mock('../services/presence.service');
vi.mock('./useAuth');

describe('usePresence Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => usePresence());

    expect(result.current.users).toEqual([]);
    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should set user online on mount', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(presenceService.setUserOnline).mockResolvedValue(undefined);
    vi.mocked(presenceService.setUserOffline).mockResolvedValue(undefined);
    vi.mocked(presenceService.subscribeToPresence).mockReturnValue(vi.fn());

    renderHook(() => usePresence());

    await waitFor(() => {
      expect(presenceService.setUserOnline).toHaveBeenCalledWith(
        'user123',
        'Test User',
        '#4ECDC4'
      );
    });
  });

  it('should subscribe to presence updates', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    const mockUsers = [
      {
        userId: 'user1',
        userName: 'Alice',
        color: '#FF6B6B',
        online: true,
        lastSeen: Date.now(),
      },
      {
        userId: 'user2',
        userName: 'Bob',
        color: '#4ECDC4',
        online: false,
        lastSeen: Date.now() - 60000,
      },
    ];

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(presenceService.setUserOnline).mockResolvedValue(undefined);
    vi.mocked(presenceService.setUserOffline).mockResolvedValue(undefined);
    vi.mocked(presenceService.subscribeToPresence).mockImplementation((callback) => {
      callback(mockUsers);
      return vi.fn();
    });

    const { result } = renderHook(() => usePresence());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
      expect(result.current.onlineUsers).toHaveLength(1);
      expect(result.current.onlineUsers[0].userName).toBe('Alice');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should set user offline on unmount', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    const mockUnsubscribe = vi.fn();

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(presenceService.setUserOnline).mockResolvedValue(undefined);
    vi.mocked(presenceService.subscribeToPresence).mockReturnValue(mockUnsubscribe);
    vi.mocked(presenceService.setUserOffline).mockResolvedValue(undefined);

    const { unmount } = renderHook(() => usePresence());

    unmount();

    await waitFor(() => {
      expect(presenceService.setUserOffline).toHaveBeenCalledWith('user123');
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  it('should filter online users correctly', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    const mockUsers = [
      { userId: 'user1', userName: 'Alice', color: '#FF6B6B', online: true, lastSeen: Date.now() },
      { userId: 'user2', userName: 'Bob', color: '#4ECDC4', online: false, lastSeen: Date.now() },
      { userId: 'user3', userName: 'Charlie', color: '#95E1D3', online: true, lastSeen: Date.now() },
    ];

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(presenceService.setUserOnline).mockResolvedValue(undefined);
    vi.mocked(presenceService.setUserOffline).mockResolvedValue(undefined);
    vi.mocked(presenceService.subscribeToPresence).mockImplementation((callback) => {
      callback(mockUsers);
      return vi.fn();
    });

    const { result } = renderHook(() => usePresence());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(3);
      expect(result.current.onlineUsers).toHaveLength(2);
      expect(result.current.onlineUsers.map(u => u.userName)).toEqual(['Alice', 'Charlie']);
    });
  });

  it('should handle errors when setting user online', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });

    vi.mocked(presenceService.setUserOnline).mockRejectedValue(new Error('Network error'));
    vi.mocked(presenceService.setUserOffline).mockResolvedValue(undefined);
    vi.mocked(presenceService.subscribeToPresence).mockReturnValue(vi.fn());

    renderHook(() => usePresence());

    // Should not throw, just log error
    await waitFor(() => {
      expect(presenceService.setUserOnline).toHaveBeenCalled();
    });
  });
});

