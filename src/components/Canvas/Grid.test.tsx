import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Grid } from './Grid';

// Mock Konva components
vi.mock('react-konva', () => ({
  Line: ({ points, stroke, strokeWidth }: any) => (
    <div 
      data-testid="konva-line" 
      data-points={points.join(',')}
      data-stroke={stroke}
      data-strokewidth={strokeWidth}
    />
  ),
}));

describe('Grid Component', () => {
  it('should render grid lines', () => {
    const { container } = render(<Grid />);
    const lines = container.querySelectorAll('[data-testid="konva-line"]');
    
    // With default gridSize of 50, and canvas of 5000x5000:
    // Vertical lines: 5000 / 50 + 1 = 101 lines
    // Horizontal lines: 5000 / 50 + 1 = 101 lines
    // Total: 202 lines
    expect(lines.length).toBe(202);
  });

  it('should render with custom gridSize', () => {
    const { container } = render(<Grid gridSize={100} />);
    const lines = container.querySelectorAll('[data-testid="konva-line"]');
    
    // With gridSize of 100:
    // Vertical lines: 5000 / 100 + 1 = 51 lines
    // Horizontal lines: 5000 / 100 + 1 = 51 lines
    // Total: 102 lines
    expect(lines.length).toBe(102);
  });

  it('should apply custom stroke color', () => {
    const { container } = render(<Grid strokeColor="#ff0000" />);
    const line = container.querySelector('[data-testid="konva-line"]');
    
    expect(line?.getAttribute('data-stroke')).toBe('#ff0000');
  });

  it('should apply custom stroke width', () => {
    const { container } = render(<Grid strokeWidth={2} />);
    const line = container.querySelector('[data-testid="konva-line"]');
    
    expect(line?.getAttribute('data-strokewidth')).toBe('2');
  });

  it('should render vertical lines correctly', () => {
    const { container } = render(<Grid gridSize={1000} />);
    const lines = container.querySelectorAll('[data-testid="konva-line"]');
    const firstLine = lines[0];
    
    // First vertical line should be at x=0
    const points = firstLine?.getAttribute('data-points')?.split(',');
    expect(points?.[0]).toBe('0'); // x1
    expect(points?.[1]).toBe('0'); // y1
    expect(points?.[2]).toBe('0'); // x2
    expect(points?.[3]).toBe('5000'); // y2 (canvas height)
  });

  it('should render horizontal lines correctly', () => {
    const { container } = render(<Grid gridSize={5000} />);
    const lines = container.querySelectorAll('[data-testid="konva-line"]');
    // With gridSize of 5000, there are 2 vertical lines (0 and 5000)
    // So the first horizontal line is at index 2
    const firstHorizontalLine = lines[2];
    
    // First horizontal line should be at y=0
    const points = firstHorizontalLine?.getAttribute('data-points')?.split(',');
    expect(points?.[0]).toBe('0'); // x1
    expect(points?.[1]).toBe('0'); // y1
    expect(points?.[2]).toBe('5000'); // x2 (canvas width)
    expect(points?.[3]).toBe('0'); // y2
  });
});


