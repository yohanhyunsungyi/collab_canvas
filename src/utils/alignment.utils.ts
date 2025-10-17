import type { CanvasShape, RectangleShape, CircleShape, TextShape, ImageShape } from '../types/canvas.types';

/**
 * Get the bounding box of a shape
 * Returns { left, right, top, bottom, centerX, centerY, width, height }
 */
export function getShapeBounds(shape: CanvasShape): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  if (shape.type === 'rectangle') {
    const rect = shape as RectangleShape;
    return {
      left: rect.x,
      right: rect.x + rect.width,
      top: rect.y,
      bottom: rect.y + rect.height,
      centerX: rect.x + rect.width / 2,
      centerY: rect.y + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  } else if (shape.type === 'circle') {
    const circle = shape as CircleShape;
    return {
      left: circle.x - circle.radius,
      right: circle.x + circle.radius,
      top: circle.y - circle.radius,
      bottom: circle.y + circle.radius,
      centerX: circle.x,
      centerY: circle.y,
      width: circle.radius * 2,
      height: circle.radius * 2,
    };
  } else if (shape.type === 'text') {
    const text = shape as TextShape;
    // Approximate text dimensions (better than nothing)
    const width = text.width ?? text.text.length * text.fontSize * 0.6;
    const height = text.height ?? text.fontSize * 1.2;
    return {
      left: text.x,
      right: text.x + width,
      top: text.y,
      bottom: text.y + height,
      centerX: text.x + width / 2,
      centerY: text.y + height / 2,
      width,
      height,
    };
  } else {
    // Image shape
    const img = shape as ImageShape;
    return {
      left: img.x,
      right: img.x + img.width,
      top: img.y,
      bottom: img.y + img.height,
      centerX: img.x + img.width / 2,
      centerY: img.y + img.height / 2,
      width: img.width,
      height: img.height,
    };
  }
}

/**
 * Get the bounding box of multiple shapes
 */
