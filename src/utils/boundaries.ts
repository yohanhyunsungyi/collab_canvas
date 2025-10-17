/**
 * Boundary constraint utilities for Konva canvas shapes
 * Provides centralized logic for constraining shapes within canvas boundaries
 * 
 * Canvas coordinate system: (0, 0) is at the center
 * X range: -CANVAS_WIDTH/2 to CANVAS_WIDTH/2
 * Y range: -CANVAS_HEIGHT/2 to CANVAS_HEIGHT/2
 */

export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;
export const CANVAS_MIN_X = -CANVAS_WIDTH / 2;
export const CANVAS_MAX_X = CANVAS_WIDTH / 2;
export const CANVAS_MIN_Y = -CANVAS_HEIGHT / 2;
export const CANVAS_MAX_Y = CANVAS_HEIGHT / 2;

/**
 * Constrain a position to stay within canvas boundaries
 * Used for simple point constraints (e.g., text placement)
 */
export function constrainPoint(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(CANVAS_MIN_X, Math.min(x, CANVAS_MAX_X)),
    y: Math.max(CANVAS_MIN_Y, Math.min(y, CANVAS_MAX_Y)),
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
  
  // Check if newBox exceeds canvas boundaries (centered coordinate system)
  const isOut = 
    newBox.x < CANVAS_MIN_X ||
    newBox.y < CANVAS_MIN_Y ||
    newBox.x + newBox.width > CANVAS_MAX_X ||
    newBox.y + newBox.height > CANVAS_MAX_Y;
  
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
    width: Math.max(5, Math.min(width, CANVAS_MAX_X - x)),
    height: Math.max(5, Math.min(height, CANVAS_MAX_Y - y)),
  };
}

/**
 * Constrain circle radius during resize
 * Ensures radius stays within canvas bounds from center position
 */
export function constrainCircleRadius(x: number, y: number, radius: number): number {
  // Ensure x and y are within canvas bounds first
  const safeX = Math.max(CANVAS_MIN_X, Math.min(x, CANVAS_MAX_X));
  const safeY = Math.max(CANVAS_MIN_Y, Math.min(y, CANVAS_MAX_Y));
  
  // Calculate maximum radius based on distance to nearest edge
  const maxRadiusX = Math.min(safeX - CANVAS_MIN_X, CANVAS_MAX_X - safeX);
  const maxRadiusY = Math.min(safeY - CANVAS_MIN_Y, CANVAS_MAX_Y - safeY);
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
    const constrainedX = Math.max(CANVAS_MIN_X, Math.min(x, CANVAS_MAX_X - width));
    const constrainedY = Math.max(CANVAS_MIN_Y, Math.min(y, CANVAS_MAX_Y - height));
    return {
      x: constrainedX,
      y: constrainedY,
      width: Math.min(width, CANVAS_MAX_X - constrainedX),
      height: Math.min(height, CANVAS_MAX_Y - constrainedY),
    };
  } else if (type === 'circle' && radius !== undefined) {
    // First constrain the radius to ensure it fits within canvas from the current position
    const maxRadiusFromX = Math.min(x - CANVAS_MIN_X, CANVAS_MAX_X - x);
    const maxRadiusFromY = Math.min(y - CANVAS_MIN_Y, CANVAS_MAX_Y - y);
    const constrainedRadius = Math.max(5, Math.min(radius, maxRadiusFromX, maxRadiusFromY));
    
    // Then constrain the position to keep the circle within bounds
    const constrainedX = Math.max(CANVAS_MIN_X + constrainedRadius, Math.min(x, CANVAS_MAX_X - constrainedRadius));
    const constrainedY = Math.max(CANVAS_MIN_Y + constrainedRadius, Math.min(y, CANVAS_MAX_Y - constrainedRadius));
    
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

