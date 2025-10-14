import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresenceSidebar } from './PresenceSidebar';
import * as usePresenceModule from '../../hooks/usePresence';

vi.mock('../../hooks/usePresence');

describe('PresenceSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title', () => {
    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: [],
      onlineUsers: [],
      loading: false,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('Online Users')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: [],
      onlineUsers: [],
      loading: true,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument(); // Count shows ...
  });

  it('should display empty state when no users online', () => {
    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: [],
      onlineUsers: [],
      loading: false,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('No other users online')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Count shows 0
  });

  it('should display online users count', () => {
    const mockOnlineUsers = [
      { userId: 'user1', userName: 'Alice', color: '#FF6B6B', online: true, lastSeen: Date.now() },
      { userId: 'user2', userName: 'Bob', color: '#4ECDC4', online: true, lastSeen: Date.now() },
    ];

    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: mockOnlineUsers,
      onlineUsers: mockOnlineUsers,
      loading: false,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render list of online users', () => {
    const mockOnlineUsers = [
      { userId: 'user1', userName: 'Alice', color: '#FF6B6B', online: true, lastSeen: Date.now() },
      { userId: 'user2', userName: 'Bob', color: '#4ECDC4', online: true, lastSeen: Date.now() },
      { userId: 'user3', userName: 'Charlie', color: '#95E1D3', online: true, lastSeen: Date.now() },
    ];

    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: mockOnlineUsers,
      onlineUsers: mockOnlineUsers,
      loading: false,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getAllByText('Active now')).toHaveLength(3);
  });

  it('should render user avatars with correct initials', () => {
    const mockOnlineUsers = [
      { userId: 'user1', userName: 'Alice', color: '#FF6B6B', online: true, lastSeen: Date.now() },
      { userId: 'user2', userName: 'Bob Smith', color: '#4ECDC4', online: true, lastSeen: Date.now() },
    ];

    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: mockOnlineUsers,
      onlineUsers: mockOnlineUsers,
      loading: false,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('A')).toBeInTheDocument(); // Alice's initial
    expect(screen.getByText('B')).toBeInTheDocument(); // Bob's initial
  });

  it('should handle single user online', () => {
    const mockOnlineUsers = [
      { userId: 'user1', userName: 'Alice', color: '#FF6B6B', online: true, lastSeen: Date.now() },
    ];

    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: mockOnlineUsers,
      onlineUsers: mockOnlineUsers,
      loading: false,
    });

    render(<PresenceSidebar />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Active now')).toBeInTheDocument();
  });

  it('should update when users join', () => {
    const initialUsers = [
      { userId: 'user1', userName: 'Alice', color: '#FF6B6B', online: true, lastSeen: Date.now() },
    ];

    const updatedUsers = [
      ...initialUsers,
      { userId: 'user2', userName: 'Bob', color: '#4ECDC4', online: true, lastSeen: Date.now() },
    ];

    const { rerender } = render(<PresenceSidebar />);

    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: initialUsers,
      onlineUsers: initialUsers,
      loading: false,
    });

    rerender(<PresenceSidebar />);
    expect(screen.getByText('1')).toBeInTheDocument();

    vi.mocked(usePresenceModule.usePresence).mockReturnValue({
      users: updatedUsers,
      onlineUsers: updatedUsers,
      loading: false,
    });

    rerender(<PresenceSidebar />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

