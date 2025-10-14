import { describe, it, expect } from 'vitest';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  constrainPoint,
  getTransformerBoundBoxFunc,
  constrainRectangleDimensions,
  constrainCircleRadius,
  constrainShapeCreation,
} from './boundaries';

describe('boundaries utilities', () => {
  describe('constrainPoint', () => {
    it('should keep point within canvas bounds', () => {
      expect(constrainPoint(100, 100)).toEqual({ x: 100, y: 100 });
      expect(constrainPoint(-10, -10)).toEqual({ x: 0, y: 0 });
      expect(constrainPoint(6000, 6000)).toEqual({ x: CANVAS_WIDTH, y: CANVAS_HEIGHT });
    });
  });

  describe('getTransformerBoundBoxFunc', () => {
    it('should accept valid bounding box within canvas', () => {
      const oldBox = { x: 100, y: 100, width: 100, height: 100, rotation: 0 };
      const newBox = { x: 100, y: 100, width: 150, height: 150, rotation: 0 };

      expect(getTransformerBoundBoxFunc(oldBox, newBox)).toEqual(newBox);
    });

    it('should reject box that is too small', () => {
      const oldBox = { x: 100, y: 100, width: 100, height: 100, rotation: 0 };
      const newBox = { x: 100, y: 100, width: 3, height: 3, rotation: 0 };

      expect(getTransformerBoundBoxFunc(oldBox, newBox)).toEqual(oldBox);
    });

    it('should reject box that goes outside canvas', () => {
      const oldBox = { x: 100, y: 100, width: 100, height: 100, rotation: 0 };
      const newBox = { x: -10, y: 100, width: 100, height: 100, rotation: 0 };

      expect(getTransformerBoundBoxFunc(oldBox, newBox)).toEqual(oldBox);
    });

    it('should reject box that exceeds canvas width', () => {
      const oldBox = { x: 100, y: 100, width: 100, height: 100, rotation: 0 };
      const newBox = { x: 4900, y: 100, width: 200, height: 100, rotation: 0 };

      expect(getTransformerBoundBoxFunc(oldBox, newBox)).toEqual(oldBox);
    });

    it('should reject box that exceeds canvas height', () => {
      const oldBox = { x: 100, y: 100, width: 100, height: 100, rotation: 0 };
      const newBox = { x: 100, y: 4900, width: 100, height: 200, rotation: 0 };

      expect(getTransformerBoundBoxFunc(oldBox, newBox)).toEqual(oldBox);
    });
  });

  describe('constrainRectangleDimensions', () => {
    it('should constrain width and height within canvas bounds', () => {
      expect(constrainRectangleDimensions(100, 100, 200, 200)).toEqual({ width: 200, height: 200 });
      expect(constrainRectangleDimensions(4900, 100, 200, 200)).toEqual({ width: 100, height: 200 });
      expect(constrainRectangleDimensions(100, 4900, 200, 200)).toEqual({ width: 200, height: 100 });
      expect(constrainRectangleDimensions(100, 100, 3, 3)).toEqual({ width: 5, height: 5 }); // Minimum 5px
    });
  });

  describe('constrainCircleRadius', () => {
    it('should constrain radius within canvas bounds', () => {
      expect(constrainCircleRadius(100, 100, 50)).toBe(50);
      expect(constrainCircleRadius(50, 100, 100)).toBe(50); // Limited by distance to left edge
      expect(constrainCircleRadius(4950, 100, 100)).toBe(50); // Limited by distance to right edge
      expect(constrainCircleRadius(100, 50, 100)).toBe(50); // Limited by distance to top edge
      expect(constrainCircleRadius(100, 4950, 100)).toBe(50); // Limited by distance to bottom edge
      expect(constrainCircleRadius(100, 100, 3)).toBe(5); // Minimum 5px
    });
  });

  describe('constrainShapeCreation', () => {
    it('should constrain rectangle creation', () => {
      const result = constrainShapeCreation('rectangle', 100, 100, 200, 150);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);

      // Near edge
      const edgeResult = constrainShapeCreation('rectangle', 4900, 4900, 200, 200);
      expect(edgeResult.x).toBeLessThanOrEqual(4900);
      expect(edgeResult.y).toBeLessThanOrEqual(4900);
      expect((edgeResult.x ?? 0) + (edgeResult.width ?? 0)).toBeLessThanOrEqual(CANVAS_WIDTH);
      expect((edgeResult.y ?? 0) + (edgeResult.height ?? 0)).toBeLessThanOrEqual(CANVAS_HEIGHT);
    });

    it('should constrain circle creation', () => {
      const result = constrainShapeCreation('circle', 100, 100, undefined, undefined, 50);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.radius).toBe(50);

      // Near edge
      const edgeResult = constrainShapeCreation('circle', 50, 50, undefined, undefined, 100);
      expect(edgeResult.radius).toBeLessThanOrEqual(50); // Limited by distance to edge
    });

    it('should constrain text creation', () => {
      const result = constrainShapeCreation('text', 100, 100);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);

      // Out of bounds
      const edgeResult = constrainShapeCreation('text', -10, -10);
      expect(edgeResult.x).toBe(0);
      expect(edgeResult.y).toBe(0);
    });
  });
});

