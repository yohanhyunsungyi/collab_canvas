import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIPanel } from './AIPanel';
import type { CanvasShape } from '../../types/canvas.types';

// Mock the useAI hook
const mockSendCommand = vi.fn();
const mockClearError = vi.fn();
const mockClearHistory = vi.fn();
const mockRerunCommand = vi.fn();
const mockDeleteCommand = vi.fn();

vi.mock('../../hooks/useAI', () => ({
  useAI: () => ({
    loading: false,
    error: null,
    commandHistory: [],
    isAvailable: true,
    rateLimitStatus: {
      remaining: 10,
      resetIn: 0,
    },
    sendCommand: mockSendCommand,
    clearError: mockClearError,
    clearHistory: mockClearHistory,
    rerunCommand: mockRerunCommand,
    deleteCommand: mockDeleteCommand,
  }),
}));

const mockShapes: CanvasShape[] = [];

describe('AIPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI input field', () => {
    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    expect(screen.getByRole('textbox', { name: /AI command input/i })).toBeInTheDocument();
  });

  it('renders Send button', () => {
    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
  });

  it('renders expand/collapse toggle button', () => {
    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    expect(screen.getByLabelText(/Expand AI history/i)).toBeInTheDocument();
  });

  it('submits command when Send button is clicked', async () => {
    const user = userEvent.setup();
    mockSendCommand.mockResolvedValue({ success: true, message: 'Command executed' });
    
    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    const input = screen.getByRole('textbox', { name: /AI command input/i });
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    await user.type(input, 'Create a circle');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('Create a circle');
    });
  });

  it('clears input after successful command submission', async () => {
    const user = userEvent.setup();
    mockSendCommand.mockResolvedValue({ success: true, message: 'Command executed' });
    
    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    const input = screen.getByRole('textbox', { name: /AI command input/i }) as HTMLInputElement;
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    await user.type(input, 'Create a circle');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('does not submit empty command', async () => {
    const user = userEvent.setup();
    
    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    const sendButton = screen.getByRole('button', { name: /Send/i });
    await user.click(sendButton);
    
    expect(mockSendCommand).not.toHaveBeenCalled();
  });

  it('exposes focusInput method via ref', () => {
    const ref = { current: null as any };
    
    render(
      <AIPanel
        ref={ref}
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.focusInput).toBe('function');
  });
});

describe('AIPanel - Command History', () => {
  it('displays command history entries', () => {
    vi.mock('../../hooks/useAI', () => ({
      useAI: () => ({
        loading: false,
        error: null,
        commandHistory: [
          {
            id: 'cmd-1',
            prompt: 'Create a circle',
            timestamp: Date.now(),
            success: true,
            message: 'Created circle',
          },
        ],
        isAvailable: true,
        rateLimitStatus: { remaining: 10, resetIn: 0 },
        sendCommand: mockSendCommand,
        clearError: mockClearError,
        clearHistory: mockClearHistory,
        rerunCommand: mockRerunCommand,
        deleteCommand: mockDeleteCommand,
      }),
    }));

    render(
      <AIPanel
        userId="test-user"
        shapes={mockShapes}
        selectedShapeIds={[]}
      />
    );
    
    expect(screen.getByText('Create a circle')).toBeInTheDocument();
  });
});

