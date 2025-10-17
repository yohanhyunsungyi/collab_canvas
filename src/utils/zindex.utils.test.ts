import { describe, it, expect } from 'vitest';
import {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  renormalizeZIndexes,
  getZIndexRange,
  isAtFront,
  isAtBack,
} from './zindex.utils';
import type { CanvasShape } from '../types/canvas.types';

// Helper to create test shapes
const createTestShape = (id: string, zIndex: number): CanvasShape => ({
  id,
  type: 'rectangle',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  color: '#000000',
  zIndex,
  createdBy: 'test-user',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
});

describe('zindex.utils', () => {
  describe('renormalizeZIndexes', () => {
    it('should renormalize fragmented zIndexes to 0, 1, 2...', () => {
      const shapes = [
        createTestShape('1', 5),
        createTestShape('2', 10),
        createTestShape('3', 1),
      ];
      
      const updates = renormalizeZIndexes(shapes);
      expect(updates.size).toBe(3);
      expect(updates.get('3')).toBe(0); // was 1
      expect(updates.get('1')).toBe(1); // was 5
      expect(updates.get('2')).toBe(2); // was 10
    });

    it('should return empty map if already normalized', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = renormalizeZIndexes(shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('bringToFront', () => {
    it('should move shape to end and renormalize all', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = bringToFront('1', shapes);
      expect(updates.size).toBeGreaterThan(0);
      expect(updates.get('1')).toBe(2); // Moved to end
      expect(updates.get('2')).toBe(0); // Renormalized
      expect(updates.get('3')).toBe(1); // Renormalized
    });

    it('should return empty map if already at front', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = bringToFront('3', shapes);
      expect(updates.size).toBe(0);
    });

    it('should work with fragmented zIndexes', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 5),
        createTestShape('3', 10),
      ];
      
      const updates = bringToFront('1', shapes);
      expect(updates.size).toBeGreaterThan(0);
      expect(updates.get('1')).toBe(2); // Now at front
      expect(updates.get('2')).toBe(0); // Renormalized
      expect(updates.get('3')).toBe(1); // Renormalized
    });

    it('should return empty map if shape not found', () => {
      const shapes = [createTestShape('1', 0)];
      
      const updates = bringToFront('999', shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('sendToBack', () => {
    it('should move shape to start and renormalize all', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = sendToBack('3', shapes);
      expect(updates.size).toBeGreaterThan(0);
      expect(updates.get('3')).toBe(0); // Moved to start
      expect(updates.get('1')).toBe(1); // Renormalized
      expect(updates.get('2')).toBe(2); // Renormalized
    });

    it('should return empty map if already at back', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = sendToBack('1', shapes);
      expect(updates.size).toBe(0);
    });

    it('should work with fragmented zIndexes', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 5),
        createTestShape('3', 10),
      ];
      
      const updates = sendToBack('3', shapes);
      expect(updates.size).toBeGreaterThan(0);
      expect(updates.get('3')).toBe(0); // Now at back
      expect(updates.get('1')).toBe(1); // Renormalized
      expect(updates.get('2')).toBe(2); // Renormalized
    });

    it('should return empty map if shape not found', () => {
      const shapes = [createTestShape('1', 0)];
      
      const updates = sendToBack('999', shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('bringForward', () => {
    it('should swap with next shape and renormalize', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = bringForward('1', shapes);
      // After swap: [2, 1, 3] -> renormalize: 2=0, 1=1, 3=2
      expect(updates.size).toBe(2); // 1 and 2 changed positions
      expect(updates.get('1')).toBe(1);
      expect(updates.get('2')).toBe(0);
    });

    it('should return empty map if already at front', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = bringForward('3', shapes);
      expect(updates.size).toBe(0);
    });

    it('should work with fragmented zIndexes', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 5),
        createTestShape('3', 10),
      ];
      
      const updates = bringForward('2', shapes);
      // Original order by zIndex: 1(0), 2(5), 3(10)
      // After swap: 1(0), 3(10), 2(5)
      // After renormalize: 1=0, 3=1, 2=2
      expect(updates.size).toBeGreaterThan(0);
      // 1 stays 0 (no change)
      expect(updates.get('3')).toBe(1); // was 10
      expect(updates.get('2')).toBe(2); // was 5
    });

    it('should return empty map if shape not found', () => {
      const shapes = [createTestShape('1', 0)];
      
      const updates = bringForward('999', shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('sendBackward', () => {
    it('should swap with previous shape and renormalize', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = sendBackward('2', shapes);
      // After swap: [2, 1, 3] -> renormalize: 2=0, 1=1, 3=2
      expect(updates.size).toBe(2); // 1 and 2 changed positions
      expect(updates.get('2')).toBe(0);
      expect(updates.get('1')).toBe(1);
    });

    it('should return empty map if already at bottom', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 1),
        createTestShape('3', 2),
      ];
      
      const updates = sendBackward('1', shapes);
      expect(updates.size).toBe(0);
    });

    it('should work with fragmented zIndexes', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 5),
        createTestShape('3', 10),
      ];
      
      const updates = sendBackward('2', shapes);
      // After swap: order is 2, 1, 3
      // After renormalize: 2=0, 1=1, 3=2
      expect(updates.size).toBeGreaterThan(0);
      expect(updates.get('2')).toBe(0);
      expect(updates.get('1')).toBe(1);
      expect(updates.get('3')).toBe(2);
    });

    it('should return empty map if shape not found', () => {
      const shapes = [createTestShape('1', 0)];
      
      const updates = sendBackward('999', shapes);
      expect(updates.size).toBe(0);
    });
  });

  describe('getZIndexRange', () => {
    it('should return correct min and max zIndex', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 5),
        createTestShape('3', 10),
      ];
      
      const range = getZIndexRange(shapes);
      expect(range).toEqual({ min: 0, max: 10 });
    });

    it('should return 0 for empty array', () => {
      const range = getZIndexRange([]);
      expect(range).toEqual({ min: 0, max: 0 });
    });
  });

  describe('isAtFront', () => {
    it('should return true if shape has highest zIndex', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 10),
      ];
      
      expect(isAtFront('2', shapes)).toBe(true);
      expect(isAtFront('1', shapes)).toBe(false);
    });

    it('should return false if shape not found', () => {
      const shapes = [createTestShape('1', 0)];
      
      expect(isAtFront('999', shapes)).toBe(false);
    });
  });

  describe('isAtBack', () => {
    it('should return true if shape has lowest zIndex', () => {
      const shapes = [
        createTestShape('1', 0),
        createTestShape('2', 10),
      ];
      
      expect(isAtBack('1', shapes)).toBe(true);
      expect(isAtBack('2', shapes)).toBe(false);
    });

    it('should return false if shape not found', () => {
      const shapes = [createTestShape('1', 0)];
      
      expect(isAtBack('999', shapes)).toBe(false);
    });
  });
});
