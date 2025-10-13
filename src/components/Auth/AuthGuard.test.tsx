import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from './AuthGuard';

const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthGuard Component', () => {
  it('shows loading state when loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(
      <AuthGuard fallback={<div>Login</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows fallback when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <AuthGuard fallback={<div>Login Page</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows children when authenticated', () => {
    mockUseAuth.mockReturnValue({ 
      user: { id: '1', email: 'test@test.com', displayName: 'Test' }, 
      loading: false 
    });
    render(
      <AuthGuard fallback={<div>Login</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});

