import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Login } from './Login';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('Login Component', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByText('Collab Canvas by Yohan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    render(<Login />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('renders signup link', () => {
    render(<Login />);
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});

