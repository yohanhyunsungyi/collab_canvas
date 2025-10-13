import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Canvas } from './Canvas';

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="konva-stage" {...props}>{children}</div>,
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Rect: () => <div data-testid="konva-rect" />,
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

  it('should render canvas boundary rectangle', () => {
    render(<Canvas />);
    expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
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

