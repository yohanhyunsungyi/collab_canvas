import { Rect } from 'react-konva';
import type { CanvasShape } from '../../types/canvas.types';

interface SelectionBoxProps {
  shapes: CanvasShape[];
  selectedShapeIds: string[];
}

/**
 * SelectionBox component
 * Renders a bounding box around multiple selected shapes
 */
export const SelectionBox = ({ shapes, selectedShapeIds }: SelectionBoxProps) => {
  // Don't render if no shapes or only one shape is selected
  if (selectedShapeIds.length < 2) {
    return null;
  }

  // Get all selected shapes
  const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
  
  if (selectedShapes.length === 0) {
    return null;
  }

  // Calculate bounding box that encompasses all selected shapes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedShapes.forEach(shape => {
    let shapeMinX: number, shapeMinY: number, shapeMaxX: number, shapeMaxY: number;

    if (shape.type === 'rectangle') {
      shapeMinX = shape.x;
      shapeMinY = shape.y;
      shapeMaxX = shape.x + shape.width;
      shapeMaxY = shape.y + shape.height;
    } else if (shape.type === 'circle') {
      shapeMinX = shape.x - shape.radius;
      shapeMinY = shape.y - shape.radius;
      shapeMaxX = shape.x + shape.radius;
      shapeMaxY = shape.y + shape.radius;
    } else if (shape.type === 'text') {
      // For text, use approximate bounding box based on font size
      // Text position is at the top-left
      const estimatedWidth = shape.width || shape.text.length * shape.fontSize * 0.6;
      const estimatedHeight = shape.height || shape.fontSize * 1.2;
      shapeMinX = shape.x;
      shapeMinY = shape.y;
      shapeMaxX = shape.x + estimatedWidth;
      shapeMaxY = shape.y + estimatedHeight;
    } else {
      return; // Skip unknown shape types
    }

    minX = Math.min(minX, shapeMinX);
    minY = Math.min(minY, shapeMinY);
    maxX = Math.max(maxX, shapeMaxX);
    maxY = Math.max(maxY, shapeMaxY);
  });

  // Add padding around the selection box
  const padding = 5;
  const boxX = minX - padding;
  const boxY = minY - padding;
  const boxWidth = maxX - minX + (padding * 2);
  const boxHeight = maxY - minY + (padding * 2);

  return (
    <Rect
      x={boxX}
      y={boxY}
      width={boxWidth}
      height={boxHeight}
      stroke="#00bcd4"
      strokeWidth={2}
      dash={[8, 4]}
      listening={false}
      opacity={0.8}
    />
  );
};

