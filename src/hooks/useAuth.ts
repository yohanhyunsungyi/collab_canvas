import { useState, useEffect } from 'react';
import { User, SignupData, LoginData } from '../types/user.types';
import * as authService from '../services/auth.service';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for authentication state management
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (data: SignupData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signup(data);
      setUser(user);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.login(data);
      setUser(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.loginWithGoogle();
      setUser(user);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    user,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    clearError,
  };
};

