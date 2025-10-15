import { Line } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/boundaries';
import type { ReactElement } from 'react';

interface GridProps {
  gridSize?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Grid component that renders a dynamic grid on the canvas
 * The grid is part of the Konva Layer, so it automatically scales and moves with the stage
 */
export const Grid = ({ 
  gridSize = 50, 
  strokeColor = '#e0e0e0', 
  strokeWidth = 1 
}: GridProps) => {
  const lines: ReactElement[] = [];

  // Vertical lines
  for (let i = 0; i <= CANVAS_WIDTH / gridSize; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * gridSize, 0, i * gridSize, CANVAS_HEIGHT]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  // Horizontal lines
  for (let j = 0; j <= CANVAS_HEIGHT / gridSize; j++) {
    lines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * gridSize, CANVAS_WIDTH, j * gridSize]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  return <>{lines}</>;
};

