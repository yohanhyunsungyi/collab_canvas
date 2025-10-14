import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvas } from '../../hooks/useCanvas';
import type { ShapeChangeEvent } from '../../services/canvas.service';
import type { RectangleShape, CircleShape } from '../../types/canvas.types';

// Mock canvas service
const mockCreateShape = vi.fn();
const mockUpdateShape = vi.fn();
const mockDeleteShape = vi.fn();

vi.mock('../../services/canvas.service', () => ({
  createShape: (shape: any) => mockCreateShape(shape),
  updateShape: (id: string, updates: any) => mockUpdateShape(id, updates),
  deleteShape: (id: string) => mockDeleteShape(id),
  fetchAllShapes: vi.fn().mockResolvedValue([]),
  subscribeToShapes: vi.fn(() => vi.fn()),
}));

describe('Real-Time Shape Updates Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateShape.mockResolvedValue('test-id');
    mockUpdateShape.mockResolvedValue(undefined);
    mockDeleteShape.mockResolvedValue(undefined);
  });

  describe('Shape Movement Updates', () => {
    it('should update shape position when another user moves it', async () => {
      const { result } = renderHook(() => useCanvas());

      // Initial shape created by User A
      const initialShape: RectangleShape = {
        id: 'moveable-shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // Add initial shape
      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0].x).toBe(100);
      expect(result.current.shapes[0].y).toBe(100);

      // User B moves the shape
      const movedShape: RectangleShape = {
        ...initialShape,
        x: 300, // New X position
        y: 250, // New Y position
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now() + 1000,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'modified', shape: movedShape }]);
      });

      // Verify position was updated
      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0].x).toBe(300);
      expect(result.current.shapes[0].y).toBe(250);
      expect(result.current.shapes[0].lastModifiedBy).toBe('user-b');
    });

    it('should handle multiple shape movements from different users', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create two shapes
      const shape1: RectangleShape = {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      const shape2: CircleShape = {
        id: 'shape-2',
        type: 'circle',
        x: 300,
        y: 300,
        radius: 50,
        color: '#4ECDC4',
        createdBy: 'user-b',
        createdAt: Date.now(),
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([
          { type: 'added', shape: shape1 },
          { type: 'added', shape: shape2 },
        ]);
      });

      // Different users move different shapes
      const movedShape1: RectangleShape = { ...shape1, x: 200, y: 200, lastModifiedBy: 'user-c' };
      const movedShape2: CircleShape = { ...shape2, x: 400, y: 400, lastModifiedBy: 'user-d' };

      act(() => {
        result.current.applyShapeChanges([
          { type: 'modified', shape: movedShape1 },
          { type: 'modified', shape: movedShape2 },
        ]);
      });

      expect(result.current.shapes).toHaveLength(2);
      expect(result.current.shapes.find((s) => s.id === 'shape-1')?.x).toBe(200);
      expect(result.current.shapes.find((s) => s.id === 'shape-2')?.x).toBe(400);
    });

    it('should handle rapid movement updates', async () => {
      const { result } = renderHook(() => useCanvas());

      const initialShape: RectangleShape = {
        id: 'rapid-move-shape',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      // Simulate rapid movements (10 position updates)
      const movements = Array.from({ length: 10 }, (_, i) => ({
        ...initialShape,
        x: i * 50,
        y: i * 50,
        lastModifiedAt: Date.now() + i,
      }));

      for (const movedShape of movements) {
        act(() => {
          result.current.applyShapeChanges([{ type: 'modified', shape: movedShape }]);
        });
      }

      // Verify final position
      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0].x).toBe(450); // 9 * 50
      expect(result.current.shapes[0].y).toBe(450);
    });
  });

  describe('Shape Resize Updates', () => {
    it('should update rectangle dimensions when another user resizes it', async () => {
      const { result } = renderHook(() => useCanvas());

      const initialShape: RectangleShape = {
        id: 'resizable-rect',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      expect(result.current.shapes[0].width).toBe(200);
      expect(result.current.shapes[0].height).toBe(150);

      // User B resizes the rectangle
      const resizedShape: RectangleShape = {
        ...initialShape,
        width: 300, // Increased width
        height: 250, // Increased height
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now() + 1000,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'modified', shape: resizedShape }]);
      });

      expect(result.current.shapes[0].width).toBe(300);
      expect(result.current.shapes[0].height).toBe(250);
      expect(result.current.shapes[0].lastModifiedBy).toBe('user-b');
    });

    it('should update circle radius when another user resizes it', async () => {
      const { result } = renderHook(() => useCanvas());

      const initialShape: CircleShape = {
        id: 'resizable-circle',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        color: '#4ECDC4',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      expect(result.current.shapes[0].radius).toBe(50);

      // User B resizes the circle
      const resizedShape: CircleShape = {
        ...initialShape,
        radius: 100, // Doubled radius
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now() + 1000,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'modified', shape: resizedShape }]);
      });

      expect(result.current.shapes[0].radius).toBe(100);
      expect(result.current.shapes[0].lastModifiedBy).toBe('user-b');
    });

    it('should handle simultaneous resize operations from different users', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create multiple shapes
      const rect: RectangleShape = {
        id: 'rect-resize',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      const circle: CircleShape = {
        id: 'circle-resize',
        type: 'circle',
        x: 300,
        y: 300,
        radius: 50,
        color: '#4ECDC4',
        createdBy: 'user-b',
        createdAt: Date.now(),
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([
          { type: 'added', shape: rect },
          { type: 'added', shape: circle },
        ]);
      });

      // Different users resize different shapes simultaneously
      const resizedRect: RectangleShape = { ...rect, width: 200, height: 200, lastModifiedBy: 'user-c' };
      const resizedCircle: CircleShape = { ...circle, radius: 80, lastModifiedBy: 'user-d' };

      act(() => {
        result.current.applyShapeChanges([
          { type: 'modified', shape: resizedRect },
          { type: 'modified', shape: resizedCircle },
        ]);
      });

      const updatedRect = result.current.shapes.find((s) => s.id === 'rect-resize') as RectangleShape;
      const updatedCircle = result.current.shapes.find((s) => s.id === 'circle-resize') as CircleShape;

      expect(updatedRect.width).toBe(200);
      expect(updatedRect.height).toBe(200);
      expect(updatedCircle.radius).toBe(80);
    });
  });

  describe('Combined Movement and Resize Updates', () => {
    it('should handle both position and size changes in single update', async () => {
      const { result } = renderHook(() => useCanvas());

      const initialShape: RectangleShape = {
        id: 'transform-shape',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      // User B moves AND resizes the shape
      const transformedShape: RectangleShape = {
        ...initialShape,
        x: 200,        // New position
        y: 200,
        width: 250,    // New size
        height: 180,
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now() + 1000,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'modified', shape: transformedShape }]);
      });

      const updated = result.current.shapes[0] as RectangleShape;
      expect(updated.x).toBe(200);
      expect(updated.y).toBe(200);
      expect(updated.width).toBe(250);
      expect(updated.height).toBe(180);
    });

    it('should maintain shape consistency across rapid transforms', async () => {
      const { result } = renderHook(() => useCanvas());

      const initialShape: RectangleShape = {
        id: 'rapid-transform',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      // Apply 5 rapid transformations
      const transforms = Array.from({ length: 5 }, (_, i) => ({
        ...initialShape,
        x: i * 50,
        y: i * 40,
        width: 100 + i * 20,
        height: 100 + i * 15,
        lastModifiedAt: Date.now() + i,
      }));

      for (const transform of transforms) {
        act(() => {
          result.current.applyShapeChanges([{ type: 'modified', shape: transform }]);
        });
      }

      // Verify final state
      const final = result.current.shapes[0] as RectangleShape;
      expect(final.x).toBe(200);      // 4 * 50
      expect(final.y).toBe(160);      // 4 * 40
      expect(final.width).toBe(180);  // 100 + 4 * 20
      expect(final.height).toBe(160); // 100 + 4 * 15
    });
  });

  describe('Update Performance', () => {
    it('should handle shape updates efficiently', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create 30 shapes
      const shapes: RectangleShape[] = Array.from({ length: 30 }, (_, i) => ({
        id: `perf-shape-${i}`,
        type: 'rectangle',
        x: (i % 6) * 100,
        y: Math.floor(i / 6) * 100,
        width: 80,
        height: 80,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now() + i,
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now() + i,
        lockedBy: null,
        lockedAt: null,
      }));

      act(() => {
        result.current.applyShapeChanges(
          shapes.map((shape) => ({ type: 'added' as const, shape }))
        );
      });

      // Move all shapes simultaneously
      const movedShapes = shapes.map((shape) => ({
        ...shape,
        x: shape.x + 50,
        y: shape.y + 50,
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now() + 1000,
      }));

      const startTime = performance.now();

      act(() => {
        result.current.applyShapeChanges(
          movedShapes.map((shape) => ({ type: 'modified' as const, shape }))
        );
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all shapes were updated
      expect(result.current.shapes).toHaveLength(30);
      
      // All shapes should have moved
      result.current.shapes.forEach((shape, i) => {
        expect(shape.x).toBe((i % 6) * 100 + 50);
        expect(shape.y).toBe(Math.floor(i / 6) * 100 + 50);
      });

      // Performance check: Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle mixed updates efficiently', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create initial shapes
      const shapes: RectangleShape[] = Array.from({ length: 20 }, (_, i) => ({
        id: `mixed-shape-${i}`,
        type: 'rectangle',
        x: i * 50,
        y: i * 50,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now() + i,
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now() + i,
        lockedBy: null,
        lockedAt: null,
      }));

      act(() => {
        result.current.applyShapeChanges(
          shapes.map((shape) => ({ type: 'added' as const, shape }))
        );
      });

      // Create mixed changes: some moves, some resizes, some both
      const updates = shapes.map((shape, i) => {
        if (i % 3 === 0) {
          // Move only
          return { ...shape, x: shape.x + 100, lastModifiedBy: 'user-b' };
        } else if (i % 3 === 1) {
          // Resize only
          return { ...shape, width: 150, height: 150, lastModifiedBy: 'user-c' };
        } else {
          // Move and resize
          return { ...shape, x: shape.x + 100, width: 150, lastModifiedBy: 'user-d' };
        }
      });

      const startTime = performance.now();

      act(() => {
        result.current.applyShapeChanges(
          updates.map((shape) => ({ type: 'modified' as const, shape }))
        );
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all updates applied
      expect(result.current.shapes).toHaveLength(20);
      
      // Performance check
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating non-existent shape gracefully', async () => {
      const { result } = renderHook(() => useCanvas());

      const nonExistentShape: RectangleShape = {
        id: 'non-existent',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // Try to modify a shape that doesn't exist
      act(() => {
        result.current.applyShapeChanges([{ type: 'modified', shape: nonExistentShape }]);
      });

      // Should not crash, but shape list remains empty
      expect(result.current.shapes).toHaveLength(0);
    });

    it('should preserve other shape properties during updates', async () => {
      const { result } = renderHook(() => useCanvas());

      const initialShape: RectangleShape = {
        id: 'preserve-props',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
        createdBy: 'user-a',
        createdAt: 12345,
        lastModifiedBy: 'user-a',
        lastModifiedAt: 12345,
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
      });

      // Move the shape (only position changes)
      const movedShape: RectangleShape = {
        ...initialShape,
        x: 300,
        y: 250,
        lastModifiedBy: 'user-b',
        lastModifiedAt: 67890,
      };

      act(() => {
        result.current.applyShapeChanges([{ type: 'modified', shape: movedShape }]);
      });

      const updated = result.current.shapes[0] as RectangleShape;
      
      // Position updated
      expect(updated.x).toBe(300);
      expect(updated.y).toBe(250);
      
      // Other properties preserved
      expect(updated.color).toBe('#FF6B6B');
      expect(updated.width).toBe(200);
      expect(updated.height).toBe(150);
      expect(updated.createdBy).toBe('user-a');
      expect(updated.createdAt).toBe(12345);
      expect(updated.lastModifiedBy).toBe('user-b');
      expect(updated.lastModifiedAt).toBe(67890);
    });
  });
});

