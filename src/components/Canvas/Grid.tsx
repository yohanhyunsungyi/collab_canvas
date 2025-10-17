import { Line } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_MIN_X, CANVAS_MIN_Y, CANVAS_MAX_X, CANVAS_MAX_Y } from '../../utils/boundaries';
import type { ReactElement } from 'react';

interface GridProps {
  gridSize?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Grid component that renders a dynamic grid on the canvas
 * The grid is part of the Konva Layer, so it automatically scales and moves with the stage
 * Grid is centered at (0, 0) and extends in all four directions
 */
export const Grid = ({ 
  gridSize = 50, 
  strokeColor = '#e0e0e0', 
  strokeWidth = 1 
}: GridProps) => {
  const lines: ReactElement[] = [];

  // Vertical lines (from left to right)
  for (let i = 0; i <= CANVAS_WIDTH / gridSize; i++) {
    const x = CANVAS_MIN_X + i * gridSize;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, CANVAS_MIN_Y, x, CANVAS_MAX_Y]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  // Horizontal lines (from top to bottom)
  for (let j = 0; j <= CANVAS_HEIGHT / gridSize; j++) {
    const y = CANVAS_MIN_Y + j * gridSize;
    lines.push(
      <Line
        key={`h-${j}`}
        points={[CANVAS_MIN_X, y, CANVAS_MAX_X, y]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  return <>{lines}</>;
};

