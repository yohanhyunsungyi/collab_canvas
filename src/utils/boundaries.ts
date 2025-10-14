/**
 * Boundary constraint utilities for Konva canvas shapes
 * Provides centralized logic for constraining shapes within canvas boundaries
 */

export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

/**
 * Constrain a position to stay within canvas boundaries
 * Used for simple point constraints (e.g., text placement)
 */
export function constrainPoint(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, CANVAS_WIDTH)),
    y: Math.max(0, Math.min(y, CANVAS_HEIGHT)),
  };
}

/**
 * Transformer boundBoxFunc for constraining resize operations
 * Prevents shapes from being resized outside canvas boundaries
 * 
 * @param oldBox - Previous bounding box
 * @param newBox - Proposed new bounding box
 * @returns Constrained bounding box or oldBox if constraint fails
 */
export function getTransformerBoundBoxFunc(
  oldBox: { x: number; y: number; width: number; height: number; rotation: number },
  newBox: { x: number; y: number; width: number; height: number; rotation: number }
): { x: number; y: number; width: number; height: number; rotation: number } {
  // Minimum dimensions to prevent shapes from becoming too small
  const MIN_SIZE = 5;
  
  // Check minimum size
  if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
    return oldBox;
  }
  
  // Check if newBox exceeds canvas boundaries
  const isOut = 
    newBox.x < 0 ||
    newBox.y < 0 ||
    newBox.x + newBox.width > CANVAS_WIDTH ||
    newBox.y + newBox.height > CANVAS_HEIGHT;
  
  if (isOut) {
    return oldBox; // Reject transformation
  }
  
  return newBox; // Accept transformation
}

/**
 * Constrain rectangle dimensions during resize
 * Ensures width and height stay within canvas bounds
 */
export function constrainRectangleDimensions(
  x: number,
  y: number,
  width: number,
  height: number
): { width: number; height: number } {
  return {
    width: Math.max(5, Math.min(width, CANVAS_WIDTH - x)),
    height: Math.max(5, Math.min(height, CANVAS_HEIGHT - y)),
  };
}

/**
 * Constrain circle radius during resize
 * Ensures radius stays within canvas bounds from center position
 */
export function constrainCircleRadius(x: number, y: number, radius: number): number {
  // Ensure x and y are within canvas bounds first
  const safeX = Math.max(0, Math.min(x, CANVAS_WIDTH));
  const safeY = Math.max(0, Math.min(y, CANVAS_HEIGHT));
  
  // Calculate maximum radius based on distance to nearest edge
  const maxRadiusX = Math.min(safeX, CANVAS_WIDTH - safeX);
  const maxRadiusY = Math.min(safeY, CANVAS_HEIGHT - safeY);
  const maxRadius = Math.min(maxRadiusX, maxRadiusY);
  
  // Constrain radius between 5 and maxRadius
  return Math.max(5, Math.min(radius, Math.max(5, maxRadius)));
}

/**
 * Constrain shape creation coordinates
 * Used during shape preview and final creation to ensure shapes start within bounds
 */
export function constrainShapeCreation(
  type: 'rectangle' | 'circle' | 'text',
  x: number,
  y: number,
  width?: number,
  height?: number,
  radius?: number
): { x: number; y: number; width?: number; height?: number; radius?: number } {
  if (type === 'rectangle' && width !== undefined && height !== undefined) {
    const constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - height));
    return {
      x: constrainedX,
      y: constrainedY,
      width: Math.min(width, CANVAS_WIDTH - constrainedX),
      height: Math.min(height, CANVAS_HEIGHT - constrainedY),
    };
  } else if (type === 'circle' && radius !== undefined) {
    // First constrain the radius to ensure it fits within canvas from the current position
    const maxRadiusFromX = Math.min(x, CANVAS_WIDTH - x);
    const maxRadiusFromY = Math.min(y, CANVAS_HEIGHT - y);
    const constrainedRadius = Math.max(5, Math.min(radius, maxRadiusFromX, maxRadiusFromY));
    
    // Then constrain the position to keep the circle within bounds
    const constrainedX = Math.max(constrainedRadius, Math.min(x, CANVAS_WIDTH - constrainedRadius));
    const constrainedY = Math.max(constrainedRadius, Math.min(y, CANVAS_HEIGHT - constrainedRadius));
    
    return {
      x: constrainedX,
      y: constrainedY,
      radius: constrainedRadius,
    };
  } else {
    // Text or fallback
    return constrainPoint(x, y);
  }
}

