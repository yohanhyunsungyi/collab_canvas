import { Rect } from 'react-konva';
import type { CanvasShape } from '../../types/canvas.types';

interface SelectionBoxProps {
  shapes: CanvasShape[];
  selectedShapeIds: string[];
}

/**
 * Helper function to rotate a point around an origin
 */
const rotatePoint = (
  px: number,
  py: number,
  cx: number,
  cy: number,
  angleDegrees: number
): { x: number; y: number } => {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  // Translate point to origin
  const dx = px - cx;
  const dy = py - cy;
  
  // Rotate
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;
  
  // Translate back
  return {
    x: rotatedX + cx,
    y: rotatedY + cy,
  };
};

/**
 * Get the bounding box of a shape, accounting for rotation
 */
const getShapeBoundingBox = (shape: CanvasShape): { minX: number; minY: number; maxX: number; maxY: number } => {
  const rotation = shape.rotation || 0;
  
  if (shape.type === 'circle') {
    // For circles, rotation doesn't matter for bounding box
    return {
      minX: shape.x - shape.radius,
      minY: shape.y - shape.radius,
      maxX: shape.x + shape.radius,
      maxY: shape.y + shape.radius,
    };
  }
  
  // For rectangles, text, and images, we need to handle rotation
  let width: number, height: number;
  let centerX: number, centerY: number;
  
  if (shape.type === 'rectangle') {
    width = shape.width;
    height = shape.height;
    // Rectangle's x,y is top-left, so center is at x + width/2, y + height/2
    centerX = shape.x + width / 2;
    centerY = shape.y + height / 2;
  } else if (shape.type === 'text') {
    const estimatedWidth = shape.width || shape.text.length * shape.fontSize * 0.6;
    const estimatedHeight = shape.height || shape.fontSize * 1.2;
    width = estimatedWidth;
    height = estimatedHeight;
    centerX = shape.x + width / 2;
    centerY = shape.y + height / 2;
  } else if (shape.type === 'image') {
    width = shape.width;
    height = shape.height;
    centerX = shape.x + width / 2;
    centerY = shape.y + height / 2;
  } else {
    // Fallback for unknown types
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x,
      maxY: shape.y,
    };
  }
  
  // If no rotation, return simple bounding box
  if (rotation === 0) {
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x + width,
      maxY: shape.y + height,
    };
  }
  
  // Calculate the four corners of the unrotated shape
  const corners = [
    { x: shape.x, y: shape.y }, // top-left
    { x: shape.x + width, y: shape.y }, // top-right
    { x: shape.x + width, y: shape.y + height }, // bottom-right
    { x: shape.x, y: shape.y + height }, // bottom-left
  ];
  
  // Rotate each corner around the shape's center
  const rotatedCorners = corners.map(corner => 
    rotatePoint(corner.x, corner.y, centerX, centerY, rotation)
  );
  
  // Find the bounding box of the rotated corners
  const xs = rotatedCorners.map(c => c.x);
  const ys = rotatedCorners.map(c => c.y);
  
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
};

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

  // Calculate bounding box that encompasses all selected shapes (accounting for rotation)
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedShapes.forEach(shape => {
    const bbox = getShapeBoundingBox(shape);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
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

