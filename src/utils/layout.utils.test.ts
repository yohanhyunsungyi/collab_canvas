import { describe, it, expect } from 'vitest';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../types/canvas.types';

/**
 * Layout Utilities Test Suite
 * Tests pure layout calculation functions used by AI executor
 */

// Helper functions to create test shapes
const createRectangle = (id: string, x: number, y: number, width: number, height: number): RectangleShape => ({
  id,
  type: 'rectangle',
  x,
  y,
  width,
  height,
  color: '#000000',
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

const createCircle = (id: string, x: number, y: number, radius: number): CircleShape => ({
  id,
  type: 'circle',
  x,
  y,
  radius,
  color: '#000000',
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

const createText = (id: string, x: number, y: number, text: string, fontSize: number): TextShape => ({
  id,
  type: 'text',
  x,
  y,
  text,
  fontSize,
  width: text.length * fontSize * 0.6,
  height: fontSize * 1.2,
  color: '#000000',
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

// Layout calculation utilities
export const getShapeLeft = (shape: CanvasShape): number => {
  return shape.x;
};

export const getShapeRight = (shape: CanvasShape): number => {
  if (shape.type === 'rectangle') return shape.x + shape.width;
  if (shape.type === 'circle') return shape.x + shape.radius;
  if (shape.type === 'text') return shape.x + (shape.width || 100);
  return shape.x;
};

export const getShapeTop = (shape: CanvasShape): number => {
  return shape.y;
};

export const getShapeBottom = (shape: CanvasShape): number => {
  if (shape.type === 'rectangle') return shape.y + shape.height;
  if (shape.type === 'circle') return shape.y + shape.radius;
  if (shape.type === 'text') return shape.y + (shape.height || 24);
  return shape.y;
};

export const getShapeWidth = (shape: CanvasShape): number => {
  if (shape.type === 'rectangle') return shape.width;
  if (shape.type === 'circle') return shape.radius * 2;
  if (shape.type === 'text') return shape.width || 100;
  return 0;
};

export const getShapeHeight = (shape: CanvasShape): number => {
  if (shape.type === 'rectangle') return shape.height;
  if (shape.type === 'circle') return shape.radius * 2;
  if (shape.type === 'text') return shape.height || 24;
  return 0;
};

export const getShapeCenterX = (shape: CanvasShape): number => {
  return getShapeLeft(shape) + getShapeWidth(shape) / 2;
};

export const getShapeCenterY = (shape: CanvasShape): number => {
  return getShapeTop(shape) + getShapeHeight(shape) / 2;
};

/**
 * Calculate new positions for horizontal arrangement
 */
export const calculateHorizontalArrangement = (
  shapes: CanvasShape[],
  options: { startX?: number; y?: number; spacing?: number } = {}
): Map<string, { x: number; y: number }> => {
  const { startX = -400, y = 0, spacing = 150 } = options;
  const positions = new Map<string, { x: number; y: number }>();

  let currentX = startX;
  for (const shape of shapes) {
    positions.set(shape.id, { x: currentX, y });
    currentX += getShapeWidth(shape) + spacing;
  }

  return positions;
};

/**
 * Calculate new positions for vertical arrangement
 */
export const calculateVerticalArrangement = (
  shapes: CanvasShape[],
  options: { x?: number; startY?: number; spacing?: number } = {}
): Map<string, { x: number; y: number }> => {
  const { x = 100, startY = 100, spacing = 120 } = options;
  const positions = new Map<string, { x: number; y: number }>();

  let currentY = startY;
  for (const shape of shapes) {
    positions.set(shape.id, { x, y: currentY });
    currentY += getShapeHeight(shape) + spacing;
  }

  return positions;
};

/**
 * Calculate new positions for grid arrangement
 */
export const calculateGridArrangement = (
  shapes: CanvasShape[],
  columns: number,
  options: { startX?: number; startY?: number; spacingX?: number; spacingY?: number } = {}
): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (columns <= 0 || shapes.length === 0) {
    return positions;
  }

  // Calculate starting position (centered by default)
  const { spacingX = 120, spacingY = 120 } = options;
  
  // If startX/startY not provided, center the grid
  let startX = options.startX;
  let startY = options.startY;
  
  if (startX === undefined || startY === undefined) {
    const rows = Math.ceil(shapes.length / columns);
    const gridWidth = columns * 100 + (columns - 1) * spacingX;
    const gridHeight = rows * 100 + (rows - 1) * spacingY;
    startX = -gridWidth / 2;
    startY = -gridHeight / 2;
  }

  // Calculate positions
  shapes.forEach((shape, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    const x = startX + col * (100 + spacingX);
    const y = startY + row * (100 + spacingY);
    
    positions.set(shape.id, { x, y });
  });

  return positions;
};

/**
 * Calculate centered position for a shape
 */
export const calculateCenterPosition = (shape: CanvasShape): { x: number; y: number } => {
  const width = getShapeWidth(shape);
  const height = getShapeHeight(shape);
  
  return {
    x: -width / 2,
    y: -height / 2,
  };
};

/**
 * Calculate evenly distributed positions (horizontal)
 */
export const calculateEvenDistributionHorizontal = (
  shapes: CanvasShape[]
): Map<string, { x: number }> => {
  const positions = new Map<string, { x: number }>();
  
  if (shapes.length < 2) {
    return positions;
  }

  // Sort shapes by their left edge
  const sortedShapes = [...shapes].sort((a, b) => getShapeLeft(a) - getShapeLeft(b));
  
  // Keep the leftmost and rightmost shapes in place
  const leftmostLeft = getShapeLeft(sortedShapes[0]);
  const rightmostRight = getShapeRight(sortedShapes[sortedShapes.length - 1]);
  const totalSpace = rightmostRight - leftmostLeft;
  
  // Calculate total width of all shapes
  const totalShapeWidth = sortedShapes.reduce((sum, shape) => sum + getShapeWidth(shape), 0);
  
  // Calculate spacing between shapes
  const spacing = (totalSpace - totalShapeWidth) / (sortedShapes.length - 1);
  
  // Calculate new positions
  let currentLeft = leftmostLeft;
  for (const shape of sortedShapes) {
    positions.set(shape.id, { x: currentLeft });
    currentLeft += getShapeWidth(shape) + spacing;
  }

  return positions;
};

/**
 * Calculate evenly distributed positions (vertical)
 */
export const calculateEvenDistributionVertical = (
  shapes: CanvasShape[]
): Map<string, { y: number }> => {
  const positions = new Map<string, { y: number }>();
  
  if (shapes.length < 2) {
    return positions;
  }

  // Sort shapes by their top edge
  const sortedShapes = [...shapes].sort((a, b) => getShapeTop(a) - getShapeTop(b));
  
  // Keep the topmost and bottommost shapes in place
  const topmostTop = getShapeTop(sortedShapes[0]);
  const bottommostBottom = getShapeBottom(sortedShapes[sortedShapes.length - 1]);
  const totalSpace = bottommostBottom - topmostTop;
  
  // Calculate total height of all shapes
  const totalShapeHeight = sortedShapes.reduce((sum, shape) => sum + getShapeHeight(shape), 0);
  
  // Calculate spacing between shapes
  const spacing = (totalSpace - totalShapeHeight) / (sortedShapes.length - 1);
  
  // Calculate new positions
  let currentTop = topmostTop;
  for (const shape of sortedShapes) {
    positions.set(shape.id, { y: currentTop });
    currentTop += getShapeHeight(shape) + spacing;
  }

  return positions;
};

// ==========================================
// TESTS
// ==========================================

describe('Layout Utilities', () => {
  describe('Shape Property Getters', () => {
    it('should get rectangle dimensions correctly', () => {
      const rect = createRectangle('r1', 100, 200, 150, 100);
      
      expect(getShapeLeft(rect)).toBe(100);
      expect(getShapeRight(rect)).toBe(250); // 100 + 150
      expect(getShapeTop(rect)).toBe(200);
      expect(getShapeBottom(rect)).toBe(300); // 200 + 100
      expect(getShapeWidth(rect)).toBe(150);
      expect(getShapeHeight(rect)).toBe(100);
      expect(getShapeCenterX(rect)).toBe(175); // 100 + 75
      expect(getShapeCenterY(rect)).toBe(250); // 200 + 50
    });

    it('should get circle dimensions correctly', () => {
      const circle = createCircle('c1', 100, 200, 50);
      
      expect(getShapeLeft(circle)).toBe(100);
      expect(getShapeRight(circle)).toBe(150); // 100 + 50
      expect(getShapeTop(circle)).toBe(200);
      expect(getShapeBottom(circle)).toBe(250); // 200 + 50
      expect(getShapeWidth(circle)).toBe(100); // 50 * 2
      expect(getShapeHeight(circle)).toBe(100); // 50 * 2
      expect(getShapeCenterX(circle)).toBe(150); // 100 + 50
      expect(getShapeCenterY(circle)).toBe(250); // 200 + 50
    });

    it('should get text dimensions correctly', () => {
      const text = createText('t1', 100, 200, 'Hello', 24);
      
      expect(getShapeLeft(text)).toBe(100);
      expect(getShapeTop(text)).toBe(200);
      expect(getShapeWidth(text)).toBeGreaterThan(0);
      expect(getShapeHeight(text)).toBeGreaterThan(0);
    });
  });

  describe('calculateHorizontalArrangement', () => {
    it('should arrange shapes horizontally with default spacing', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 0, 100, 100),
        createRectangle('r3', 0, 0, 100, 100),
      ];

      const positions = calculateHorizontalArrangement(shapes);

      expect(positions.size).toBe(3);
      expect(positions.get('r1')).toEqual({ x: -400, y: 0 });
      expect(positions.get('r2')).toEqual({ x: -150, y: 0 }); // -400 + 100 + 150
      expect(positions.get('r3')).toEqual({ x: 100, y: 0 }); // -150 + 100 + 150
    });

    it('should arrange shapes with custom spacing', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 0, 100, 100),
      ];

      const positions = calculateHorizontalArrangement(shapes, { 
        startX: 0, 
        y: 100, 
        spacing: 50 
      });

      expect(positions.get('r1')).toEqual({ x: 0, y: 100 });
      expect(positions.get('r2')).toEqual({ x: 150, y: 100 }); // 0 + 100 + 50
    });

    it('should handle shapes with different widths', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 50, 100),
        createRectangle('r2', 0, 0, 150, 100),
        createCircle('c1', 0, 0, 25), // width = 50
      ];

      const positions = calculateHorizontalArrangement(shapes, { spacing: 20 });

      expect(positions.size).toBe(3);
      // r1: startX
      // r2: startX + 50 + 20 = startX + 70
      // c1: startX + 50 + 20 + 150 + 20 = startX + 240
    });
  });

  describe('calculateVerticalArrangement', () => {
    it('should arrange shapes vertically with default spacing', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 0, 100, 100),
        createRectangle('r3', 0, 0, 100, 100),
      ];

      const positions = calculateVerticalArrangement(shapes);

      expect(positions.size).toBe(3);
      expect(positions.get('r1')).toEqual({ x: 100, y: 100 });
      expect(positions.get('r2')).toEqual({ x: 100, y: 320 }); // 100 + 100 + 120
      expect(positions.get('r3')).toEqual({ x: 100, y: 540 }); // 320 + 100 + 120
    });

    it('should arrange shapes with custom options', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 50),
        createRectangle('r2', 0, 0, 100, 50),
      ];

      const positions = calculateVerticalArrangement(shapes, {
        x: 200,
        startY: 50,
        spacing: 30,
      });

      expect(positions.get('r1')).toEqual({ x: 200, y: 50 });
      expect(positions.get('r2')).toEqual({ x: 200, y: 130 }); // 50 + 50 + 30
    });

    it('should handle shapes with different heights', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 50),
        createRectangle('r2', 0, 0, 100, 150),
        createCircle('c1', 0, 0, 30), // height = 60
      ];

      const positions = calculateVerticalArrangement(shapes, { spacing: 20 });

      expect(positions.size).toBe(3);
      // r1: startY = 100
      // r2: 100 + 50 + 20 = 170
      // c1: 170 + 150 + 20 = 340
    });
  });

  describe('calculateGridArrangement', () => {
    it('should arrange shapes in a 3x3 grid', () => {
      const shapes = Array.from({ length: 9 }, (_, i) => 
        createRectangle(`r${i}`, 0, 0, 100, 100)
      );

      const positions = calculateGridArrangement(shapes, 3);

      expect(positions.size).toBe(9);
      
      // Check first row
      const r0 = positions.get('r0')!;
      const r1 = positions.get('r1')!;
      const r2 = positions.get('r2')!;
      expect(r0.y).toBe(r1.y);
      expect(r1.y).toBe(r2.y);
      
      // Check first column
      const r3 = positions.get('r3')!;
      const r6 = positions.get('r6')!;
      expect(r0.x).toBe(r3.x);
      expect(r3.x).toBe(r6.x);
    });

    it('should arrange shapes with custom spacing', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 0, 100, 100),
        createRectangle('r3', 0, 0, 100, 100),
        createRectangle('r4', 0, 0, 100, 100),
      ];

      const positions = calculateGridArrangement(shapes, 2, {
        startX: 0,
        startY: 0,
        spacingX: 50,
        spacingY: 50,
      });

      expect(positions.get('r1')).toEqual({ x: 0, y: 0 });
      expect(positions.get('r2')).toEqual({ x: 150, y: 0 }); // 0 + 100 + 50
      expect(positions.get('r3')).toEqual({ x: 0, y: 150 }); // 0, 0 + 100 + 50
      expect(positions.get('r4')).toEqual({ x: 150, y: 150 });
    });

    it('should handle incomplete rows', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 0, 100, 100),
        createRectangle('r3', 0, 0, 100, 100),
        createRectangle('r4', 0, 0, 100, 100),
        createRectangle('r5', 0, 0, 100, 100),
      ];

      const positions = calculateGridArrangement(shapes, 3, {
        startX: 0,
        startY: 0,
        spacingX: 20,
        spacingY: 20,
      });

      expect(positions.size).toBe(5);
      expect(positions.get('r4')).toEqual({ x: 0, y: 120 }); // Second row, first column
      expect(positions.get('r5')).toEqual({ x: 120, y: 120 }); // Second row, second column
    });

    it('should return empty map for invalid columns', () => {
      const shapes = [createRectangle('r1', 0, 0, 100, 100)];
      
      const positions1 = calculateGridArrangement(shapes, 0);
      const positions2 = calculateGridArrangement(shapes, -1);

      expect(positions1.size).toBe(0);
      expect(positions2.size).toBe(0);
    });

    it('should center grid when no start position provided', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 0, 100, 100),
      ];

      const positions = calculateGridArrangement(shapes, 2);

      // Should be centered (negative coordinates)
      const r1 = positions.get('r1')!;
      const r2 = positions.get('r2')!;
      
      expect(r1.x).toBeLessThan(0);
      expect(r2.x).toBeGreaterThan(r1.x);
      expect(r1.y).toBeLessThan(0);
    });
  });

  describe('calculateCenterPosition', () => {
    it('should center a rectangle', () => {
      const rect = createRectangle('r1', 100, 200, 200, 150);
      const position = calculateCenterPosition(rect);

      expect(position).toEqual({ x: -100, y: -75 }); // -width/2, -height/2
    });

    it('should center a circle', () => {
      const circle = createCircle('c1', 100, 200, 50);
      const position = calculateCenterPosition(circle);

      expect(position).toEqual({ x: -50, y: -50 }); // -(radius*2)/2
    });

    it('should center a text element', () => {
      const text = createText('t1', 100, 200, 'Hello', 24);
      const position = calculateCenterPosition(text);

      expect(position.x).toBeLessThan(0);
      expect(position.y).toBeLessThan(0);
    });
  });

  describe('calculateEvenDistributionHorizontal', () => {
    it('should distribute 3 shapes evenly', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 200, 0, 100, 100),
        createRectangle('r3', 500, 0, 100, 100),
      ];

      const positions = calculateEvenDistributionHorizontal(shapes);

      expect(positions.size).toBe(3);
      
      // First and last should stay in place
      expect(positions.get('r1')?.x).toBe(0);
      expect(positions.get('r3')?.x).toBe(500);
      
      // Middle should be evenly spaced
      const r2X = positions.get('r2')?.x!;
      expect(r2X).toBeGreaterThan(0);
      expect(r2X).toBeLessThan(500);
      
      // Check spacing is even (approximate due to rounding)
      const spacing1 = r2X - 0 - 100; // space between r1 and r2
      const spacing2 = 500 - r2X - 100; // space between r2 and r3
      expect(Math.abs(spacing1 - spacing2)).toBeLessThan(1);
    });

    it('should return empty map for single shape', () => {
      const shapes = [createRectangle('r1', 0, 0, 100, 100)];
      const positions = calculateEvenDistributionHorizontal(shapes);

      expect(positions.size).toBe(0);
    });

    it('should handle shapes with different widths', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 50, 100),
        createRectangle('r2', 200, 0, 150, 100),
        createRectangle('r3', 600, 0, 100, 100),
      ];

      const positions = calculateEvenDistributionHorizontal(shapes);

      expect(positions.size).toBe(3);
      expect(positions.get('r1')?.x).toBe(0);
      expect(positions.get('r3')?.x).toBe(600);
    });
  });

  describe('calculateEvenDistributionVertical', () => {
    it('should distribute 3 shapes evenly', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 100),
        createRectangle('r2', 0, 200, 100, 100),
        createRectangle('r3', 0, 500, 100, 100),
      ];

      const positions = calculateEvenDistributionVertical(shapes);

      expect(positions.size).toBe(3);
      
      // First and last should stay in place
      expect(positions.get('r1')?.y).toBe(0);
      expect(positions.get('r3')?.y).toBe(500);
      
      // Middle should be evenly spaced
      const r2Y = positions.get('r2')?.y!;
      expect(r2Y).toBeGreaterThan(0);
      expect(r2Y).toBeLessThan(500);
      
      // Check spacing is even
      const spacing1 = r2Y - 0 - 100;
      const spacing2 = 500 - r2Y - 100;
      expect(Math.abs(spacing1 - spacing2)).toBeLessThan(1);
    });

    it('should return empty map for single shape', () => {
      const shapes = [createRectangle('r1', 0, 0, 100, 100)];
      const positions = calculateEvenDistributionVertical(shapes);

      expect(positions.size).toBe(0);
    });

    it('should handle shapes with different heights', () => {
      const shapes = [
        createRectangle('r1', 0, 0, 100, 50),
        createRectangle('r2', 0, 200, 100, 150),
        createRectangle('r3', 0, 500, 100, 100),
      ];

      const positions = calculateEvenDistributionVertical(shapes);

      expect(positions.size).toBe(3);
      expect(positions.get('r1')?.y).toBe(0);
      expect(positions.get('r3')?.y).toBe(500);
    });
  });
});

