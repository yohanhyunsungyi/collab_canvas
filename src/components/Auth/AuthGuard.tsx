import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard component to protect routes that require authentication
 * Shows loading state while checking auth
 * Shows fallback (login page) if not authenticated
 * Renders children if authenticated
 */
export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

