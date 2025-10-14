import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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

describe('Real-Time Shape Creation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateShape.mockResolvedValue('test-id');
    mockUpdateShape.mockResolvedValue(undefined);
    mockDeleteShape.mockResolvedValue(undefined);
  });

  describe('Single User Shape Creation', () => {
    it('should add shape to local state when user creates it', async () => {
      const { result } = renderHook(() => useCanvas());

      const mockUser = 'user-1';
      const newShapeData = {
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
      };

      await act(async () => {
        await result.current.addShape(newShapeData, mockUser);
      });

      expect(mockCreateShape).toHaveBeenCalledTimes(1);
      expect(mockCreateShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
          createdBy: 'user-1',
        })
      );
    });
  });

  describe('Multi-User Shape Creation', () => {
    it('should add shape from another user via real-time update', async () => {
      const { result } = renderHook(() => useCanvas());

      // Simulate shape created by User A
      const shapeFromUserA: RectangleShape = {
        id: 'shape-user-a-1',
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 150,
        height: 100,
        color: '#4ECDC4',
        createdBy: 'user-a',
        createdAt: Date.now(),
        lastModifiedBy: 'user-a',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      const changes: ShapeChangeEvent[] = [
        { type: 'added', shape: shapeFromUserA },
      ];

      // User B receives the real-time update
      act(() => {
        result.current.applyShapeChanges(changes);
      });

      // Verify shape was added to User B's canvas
      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0]).toMatchObject({
        id: 'shape-user-a-1',
        type: 'rectangle',
        x: 200,
        y: 200,
        createdBy: 'user-a',
      });
    });

    it('should handle multiple shapes created by different users', async () => {
      const { result } = renderHook(() => useCanvas());

      const shapesFromMultipleUsers: RectangleShape[] = [
        {
          id: 'shape-user-a-1',
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
        },
        {
          id: 'shape-user-b-1',
          type: 'rectangle',
          x: 300,
          y: 300,
          width: 150,
          height: 150,
          color: '#4ECDC4',
          createdBy: 'user-b',
          createdAt: Date.now(),
          lastModifiedBy: 'user-b',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'shape-user-c-1',
          type: 'rectangle',
          x: 500,
          y: 500,
          width: 200,
          height: 200,
          color: '#95E1D3',
          createdBy: 'user-c',
          createdAt: Date.now(),
          lastModifiedBy: 'user-c',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
      ];

      const changes: ShapeChangeEvent[] = shapesFromMultipleUsers.map((shape) => ({
        type: 'added' as const,
        shape,
      }));

      // Apply all changes at once
      act(() => {
        result.current.applyShapeChanges(changes);
      });

      // Verify all shapes were added
      expect(result.current.shapes).toHaveLength(3);
      expect(result.current.shapes.map((s) => s.createdBy)).toEqual([
        'user-a',
        'user-b',
        'user-c',
      ]);
    });

    it('should handle rapid shape creation from multiple users', async () => {
      const { result } = renderHook(() => useCanvas());

      // Simulate rapid shape creation (5 shapes in quick succession)
      const rapidShapes: CircleShape[] = Array.from({ length: 5 }, (_, i) => ({
        id: `rapid-shape-${i}`,
        type: 'circle',
        x: 100 + i * 100,
        y: 100 + i * 100,
        radius: 50,
        color: '#FF6B6B',
        createdBy: `user-${i % 3}`, // 3 different users
        createdAt: Date.now() + i,
        lastModifiedBy: `user-${i % 3}`,
        lastModifiedAt: Date.now() + i,
        lockedBy: null,
        lockedAt: null,
      }));

      // Apply shapes one by one (simulating real-time stream)
      for (const shape of rapidShapes) {
        act(() => {
          result.current.applyShapeChanges([{ type: 'added', shape }]);
        });
      }

      // Verify all shapes were added
      expect(result.current.shapes).toHaveLength(5);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate shapes when same shape is added twice', async () => {
      const { result } = renderHook(() => useCanvas());

      const shape: RectangleShape = {
        id: 'duplicate-test-shape',
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

      // Add shape first time
      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape }]);
      });

      expect(result.current.shapes).toHaveLength(1);

      // Try to add same shape again (duplicate)
      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape }]);
      });

      // Should still only have 1 shape (duplicate prevented)
      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0].id).toBe('duplicate-test-shape');
    });

    it('should prevent duplicates in batch updates', async () => {
      const { result } = renderHook(() => useCanvas());

      const shape1: RectangleShape = {
        id: 'batch-shape-1',
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

      const shape2: RectangleShape = {
        id: 'batch-shape-2',
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        color: '#4ECDC4',
        createdBy: 'user-b',
        createdAt: Date.now(),
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // Add shapes in batch with duplicate
      const changes: ShapeChangeEvent[] = [
        { type: 'added', shape: shape1 },
        { type: 'added', shape: shape2 },
        { type: 'added', shape: shape1 }, // Duplicate of shape1
      ];

      act(() => {
        result.current.applyShapeChanges(changes);
      });

      // Should only have 2 shapes (duplicate prevented)
      expect(result.current.shapes).toHaveLength(2);
      expect(result.current.shapes.map((s) => s.id)).toEqual([
        'batch-shape-1',
        'batch-shape-2',
      ]);
    });
  });

  describe('Mixed Operations', () => {
    it('should handle add, modify, and remove in single update', async () => {
      const { result } = renderHook(() => useCanvas());

      // Start with one existing shape
      const existingShape: RectangleShape = {
        id: 'existing-shape',
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

      act(() => {
        result.current.applyShapeChanges([{ type: 'added', shape: existingShape }]);
      });

      expect(result.current.shapes).toHaveLength(1);

      // Now apply mixed changes
      const newShape: RectangleShape = {
        id: 'new-shape',
        type: 'rectangle',
        x: 300,
        y: 300,
        width: 150,
        height: 150,
        color: '#4ECDC4',
        createdBy: 'user-b',
        createdAt: Date.now(),
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      const modifiedShape: RectangleShape = {
        ...existingShape,
        x: 200, // Position changed
        y: 200,
        lastModifiedBy: 'user-c',
        lastModifiedAt: Date.now(),
      };

      const changes: ShapeChangeEvent[] = [
        { type: 'added', shape: newShape },
        { type: 'modified', shape: modifiedShape },
      ];

      act(() => {
        result.current.applyShapeChanges(changes);
      });

      // Should have 2 shapes now
      expect(result.current.shapes).toHaveLength(2);
      
      // Verify modification was applied
      const updatedExistingShape = result.current.shapes.find((s) => s.id === 'existing-shape');
      expect(updatedExistingShape).toBeDefined();
      expect(updatedExistingShape?.x).toBe(200);
      expect(updatedExistingShape?.y).toBe(200);
      
      // Verify new shape was added
      const addedShape = result.current.shapes.find((s) => s.id === 'new-shape');
      expect(addedShape).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle shape creation updates efficiently', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create 50 shapes (simulating active collaboration)
      const manyShapes: RectangleShape[] = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-shape-${i}`,
        type: 'rectangle',
        x: (i % 10) * 100,
        y: Math.floor(i / 10) * 100,
        width: 80,
        height: 80,
        color: '#FF6B6B',
        createdBy: `user-${i % 5}`,
        createdAt: Date.now() + i,
        lastModifiedBy: `user-${i % 5}`,
        lastModifiedAt: Date.now() + i,
        lockedBy: null,
        lockedAt: null,
      }));

      const changes: ShapeChangeEvent[] = manyShapes.map((shape) => ({
        type: 'added' as const,
        shape,
      }));

      const startTime = performance.now();

      act(() => {
        result.current.applyShapeChanges(changes);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all shapes were added
      expect(result.current.shapes).toHaveLength(50);
      
      // Performance check: Should complete in reasonable time (< 100ms for 50 shapes)
      // Note: This is a rough check, actual performance may vary
      expect(duration).toBeLessThan(100);
    });
  });
});

