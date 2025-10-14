import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Canvas } from './Canvas';

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="konva-stage" {...props}>{children}</div>,
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Transformer: () => <div data-testid="konva-transformer" />,
}));

// Mock canvas service
vi.mock('../../services/canvas.service', () => ({
  fetchAllShapes: vi.fn().mockResolvedValue([]),
  subscribeToShapes: vi.fn(() => vi.fn()), // Return unsubscribe function
  createShape: vi.fn().mockResolvedValue('test-id'),
  updateShape: vi.fn().mockResolvedValue(undefined),
  deleteShape: vi.fn().mockResolvedValue(undefined),
}));

describe('Canvas Component', () => {
  it('should render canvas header', () => {
    render(<Canvas />);
    expect(screen.getByRole('heading', { name: 'CollabCanvas' })).toBeInTheDocument();
  });

  it('should display canvas info', () => {
    render(<Canvas />);
    expect(screen.getByText(/Canvas: 5000x5000px/i)).toBeInTheDocument();
    expect(screen.getByText(/Zoom:/i)).toBeInTheDocument();
  });

  it('should render Konva Stage', () => {
    render(<Canvas />);
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
  });

  it('should render Konva Layer', () => {
    render(<Canvas />);
    expect(screen.getByTestId('konva-layer')).toBeInTheDocument();
  });

  it('should render canvas rectangles (gray overlays + boundary)', () => {
    render(<Canvas />);
    const rects = screen.getAllByTestId('konva-rect');
    // Should have 5 rectangles: 4 gray overlays + 1 boundary rectangle
    expect(rects).toHaveLength(5);
  });

  it('should render toolbar with tools', () => {
    render(<Canvas />);
    expect(screen.getByText(/Select/i)).toBeInTheDocument();
    expect(screen.getByText(/Rectangle/i)).toBeInTheDocument();
    expect(screen.getByText(/Circle/i)).toBeInTheDocument();
    expect(screen.getByText(/Text/i)).toBeInTheDocument();
  });

  it('should render color picker', () => {
    render(<Canvas />);
    expect(screen.getByText(/Color/i)).toBeInTheDocument();
  });
});

