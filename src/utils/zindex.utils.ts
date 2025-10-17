import type { CanvasShape } from '../types/canvas.types';

/**
 * Renormalize all shape zIndexes to be consecutive starting from 0
 * Returns a map of shapeId -> newZIndex for shapes that changed
 */
export function renormalizeZIndexes(
  allShapes: CanvasShape[]
): Map<string, number> {
  // Sort shapes by current zIndex (preserve visual order)
  const sorted = [...allShapes].sort((a, b) => a.zIndex - b.zIndex);
  
  const updates = new Map<string, number>();
  sorted.forEach((shape, index) => {
    if (shape.zIndex !== index) {
      updates.set(shape.id, index);
    }
  });
  
  return updates;
}

/**
 * Calculate zIndex updates to bring shape to front (all the way to top)
 * Uses order-based approach with renormalization
 */
export function bringToFront(
  shapeId: string,
  allShapes: CanvasShape[]
): Map<string, number> {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape) return new Map();

  // Sort all shapes by current zIndex to get current order
  const sorted = [...allShapes].sort((a, b) => a.zIndex - b.zIndex);
  
  // Find current position
  const currentIndex = sorted.findIndex(s => s.id === shapeId);
  if (currentIndex === sorted.length - 1) {
    // Already at front
    return new Map();
  }

  // Move to end of array (will become highest zIndex)
  const [removed] = sorted.splice(currentIndex, 1);
  sorted.push(removed);

  // Renormalize: assign 0, 1, 2, 3... based on new order
  const updates = new Map<string, number>();
  sorted.forEach((s, index) => {
    if (s.zIndex !== index) {
      updates.set(s.id, index);
    }
  });

  return updates;
}

/**
 * Calculate zIndex updates to send shape to back (all the way to bottom)
 * Uses order-based approach with renormalization
 */
export function sendToBack(
  shapeId: string,
  allShapes: CanvasShape[]
): Map<string, number> {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape) return new Map();

  // Sort all shapes by current zIndex to get current order
  const sorted = [...allShapes].sort((a, b) => a.zIndex - b.zIndex);
  
  // Find current position
  const currentIndex = sorted.findIndex(s => s.id === shapeId);
  if (currentIndex === 0) {
    // Already at back
    return new Map();
  }

  // Move to start of array (will become lowest zIndex)
  const [removed] = sorted.splice(currentIndex, 1);
  sorted.unshift(removed);

  // Renormalize: assign 0, 1, 2, 3... based on new order
  const updates = new Map<string, number>();
  sorted.forEach((s, index) => {
    if (s.zIndex !== index) {
      updates.set(s.id, index);
    }
  });

  return updates;
}

/**
 * Calculate zIndex updates to bring shape forward (one layer up)
 * Uses order-based approach with renormalization
 */
export function bringForward(
  shapeId: string,
  allShapes: CanvasShape[]
): Map<string, number> {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape) return new Map();

  // Sort all shapes by current zIndex to get current order
  const sorted = [...allShapes].sort((a, b) => a.zIndex - b.zIndex);
  
  // Find current position
  const currentIndex = sorted.findIndex(s => s.id === shapeId);
  if (currentIndex === sorted.length - 1) {
    // Already at front
    return new Map();
  }

  // Swap with next shape (move up one position)
  [sorted[currentIndex], sorted[currentIndex + 1]] = [sorted[currentIndex + 1], sorted[currentIndex]];

  // Renormalize: assign 0, 1, 2, 3... based on new order
  const updates = new Map<string, number>();
  sorted.forEach((s, index) => {
    if (s.zIndex !== index) {
      updates.set(s.id, index);
    }
  });

  return updates;
}

/**
 * Calculate zIndex updates to send shape backward (one layer down)
 * Uses order-based approach with renormalization
 */
export function sendBackward(
  shapeId: string,
  allShapes: CanvasShape[]
): Map<string, number> {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape) return new Map();

  // Sort all shapes by current zIndex to get current order
  const sorted = [...allShapes].sort((a, b) => a.zIndex - b.zIndex);
  
  // Find current position
  const currentIndex = sorted.findIndex(s => s.id === shapeId);
  if (currentIndex === 0) {
    // Already at back
    return new Map();
  }

  // Swap with previous shape (move down one position)
  [sorted[currentIndex], sorted[currentIndex - 1]] = [sorted[currentIndex - 1], sorted[currentIndex]];

  // Renormalize: assign 0, 1, 2, 3... based on new order
  const updates = new Map<string, number>();
  sorted.forEach((s, index) => {
    if (s.zIndex !== index) {
      updates.set(s.id, index);
    }
  });

  return updates;
}

/**
 * Get the zIndex range for all shapes
 */
export function getZIndexRange(shapes: CanvasShape[]): { min: number; max: number } {
  if (shapes.length === 0) {
    return { min: 0, max: 0 };
  }

  const zIndexes = shapes.map(s => s.zIndex);
  return {
    min: Math.min(...zIndexes),
    max: Math.max(...zIndexes),
  };
}

/**
 * Check if a shape is at the front (highest zIndex)
 */
export function isAtFront(shapeId: string, allShapes: CanvasShape[]): boolean {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape) return false;

  const maxZIndex = Math.max(...allShapes.map(s => s.zIndex));
  return shape.zIndex === maxZIndex;
}

/**
 * Check if a shape is at the back (lowest zIndex)
 */
export function isAtBack(shapeId: string, allShapes: CanvasShape[]): boolean {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape) return false;

  const minZIndex = Math.min(...allShapes.map(s => s.zIndex));
  return shape.zIndex === minZIndex;
}

