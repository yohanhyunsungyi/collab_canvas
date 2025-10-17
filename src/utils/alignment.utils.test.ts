import { describe, it, expect } from 'vitest';
import {
  getShapeBounds,
  getGroupBounds,
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterHorizontal,
  alignMiddleVertical,
  distributeHorizontally,
  distributeVertically,
  alignShapesLeft,
  alignShapesRight,
  alignShapesTop,
  alignShapesBottom,
  alignShapesCenterHorizontal,
  alignShapesMiddleVertical,
} from './alignment.utils';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../types/canvas.types';

// Helper to create test rectangle
const createRect = (id: string, x: number, y: number, width: number, height: number): RectangleShape => ({
  id,
  type: 'rectangle',
  x,
  y,
  width,
  height,
  color: '#000000',
  zIndex: 0,
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

// Helper to create test circle
const createCircle = (id: string, x: number, y: number, radius: number): CircleShape => ({
  id,
  type: 'circle',
  x,
  y,
  radius,
  color: '#000000',
  zIndex: 0,
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

// Helper to create test text
const createText = (id: string, x: number, y: number, text: string, fontSize: number): TextShape => ({
  id,
  type: 'text',
  x,
  y,
  text,
  fontSize,
  color: '#000000',
  zIndex: 0,
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

describe('alignment.utils', () => {
  describe('getShapeBounds', () => {
    it('should calculate rectangle bounds correctly', () => {
      const rect = createRect('1', 10, 20, 100, 50);
      const bounds = getShapeBounds(rect);
      
      expect(bounds.left).toBe(10);
      expect(bounds.right).toBe(110);
      expect(bounds.top).toBe(20);
      expect(bounds.bottom).toBe(70);
      expect(bounds.centerX).toBe(60);
      expect(bounds.centerY).toBe(45);
      expect(bounds.width).toBe(100);
      expect(bounds.height).toBe(50);
    });

    it('should calculate circle bounds correctly', () => {
      const circle = createCircle('1', 50, 50, 25);
      const bounds = getShapeBounds(circle);
      
      expect(bounds.left).toBe(25);
      expect(bounds.right).toBe(75);
      expect(bounds.top).toBe(25);
      expect(bounds.bottom).toBe(75);
      expect(bounds.centerX).toBe(50);
      expect(bounds.centerY).toBe(50);
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(50);
    });

    it('should calculate text bounds correctly', () => {
      const text = createText('1', 0, 0, 'Hello', 24);
      const bounds = getShapeBounds(text);
      
      // Text bounds are approximated
      expect(bounds.left).toBe(0);
      expect(bounds.top).toBe(0);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });
  });

  describe('getGroupBounds', () => {
    it('should calculate bounds of multiple shapes', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 100, 100, 50, 50),
      ];
      
      const bounds = getGroupBounds(shapes);
      expect(bounds.left).toBe(0);
      expect(bounds.right).toBe(150);
      expect(bounds.top).toBe(0);
      expect(bounds.bottom).toBe(150);
      expect(bounds.centerX).toBe(75);
      expect(bounds.centerY).toBe(75);
    });

    it('should return zero bounds for empty array', () => {
      const bounds = getGroupBounds([]);
      expect(bounds.left).toBe(0);
      expect(bounds.right).toBe(0);
    });
  });

  describe('alignLeft', () => {
    it('should calculate new position to align shape left', () => {
      const rect = createRect('1', 50, 0, 100, 50);
      const result = alignLeft(rect, 10);
      
      // Shape at x=50 with left edge at 50, should move to x=10
      expect(result.x).toBe(10);
    });
  });

  describe('alignRight', () => {
    it('should calculate new position to align shape right', () => {
      const rect = createRect('1', 0, 0, 100, 50);
      const result = alignRight(rect, 200);
      
      // Shape has right edge at 100, should move to have right edge at 200
      expect(result.x).toBe(100);
    });
  });

  describe('alignTop', () => {
    it('should calculate new position to align shape top', () => {
      const rect = createRect('1', 0, 50, 100, 50);
      const result = alignTop(rect, 10);
      
      // Shape at y=50 with top edge at 50, should move to y=10
      expect(result.y).toBe(10);
    });
  });

  describe('alignBottom', () => {
    it('should calculate new position to align shape bottom', () => {
      const rect = createRect('1', 0, 0, 100, 50);
      const result = alignBottom(rect, 200);
      
      // Shape has bottom edge at 50, should move to have bottom edge at 200
      expect(result.y).toBe(150);
    });
  });

  describe('alignCenterHorizontal', () => {
    it('should calculate new position to center shape horizontally', () => {
      const rect = createRect('1', 0, 0, 100, 50);
      const result = alignCenterHorizontal(rect, 100);
      
      // Shape center at 50, should move to center at 100
      expect(result.x).toBe(50);
    });
  });

  describe('alignMiddleVertical', () => {
    it('should calculate new position to center shape vertically', () => {
      const rect = createRect('1', 0, 0, 100, 50);
      const result = alignMiddleVertical(rect, 100);
      
      // Shape middle at 25, should move to middle at 100
      expect(result.y).toBe(75);
    });
  });

  describe('alignShapesLeft', () => {
    it('should align multiple shapes to their group left edge', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 100, 0, 50, 50),
      ];
      
      const updates = alignShapesLeft(shapes);
      expect(updates.size).toBe(2);
      
      // Both shapes should align to x=0 (leftmost)
      expect(updates.get('1')?.x).toBe(0);
      expect(updates.get('2')?.x).toBe(0);
    });

    it('should return empty map for less than 2 shapes', () => {
      const shapes: CanvasShape[] = [createRect('1', 0, 0, 50, 50)];
      
      const updates = alignShapesLeft(shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('alignShapesRight', () => {
    it('should align multiple shapes to their group right edge', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 100, 0, 50, 50),
      ];
      
      const updates = alignShapesRight(shapes);
      expect(updates.size).toBe(2);
      
      // Both shapes should align their right edge to 150
      expect(updates.get('1')?.x).toBe(100); // Move from 0 to 100
      expect(updates.get('2')?.x).toBe(100); // Stay at 100
    });
  });

  describe('alignShapesTop', () => {
    it('should align multiple shapes to their group top edge', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 0, 100, 50, 50),
      ];
      
      const updates = alignShapesTop(shapes);
      expect(updates.size).toBe(2);
      
      // Both shapes should align to y=0 (topmost)
      expect(updates.get('1')?.y).toBe(0);
      expect(updates.get('2')?.y).toBe(0);
    });
  });

  describe('alignShapesBottom', () => {
    it('should align multiple shapes to their group bottom edge', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 0, 100, 50, 50),
      ];
      
      const updates = alignShapesBottom(shapes);
      expect(updates.size).toBe(2);
      
      // Both shapes should align their bottom edge to 150
      expect(updates.get('1')?.y).toBe(100); // Move from 0 to 100
      expect(updates.get('2')?.y).toBe(100); // Stay at 100
    });
  });

  describe('alignShapesCenterHorizontal', () => {
    it('should align multiple shapes to their group center', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 100, 0, 50, 50),
      ];
      
      const updates = alignShapesCenterHorizontal(shapes);
      expect(updates.size).toBe(2);
      
      // Group center is at x=75
      // Shape 1 should move to center at 75: x = 75 - 25 = 50
      // Shape 2 should move to center at 75: x = 75 - 25 = 50
      expect(updates.get('1')?.x).toBe(50);
      expect(updates.get('2')?.x).toBe(50);
    });
  });

  describe('alignShapesMiddleVertical', () => {
    it('should align multiple shapes to their group middle', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 0, 100, 50, 50),
      ];
      
      const updates = alignShapesMiddleVertical(shapes);
      expect(updates.size).toBe(2);
      
      // Group middle is at y=75
      // Shape 1 should move to middle at 75: y = 75 - 25 = 50
      // Shape 2 should move to middle at 75: y = 75 - 25 = 50
      expect(updates.get('1')?.y).toBe(50);
      expect(updates.get('2')?.y).toBe(50);
    });
  });

  describe('distributeHorizontally', () => {
    it('should distribute shapes with even horizontal spacing', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 50, 0, 50, 50),
        createRect('3', 200, 0, 50, 50),
      ];
      
      const updates = distributeHorizontally(shapes);
      
      // Should only update middle shape
      // Leftmost and rightmost stay in place
      expect(updates.size).toBe(1);
      expect(updates.has('2')).toBe(true);
    });

    it('should return empty map for less than 3 shapes', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 100, 0, 50, 50),
      ];
      
      const updates = distributeHorizontally(shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('distributeVertically', () => {
    it('should distribute shapes with even vertical spacing', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 0, 50, 50, 50),
        createRect('3', 0, 200, 50, 50),
      ];
      
      const updates = distributeVertically(shapes);
      
      // Should only update middle shape
      // Topmost and bottommost stay in place
      expect(updates.size).toBe(1);
      expect(updates.has('2')).toBe(true);
    });

    it('should return empty map for less than 3 shapes', () => {
      const shapes: CanvasShape[] = [
        createRect('1', 0, 0, 50, 50),
        createRect('2', 0, 100, 50, 50),
      ];
      
      const updates = distributeVertically(shapes);
      expect(updates.size).toBe(0);
    });
  });
});

