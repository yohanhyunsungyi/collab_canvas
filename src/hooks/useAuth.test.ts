import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import * as authService from '../services/auth.service';

// Mock auth service
vi.mock('../services/auth.service');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading true and no user', () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set user when auth state changes', async () => {
    const mockUser = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#FF6B6B',
      createdAt: Date.now(),
    };

    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle successful signup', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});
    
    const mockUser = {
      id: 'new-uid',
      email: 'new@example.com',
      displayName: 'New User',
      color: '#4ECDC4',
      createdAt: Date.now(),
    };

    vi.mocked(authService.signup).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signup({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      });
    });

    expect(authService.signup).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle signup error', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});
    vi.mocked(authService.signup).mockRejectedValue(new Error('Email already exists'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signup({
          email: 'existing@example.com',
          password: 'password123',
          displayName: 'Test User',
        });
      } catch (err) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Email already exists');
    });

    expect(result.current.user).toBeNull();
  });

  it('should handle successful login', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});

    const mockUser = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#45B7D1',
      createdAt: Date.now(),
    };

    vi.mocked(authService.login).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrong-password',
        });
      } catch (err) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  it('should handle successful Google login', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});

    const mockUser = {
      id: 'google-uid',
      email: 'google@example.com',
      displayName: 'Google User',
      color: '#FFA07A',
      createdAt: Date.now(),
    };

    vi.mocked(authService.loginWithGoogle).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loginWithGoogle();
    });

    expect(authService.loginWithGoogle).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle Google login error', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});
    vi.mocked(authService.loginWithGoogle).mockRejectedValue(new Error('Google login failed'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.loginWithGoogle();
      } catch (err) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Google login failed');
    });
  });

  it('should handle successful logout', async () => {
    const mockUser = {
      id: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#98D8C8',
      createdAt: Date.now(),
    };

    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should handle logout error', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});
    vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.logout();
      } catch (err) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Logout failed');
    });
  });

  it('should clear error when clearError is called', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});
    vi.mocked(authService.login).mockRejectedValue(new Error('Login failed'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrong',
        });
      } catch (err) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Login failed');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should unsubscribe from auth state changes on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should show loading state during operations', async () => {
    vi.mocked(authService.onAuthStateChanged).mockReturnValue(() => {});

    let resolveLogin: any;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    vi.mocked(authService.login).mockReturnValue(loginPromise as any);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Should be loading
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveLogin({
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        color: '#F7DC6F',
        createdAt: Date.now(),
      });
      await loginPromise;
    });

    // Should not be loading after completion
    expect(result.current.loading).toBe(false);
  });
});

