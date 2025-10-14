import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiplayerCursors } from './MultiplayerCursors';
import type { CursorPosition } from '../../types/presence.types';
import type { Viewport } from '../../types/canvas.types';

describe('MultiplayerCursors Component', () => {
  const mockViewport: Viewport = {
    x: 0,
    y: 0,
    scale: 1,
  };

  it('should render nothing when there are no cursors', () => {
    const { container } = render(
      <MultiplayerCursors cursors={{}} viewport={mockViewport} />
    );

    const cursorsContainer = container.querySelector('.multiplayer-cursors');
    expect(cursorsContainer).toBeInTheDocument();
    expect(cursorsContainer?.children.length).toBe(0);
  });

  it('should render cursor for each user', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
      user2: {
        userId: 'user2',
        x: 300,
        y: 400,
        userName: 'Bob',
        color: '#A2D5AB',
        lastUpdated: Date.now(),
      },
    };

    render(<MultiplayerCursors cursors={mockCursors} viewport={mockViewport} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should display user names correctly', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Test User 123',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
    };

    render(<MultiplayerCursors cursors={mockCursors} viewport={mockViewport} />);

    expect(screen.getByText('Test User 123')).toBeInTheDocument();
  });

  it('should apply correct positioning with viewport transformation', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
    };

    const viewport: Viewport = {
      x: 50,
      y: 100,
      scale: 2,
    };

    const { container } = render(
      <MultiplayerCursors cursors={mockCursors} viewport={viewport} />
    );

    const cursorElement = container.querySelector('.cursor') as HTMLElement;
    expect(cursorElement).toBeInTheDocument();

    // Calculate expected position: x * scale + viewport.x
    const expectedLeft = 100 * 2 + 50; // 250px
    const expectedTop = 200 * 2 + 100; // 500px

    expect(cursorElement.style.left).toBe(`${expectedLeft}px`);
    expect(cursorElement.style.top).toBe(`${expectedTop}px`);
  });

  it('should apply viewport scale transformation', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
    };

    const viewport: Viewport = {
      x: 0,
      y: 0,
      scale: 0.5,
    };

    const { container } = render(
      <MultiplayerCursors cursors={mockCursors} viewport={viewport} />
    );

    const cursorElement = container.querySelector('.cursor') as HTMLElement;

    // Expected position: x * scale + viewport.x
    const expectedLeft = 100 * 0.5 + 0; // 50px
    const expectedTop = 200 * 0.5 + 0; // 100px

    expect(cursorElement.style.left).toBe(`${expectedLeft}px`);
    expect(cursorElement.style.top).toBe(`${expectedTop}px`);
  });

  it('should apply correct colors to cursor labels', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#FF5733',
        lastUpdated: Date.now(),
      },
    };

    const { container } = render(
      <MultiplayerCursors cursors={mockCursors} viewport={mockViewport} />
    );

    const cursorLabel = container.querySelector('.cursor-label') as HTMLElement;
    expect(cursorLabel).toBeInTheDocument();
    expect(cursorLabel.style.backgroundColor).toBe('rgb(255, 87, 51)'); // #FF5733 in RGB
  });

  it('should render multiple cursors with different colors', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
      user2: {
        userId: 'user2',
        x: 300,
        y: 400,
        userName: 'Bob',
        color: '#A2D5AB',
        lastUpdated: Date.now(),
      },
      user3: {
        userId: 'user3',
        x: 500,
        y: 600,
        userName: 'Charlie',
        color: '#FFA07A',
        lastUpdated: Date.now(),
      },
    };

    const { container } = render(
      <MultiplayerCursors cursors={mockCursors} viewport={mockViewport} />
    );

    const cursorLabels = container.querySelectorAll('.cursor-label');
    expect(cursorLabels.length).toBe(3);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should handle negative viewport positions', () => {
    const mockCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
    };

    const viewport: Viewport = {
      x: -50,
      y: -100,
      scale: 1,
    };

    const { container } = render(
      <MultiplayerCursors cursors={mockCursors} viewport={viewport} />
    );

    const cursorElement = container.querySelector('.cursor') as HTMLElement;

    const expectedLeft = 100 * 1 + (-50); // 50px
    const expectedTop = 200 * 1 + (-100); // 100px

    expect(cursorElement.style.left).toBe(`${expectedLeft}px`);
    expect(cursorElement.style.top).toBe(`${expectedTop}px`);
  });

  it('should update when cursors change', () => {
    const initialCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
    };

    const { rerender } = render(
      <MultiplayerCursors cursors={initialCursors} viewport={mockViewport} />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();

    const updatedCursors: Record<string, CursorPosition> = {
      user1: {
        userId: 'user1',
        x: 100,
        y: 200,
        userName: 'Alice',
        color: '#45B7D1',
        lastUpdated: Date.now(),
      },
      user2: {
        userId: 'user2',
        x: 300,
        y: 400,
        userName: 'Bob',
        color: '#A2D5AB',
        lastUpdated: Date.now(),
      },
    };

    rerender(<MultiplayerCursors cursors={updatedCursors} viewport={mockViewport} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