export function getGroupBounds(shapes: CanvasShape[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  if (shapes.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0, width: 0, height: 0 };
  }

  const bounds = shapes.map(getShapeBounds);
  const left = Math.min(...bounds.map(b => b.left));
  const right = Math.max(...bounds.map(b => b.right));
  const top = Math.min(...bounds.map(b => b.top));
  const bottom = Math.max(...bounds.map(b => b.bottom));
  
  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Calculate new position to align shape left to a reference X
 */
export function alignLeft(
  shape: CanvasShape,
  referenceX: number
): { x: number } {
  const bounds = getShapeBounds(shape);
  const deltaX = referenceX - bounds.left;
  return { x: shape.x + deltaX };
}

/**
 * Calculate new position to align shape right to a reference X
 */
export function alignRight(
  shape: CanvasShape,
  referenceX: number
): { x: number } {
  const bounds = getShapeBounds(shape);
  const deltaX = referenceX - bounds.right;
  return { x: shape.x + deltaX };
}

/**
 * Calculate new position to align shape top to a reference Y
 */
export function alignTop(
  shape: CanvasShape,
  referenceY: number
): { y: number } {
  const bounds = getShapeBounds(shape);
  const deltaY = referenceY - bounds.top;
  return { y: shape.y + deltaY };
}

/**
 * Calculate new position to align shape bottom to a reference Y
 */
export function alignBottom(
  shape: CanvasShape,
  referenceY: number
): { y: number } {
  const bounds = getShapeBounds(shape);
  const deltaY = referenceY - bounds.bottom;
  return { y: shape.y + deltaY };
}

/**
 * Calculate new position to align shape center horizontally to a reference X
 */
export function alignCenterHorizontal(
  shape: CanvasShape,
  referenceX: number
): { x: number } {
  const bounds = getShapeBounds(shape);
  const deltaX = referenceX - bounds.centerX;
  return { x: shape.x + deltaX };
}

/**
 * Calculate new position to align shape middle vertically to a reference Y
 */
export function alignMiddleVertical(
  shape: CanvasShape,
  referenceY: number
): { y: number } {
  const bounds = getShapeBounds(shape);
  const deltaY = referenceY - bounds.centerY;
  return { y: shape.y + deltaY };
}

/**
 * Calculate positions to distribute shapes horizontally with even spacing
 * Keeps the leftmost and rightmost shapes in place
 */
export function distributeHorizontally(
  shapes: CanvasShape[]
): Map<string, { x: number }> {
  if (shapes.length < 3) {
    return new Map(); // Need at least 3 shapes to distribute
  }

  // Sort shapes by their center X position
  const sortedShapes = [...shapes].sort((a, b) => {
    const boundsA = getShapeBounds(a);
    const boundsB = getShapeBounds(b);
    return boundsA.centerX - boundsB.centerX;
  });

  const updates = new Map<string, { x: number }>();
  
  // Get leftmost and rightmost centers
  const leftmost = getShapeBounds(sortedShapes[0]);
  const rightmost = getShapeBounds(sortedShapes[sortedShapes.length - 1]);
  
  // Calculate even spacing between centers
  const totalDistance = rightmost.centerX - leftmost.centerX;
  const spacing = totalDistance / (sortedShapes.length - 1);
  
  // Update middle shapes
  for (let i = 1; i < sortedShapes.length - 1; i++) {
    const shape = sortedShapes[i];
    const bounds = getShapeBounds(shape);
    const targetCenterX = leftmost.centerX + (spacing * i);
    const deltaX = targetCenterX - bounds.centerX;
    updates.set(shape.id, { x: shape.x + deltaX });
  }
  
  return updates;
}

/**
 * Calculate positions to distribute shapes vertically with even spacing
 * Keeps the topmost and bottommost shapes in place
 */
export function distributeVertically(
  shapes: CanvasShape[]
): Map<string, { x: number; y: number }> {
  if (shapes.length < 3) {
    return new Map(); // Need at least 3 shapes to distribute
  }

  // Sort shapes by their center Y position
  const sortedShapes = [...shapes].sort((a, b) => {
    const boundsA = getShapeBounds(a);
    const boundsB = getShapeBounds(b);
    return boundsA.centerY - boundsB.centerY;
  });

  const updates = new Map<string, { x: number; y: number }>();
  
  // Get topmost and bottommost centers
  const topmost = getShapeBounds(sortedShapes[0]);
  const bottommost = getShapeBounds(sortedShapes[sortedShapes.length - 1]);
  
  // Calculate even spacing between centers
  const totalDistance = bottommost.centerY - topmost.centerY;
  const spacing = totalDistance / (sortedShapes.length - 1);
  
  // Update middle shapes
  for (let i = 1; i < sortedShapes.length - 1; i++) {
    const shape = sortedShapes[i];
    const bounds = getShapeBounds(shape);
    const targetCenterY = topmost.centerY + (spacing * i);
    const deltaY = targetCenterY - bounds.centerY;
    updates.set(shape.id, { x: shape.x, y: shape.y + deltaY });
  }
  
  return updates;
}

/**
 * Align shapes to their group's left edge
 */
export function alignShapesLeft(shapes: CanvasShape[]): Map<string, { x: number }> {
  if (shapes.length < 2) return new Map();
  
  const groupBounds = getGroupBounds(shapes);
  const updates = new Map<string, { x: number }>();
  
  shapes.forEach(shape => {
    const newPos = alignLeft(shape, groupBounds.left);
    updates.set(shape.id, newPos);
  });
  
  return updates;
}

/**
 * Align shapes to their group's right edge
 */
export function alignShapesRight(shapes: CanvasShape[]): Map<string, { x: number }> {
  if (shapes.length < 2) return new Map();
  
  const groupBounds = getGroupBounds(shapes);
  const updates = new Map<string, { x: number }>();
  
  shapes.forEach(shape => {
    const newPos = alignRight(shape, groupBounds.right);
    updates.set(shape.id, newPos);
  });
  
  return updates;
}

/**
 * Align shapes to their group's top edge
 */
export function alignShapesTop(shapes: CanvasShape[]): Map<string, { y: number }> {
  if (shapes.length < 2) return new Map();
  
  const groupBounds = getGroupBounds(shapes);
  const updates = new Map<string, { y: number }>();
  
  shapes.forEach(shape => {
    const newPos = alignTop(shape, groupBounds.top);
    updates.set(shape.id, newPos);
  });
  
  return updates;
}

/**
 * Align shapes to their group's bottom edge
 */
export function alignShapesBottom(shapes: CanvasShape[]): Map<string, { y: number }> {
  if (shapes.length < 2) return new Map();
  
  const groupBounds = getGroupBounds(shapes);
  const updates = new Map<string, { y: number }>();
  
  shapes.forEach(shape => {
    const newPos = alignBottom(shape, groupBounds.bottom);
    updates.set(shape.id, newPos);
  });
  
  return updates;
}

/**
 * Align shapes to their group's horizontal center
 */
export function alignShapesCenterHorizontal(shapes: CanvasShape[]): Map<string, { x: number }> {
  if (shapes.length < 2) return new Map();
  
  const groupBounds = getGroupBounds(shapes);
  const updates = new Map<string, { x: number }>();
  
  shapes.forEach(shape => {
    const newPos = alignCenterHorizontal(shape, groupBounds.centerX);
    updates.set(shape.id, newPos);
  });
  
  return updates;
}

/**
 * Align shapes to their group's vertical middle
 */
export function alignShapesMiddleVertical(shapes: CanvasShape[]): Map<string, { y: number }> {
  if (shapes.length < 2) return new Map();
  
  const groupBounds = getGroupBounds(shapes);
  const updates = new Map<string, { y: number }>();
  
  shapes.forEach(shape => {
    const newPos = alignMiddleVertical(shape, groupBounds.centerY);
    updates.set(shape.id, newPos);
  });
  
  return updates;
}

