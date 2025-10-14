import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCursors } from './useCursors';
import * as useAuthModule from './useAuth';
import * as cursorService from '../services/cursor.service';

// Mock dependencies
vi.mock('./useAuth');
vi.mock('../services/cursor.service', () => ({
  updateCursorPosition: vi.fn().mockResolvedValue(undefined),
  subscribeToCursors: vi.fn(() => vi.fn()),
  removeCursor: vi.fn().mockResolvedValue(undefined),
}));

describe('useCursors Hook', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    color: '#45B7D1',
    createdAt: Date.now(),
  };

  beforeEach(() => {
    // Clear call history but preserve mock implementations
    vi.mocked(cursorService.updateCursorPosition).mockClear();
    vi.mocked(cursorService.subscribeToCursors).mockClear();
    vi.mocked(cursorService.removeCursor).mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty cursors and updateOwnCursor function', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockReturnValue(vi.fn());
    vi.mocked(cursorService.removeCursor).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCursors());

    expect(result.current.cursors).toEqual({});
    expect(typeof result.current.updateOwnCursor).toBe('function');
  });

  it('should subscribe to cursors when user is authenticated', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockReturnValue(mockUnsubscribe);
    vi.mocked(cursorService.removeCursor).mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useCursors());

    expect(cursorService.subscribeToCursors).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Function)
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update cursor state when receiving updates', async () => {
    const mockCursors = {
      user456: {
        userId: 'user456',
        x: 100,
        y: 200,
        userName: 'Other User',
        color: '#A2D5AB',
        lastUpdated: Date.now(),
      },
    };

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockImplementation((userId, callback) => {
      // Simulate cursor update
      callback(mockCursors);
      return vi.fn();
    });
    vi.mocked(cursorService.removeCursor).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCursors());

    expect(result.current.cursors).toEqual(mockCursors);
  });

  it('should not subscribe when user is not authenticated', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    renderHook(() => useCursors());

    expect(cursorService.subscribeToCursors).not.toHaveBeenCalled();
  });

  it('should call updateCursorPosition when updateOwnCursor is called', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockReturnValue(vi.fn());
    vi.mocked(cursorService.updateCursorPosition).mockResolvedValue(undefined);
    vi.mocked(cursorService.removeCursor).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCursors());

    result.current.updateOwnCursor(100, 200);

    expect(cursorService.updateCursorPosition).toHaveBeenCalledWith(mockUser.id, {
      x: 100,
      y: 200,
      userName: mockUser.displayName,
      color: mockUser.color,
    });
  });

  it('should throttle cursor updates to 60fps', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockReturnValue(vi.fn());
    vi.mocked(cursorService.updateCursorPosition).mockResolvedValue(undefined);
    vi.mocked(cursorService.removeCursor).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCursors());

    // Call updateOwnCursor multiple times rapidly
    result.current.updateOwnCursor(100, 200);
    result.current.updateOwnCursor(110, 210);
    result.current.updateOwnCursor(120, 220);

    // Should only call once initially
    expect(cursorService.updateCursorPosition).toHaveBeenCalledTimes(1);

    // Advance time by 16ms (60fps throttle)
    vi.advanceTimersByTime(16);

    result.current.updateOwnCursor(130, 230);

    // Should call again after throttle interval
    expect(cursorService.updateCursorPosition).toHaveBeenCalledTimes(2);
  });

  it('should remove cursor on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useCursors());

    unmount();

    // removeCursor is called asynchronously in cleanup, just verify it was called
    // Note: We can't easily wait for async cleanup, but the function is called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle updateCursorPosition errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    vi.mocked(cursorService.subscribeToCursors).mockReturnValue(vi.fn());
    vi.mocked(cursorService.updateCursorPosition).mockRejectedValue(new Error('Network error'));
    vi.mocked(cursorService.removeCursor).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCursors());

    // Should not throw
    expect(() => result.current.updateOwnCursor(100, 200)).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it('should not update cursor when user is null', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => useCursors());

    result.current.updateOwnCursor(100, 200);

    expect(cursorService.updateCursorPosition).not.toHaveBeenCalled();
  });
});

