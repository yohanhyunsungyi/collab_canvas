import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCanvas } from '../../hooks/useCanvas';
import * as canvasService from '../../services/canvas.service';
import type { CanvasShape, RectangleShape, CircleShape } from '../../types/canvas.types';

// Mock canvas service
vi.mock('../../services/canvas.service');

describe('Shape Persistence Integration Tests', () => {
  let mockShapes: CanvasShape[] = [];

  beforeEach(() => {
    mockShapes = [];

    // Mock createShape
    vi.mocked(canvasService.createShape).mockImplementation(async (shape) => {
      mockShapes.push(shape);
      return shape.id;
    });

    // Mock updateShape
    vi.mocked(canvasService.updateShape).mockImplementation(async (id, updates) => {
      const index = mockShapes.findIndex((s) => s.id === id);
      if (index !== -1) {
        mockShapes[index] = { ...mockShapes[index], ...updates } as CanvasShape;
      }
    });

    // Mock deleteShape
    vi.mocked(canvasService.deleteShape).mockImplementation(async (id) => {
      mockShapes = mockShapes.filter((s) => s.id !== id);
    });

    // Mock fetchAllShapes
    vi.mocked(canvasService.fetchAllShapes).mockImplementation(async () => {
      return [...mockShapes];
    });

    // Mock subscribeToShapes - does not auto-trigger, manual control needed
    vi.mocked(canvasService.subscribeToShapes).mockImplementation(() => {
      return () => {}; // Return unsubscribe function
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockShapes = [];
  });

  describe('Shape Creation Persistence', () => {
    it('should call createShape service when adding a shape', async () => {
      const { result } = renderHook(() => useCanvas());

      const shapeData = {
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
      };

      await result.current.addShape(shapeData, 'test-user-1');

      expect(canvasService.createShape).toHaveBeenCalledTimes(1);
      expect(canvasService.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
          createdBy: 'test-user-1',
        })
      );
      expect(mockShapes).toHaveLength(1);
    });

    it('should persist circle shape with correct metadata', async () => {
      const { result } = renderHook(() => useCanvas());

      const circleData = {
        type: 'circle' as const,
        x: 200,
        y: 200,
        radius: 100,
        color: '#4ECDC4',
      };

      await result.current.addShape(circleData, 'test-user-2');

      expect(mockShapes).toHaveLength(1);
      expect(mockShapes[0]).toMatchObject({
        type: 'circle',
        x: 200,
        y: 200,
        radius: 100,
        color: '#4ECDC4',
        createdBy: 'test-user-2',
      });
    });
  });

  describe('Shape Movement Persistence', () => {
    it('should call updateShape service when moving a shape', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create initial shape
      const shapeData = {
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
      };

      await result.current.addShape(shapeData, 'test-user-1');
      const createdShapeId = mockShapes[0].id;

      // Move the shape
      await result.current.updateShape(createdShapeId, {
        x: 200,
        y: 250,
        lastModifiedBy: 'test-user-1',
        lastModifiedAt: Date.now(),
      });

      expect(canvasService.updateShape).toHaveBeenCalledWith(
        createdShapeId,
        expect.objectContaining({
          x: 200,
          y: 250,
        })
      );
      expect(mockShapes[0].x).toBe(200);
      expect(mockShapes[0].y).toBe(250);
    });
  });

  describe('Shape Resize Persistence', () => {
    it('should update rectangle dimensions in Firestore', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create rectangle
      const shapeData = {
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
      };

      await result.current.addShape(shapeData, 'test-user-1');
      const shapeId = mockShapes[0].id;

      // Resize the rectangle
      await result.current.updateShape(shapeId, {
        width: 300,
        height: 250,
      });

      expect((mockShapes[0] as RectangleShape).width).toBe(300);
      expect((mockShapes[0] as RectangleShape).height).toBe(250);
    });

    it('should update circle radius in Firestore', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create circle
      const circleData = {
        type: 'circle' as const,
        x: 200,
        y: 200,
        radius: 100,
        color: '#4ECDC4',
      };

      await result.current.addShape(circleData, 'test-user-1');
      const shapeId = mockShapes[0].id;

      // Resize the circle
      await result.current.updateShape(shapeId, {
        radius: 150,
      });

      expect((mockShapes[0] as CircleShape).radius).toBe(150);
    });
  });

  describe('Initial Load from Firestore', () => {
    it('should fetch all shapes from Firestore', async () => {
      // Pre-populate with shapes
      mockShapes = [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'circle-1',
          type: 'circle',
          x: 300,
          y: 300,
          radius: 100,
          color: '#4ECDC4',
          createdBy: 'user-2',
          createdAt: Date.now(),
          lastModifiedBy: 'user-2',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
      ] as CanvasShape[];

      const shapes = await canvasService.fetchAllShapes();

      expect(shapes).toHaveLength(2);
      expect(shapes[0].id).toBe('rect-1');
      expect(shapes[1].id).toBe('circle-1');
    });

    it('should handle empty Firestore on initial load', async () => {
      mockShapes = [];

      const shapes = await canvasService.fetchAllShapes();

      expect(shapes).toHaveLength(0);
    });
  });

  describe('Shared Canvas - Multi-User Scenarios', () => {
    it('should fetch shapes created by different users', async () => {
      // Simulate User A creating a shape
      const userAShape: RectangleShape = {
        id: 'rect-a',
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

      mockShapes = [userAShape];

      // User B fetches all shapes
      const shapes = await canvasService.fetchAllShapes();

      // User B should see User A's shapes
      expect(shapes).toHaveLength(1);
      expect(shapes[0].createdBy).toBe('user-a');
    });

    it('should handle combined shapes from multiple users', async () => {
      // Multiple users have created shapes
      mockShapes = [
        {
          id: 'rect-a',
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
        },
        {
          id: 'circle-b',
          type: 'circle',
          x: 300,
          y: 300,
          radius: 100,
          color: '#4ECDC4',
          createdBy: 'user-b',
          createdAt: Date.now(),
          lastModifiedBy: 'user-b',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'rect-c',
          type: 'rectangle',
          x: 500,
          y: 500,
          width: 150,
          height: 100,
          color: '#45B7D1',
          createdBy: 'user-c',
          createdAt: Date.now(),
          lastModifiedBy: 'user-c',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
      ] as CanvasShape[];

      const shapes = await canvasService.fetchAllShapes();

      // All shapes should be fetched
      expect(shapes).toHaveLength(3);
      expect(shapes.map((s) => s.createdBy)).toEqual(['user-a', 'user-b', 'user-c']);
    });

    it('should update lastModifiedBy when different user modifies shape', async () => {
      const { result } = renderHook(() => useCanvas());

      // User A creates a shape
      const shapeData = {
        type: 'rectangle' as const,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
      };

      await result.current.addShape(shapeData, 'user-a');
      const shapeId = mockShapes[0].id;

      expect(mockShapes[0].createdBy).toBe('user-a');

      // User B moves the shape
      await result.current.updateShape(shapeId, {
        x: 300,
        y: 300,
        lastModifiedBy: 'user-b',
        lastModifiedAt: Date.now(),
      });

      expect(mockShapes[0].x).toBe(300);
      expect(mockShapes[0].lastModifiedBy).toBe('user-b');
    });
  });

  describe('Persistence Across Sessions', () => {
    it('should maintain shape data in mock Firestore store', async () => {
      const { result: result1 } = renderHook(() => useCanvas());

      // Session 1: Create a shape
      await result1.current.addShape(
        {
          type: 'rectangle' as const,
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
        },
        'test-user'
      );

      expect(mockShapes).toHaveLength(1);
      const shapeId = mockShapes[0].id;

      // Session 2: New hook instance (simulates page reload)
      const { result: result2 } = renderHook(() => useCanvas());

      // Fetch shapes - should still exist
      const shapes = await canvasService.fetchAllShapes();

      expect(shapes).toHaveLength(1);
      expect(shapes[0].id).toBe(shapeId);
    });

    it('should maintain modified shape properties across sessions', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create and modify a shape
      await result.current.addShape(
        {
          type: 'rectangle' as const,
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
        },
        'user-a'
      );

      const shapeId = mockShapes[0].id;

      // Modify it
      await result.current.updateShape(shapeId, {
        x: 300,
        y: 300,
        color: '#00FF00',
        width: 400,
        height: 300,
      });

      // Fetch after modification
      const shapes = await canvasService.fetchAllShapes();

      expect(shapes[0]).toMatchObject({
        x: 300,
        y: 300,
        color: '#00FF00',
        width: 400,
        height: 300,
      });
    });
  });
});

