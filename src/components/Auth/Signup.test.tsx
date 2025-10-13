import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Signup } from './Signup';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    signup: vi.fn(),
    loginWithGoogle: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('Signup Component', () => {
  it('renders signup form', () => {
    render(<Signup />);
    expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    render(<Signup />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('renders login link', () => {
    render(<Signup />);
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });
});

