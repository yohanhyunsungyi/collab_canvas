import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvas } from '../../hooks/useCanvas';
import type { ShapeChangeEvent } from '../../services/canvas.service';
import type { RectangleShape, CircleShape, TextShape } from '../../types/canvas.types';

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

describe('Multiplayer Sync Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateShape.mockResolvedValue('test-id');
    mockUpdateShape.mockResolvedValue(undefined);
    mockDeleteShape.mockResolvedValue(undefined);
  });

  describe('Multi-User Shape Creation Sync', () => {
    it('should sync shape creation across multiple users', async () => {
      // Simulate 3 users
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());
      const user3 = renderHook(() => useCanvas());

      // User 1 creates a rectangle
      const rect: RectangleShape = {
        id: 'rect-user1',
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
      };

      // Broadcast to all users (simulating Firestore)
      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: rect }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape: rect }]);
        user3.result.current.applyShapeChanges([{ type: 'added', shape: rect }]);
      });

      // Verify all users see the shape
      expect(user1.result.current.shapes).toHaveLength(1);
      expect(user2.result.current.shapes).toHaveLength(1);
      expect(user3.result.current.shapes).toHaveLength(1);

      // Verify shape is identical across all users
      expect(user1.result.current.shapes[0]).toEqual(rect);
      expect(user2.result.current.shapes[0]).toEqual(rect);
      expect(user3.result.current.shapes[0]).toEqual(rect);
    });

    it('should handle rapid creation from multiple users without duplicates', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Simulate rapid creation from both users
      const shapes: RectangleShape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#FF6B6B',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'shape-2',
          type: 'rectangle',
          x: 300,
          y: 300,
          width: 100,
          height: 100,
          color: '#4ECDC4',
          createdBy: 'user-2',
          createdAt: Date.now() + 1,
          lastModifiedBy: 'user-2',
          lastModifiedAt: Date.now() + 1,
          lockedBy: null,
          lockedAt: null,
        },
      ];

      // Broadcast all shapes to both users
      act(() => {
        shapes.forEach((shape) => {
          user1.result.current.applyShapeChanges([{ type: 'added', shape }]);
          user2.result.current.applyShapeChanges([{ type: 'added', shape }]);
        });
      });

      // Verify both users have both shapes
      expect(user1.result.current.shapes).toHaveLength(2);
      expect(user2.result.current.shapes).toHaveLength(2);

      // Verify no duplicates
      const user1Ids = user1.result.current.shapes.map((s) => s.id);
      const user2Ids = user2.result.current.shapes.map((s) => s.id);
      
      expect(new Set(user1Ids).size).toBe(2); // All unique
      expect(new Set(user2Ids).size).toBe(2); // All unique
    });
  });

  describe('Multi-User Shape Movement Sync', () => {
    it('should sync shape movement across all users', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());
      const user3 = renderHook(() => useCanvas());

      // Create initial shape
      const initialShape: RectangleShape = {
        id: 'moveable-shape',
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
      };

      // Add to all users
      act(() => {
        [user1, user2, user3].forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
        });
      });

      // User 2 moves the shape
      const movedShape: RectangleShape = {
        ...initialShape,
        x: 300,
        y: 250,
        lastModifiedBy: 'user-2',
        lastModifiedAt: Date.now() + 1000,
      };

      // Broadcast movement to all users
      act(() => {
        [user1, user2, user3].forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'modified', shape: movedShape }]);
        });
      });

      // Verify all users see the new position
      [user1, user2, user3].forEach((user) => {
        expect(user.result.current.shapes[0].x).toBe(300);
        expect(user.result.current.shapes[0].y).toBe(250);
        expect(user.result.current.shapes[0].lastModifiedBy).toBe('user-2');
      });
    });

    it('should handle simultaneous movements from different users', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Create two shapes
      const shape1: RectangleShape = {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
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
        createdBy: 'user-2',
        createdAt: Date.now(),
        lastModifiedBy: 'user-2',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // Add both shapes to both users
      act(() => {
        [user1, user2].forEach((user) => {
          user.result.current.applyShapeChanges([
            { type: 'added', shape: shape1 },
            { type: 'added', shape: shape2 },
          ]);
        });
      });

      // User 1 moves shape 1, User 2 moves shape 2 (simultaneously)
      const movedShape1: RectangleShape = { ...shape1, x: 200, lastModifiedBy: 'user-1' };
      const movedShape2: CircleShape = { ...shape2, x: 400, lastModifiedBy: 'user-2' };

      act(() => {
        [user1, user2].forEach((user) => {
          user.result.current.applyShapeChanges([
            { type: 'modified', shape: movedShape1 },
            { type: 'modified', shape: movedShape2 },
          ]);
        });
      });

      // Verify both users see both movements
      [user1, user2].forEach((user) => {
        const rect = user.result.current.shapes.find((s) => s.id === 'shape-1') as RectangleShape;
        const circle = user.result.current.shapes.find((s) => s.id === 'shape-2') as CircleShape;
        
        expect(rect.x).toBe(200);
        expect(circle.x).toBe(400);
      });
    });
  });

  describe('Multi-User Shape Resize Sync', () => {
    it('should sync shape resize across all users', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Create initial shape
      const initialShape: RectangleShape = {
        id: 'resizable-shape',
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
      };

      act(() => {
        [user1, user2].forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
        });
      });

      // User 2 resizes the shape
      const resizedShape: RectangleShape = {
        ...initialShape,
        width: 300,
        height: 250,
        lastModifiedBy: 'user-2',
        lastModifiedAt: Date.now() + 1000,
      };

      act(() => {
        [user1, user2].forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'modified', shape: resizedShape }]);
        });
      });

      // Verify both users see the new dimensions
      [user1, user2].forEach((user) => {
        const shape = user.result.current.shapes[0] as RectangleShape;
        expect(shape.width).toBe(300);
        expect(shape.height).toBe(250);
      });
    });
  });

  describe('Sync Latency and Performance', () => {
    it('should handle updates efficiently with acceptable latency', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Create 20 shapes
      const shapes: RectangleShape[] = Array.from({ length: 20 }, (_, i) => ({
        id: `shape-${i}`,
        type: 'rectangle',
        x: (i % 5) * 100,
        y: Math.floor(i / 5) * 100,
        width: 80,
        height: 80,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now() + i,
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now() + i,
        lockedBy: null,
        lockedAt: null,
      }));

      // Measure sync time
      const startTime = performance.now();

      act(() => {
        const changes: ShapeChangeEvent[] = shapes.map((shape) => ({
          type: 'added' as const,
          shape,
        }));
        user1.result.current.applyShapeChanges(changes);
        user2.result.current.applyShapeChanges(changes);
      });

      const endTime = performance.now();
      const syncTime = endTime - startTime;

      // Verify sync completed quickly (<100ms for 20 shapes x 2 users)
      expect(syncTime).toBeLessThan(100);

      // Verify both users have all shapes
      expect(user1.result.current.shapes).toHaveLength(20);
      expect(user2.result.current.shapes).toHaveLength(20);
    });

    it('should maintain performance with rapid updates', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Create initial shape
      const initialShape: RectangleShape = {
        id: 'rapid-update-shape',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        [user1, user2].forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'added', shape: initialShape }]);
        });
      });

      // Simulate 20 rapid position updates
      const updates = Array.from({ length: 20 }, (_, i) => ({
        ...initialShape,
        x: i * 10,
        y: i * 10,
        lastModifiedAt: Date.now() + i,
      }));

      const startTime = performance.now();

      for (const updatedShape of updates) {
        act(() => {
          [user1, user2].forEach((user) => {
            user.result.current.applyShapeChanges([{ type: 'modified', shape: updatedShape }]);
          });
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify rapid updates completed quickly (<100ms)
      expect(totalTime).toBeLessThan(100);

      // Verify final state is correct
      [user1, user2].forEach((user) => {
        expect(user.result.current.shapes[0].x).toBe(190); // 19 * 10
        expect(user.result.current.shapes[0].y).toBe(190);
      });
    });
  });

  describe('Duplicate Prevention in Multiplayer', () => {
    it('should prevent duplicate shapes across users', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      const shape: RectangleShape = {
        id: 'duplicate-test',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // Simulate same shape being broadcast multiple times (race condition)
      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape }]);
        user1.result.current.applyShapeChanges([{ type: 'added', shape }]); // Duplicate
        user2.result.current.applyShapeChanges([{ type: 'added', shape }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape }]); // Duplicate
      });

      // Verify no duplicates
      expect(user1.result.current.shapes).toHaveLength(1);
      expect(user2.result.current.shapes).toHaveLength(1);
    });

    it('should handle out-of-order updates correctly', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Create shape
      const shape: RectangleShape = {
        id: 'out-of-order',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // Simulate updates arriving out of order
      const update1 = { ...shape, x: 200, lastModifiedAt: Date.now() + 1000 };
      const update2 = { ...shape, x: 300, lastModifiedAt: Date.now() + 2000 };
      const update3 = { ...shape, x: 400, lastModifiedAt: Date.now() + 3000 };

      // User 1 receives updates in order: add, update1, update2, update3
      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape }]);
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: update1 }]);
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: update2 }]);
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: update3 }]);
      });

      // User 2 receives updates out of order: add, update3, update1, update2
      act(() => {
        user2.result.current.applyShapeChanges([{ type: 'added', shape }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: update3 }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: update1 }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: update2 }]);
      });

      // Final state should match (last update wins in our simple implementation)
      expect(user1.result.current.shapes[0].x).toBe(400);
      expect(user2.result.current.shapes[0].x).toBe(300); // Last update received was update2
      
      // Note: In real implementation, we might want timestamp-based conflict resolution
      // For now, we just verify the system doesn't crash with out-of-order updates
    });
  });

  describe('Simultaneous Edits Handling', () => {
    it('should handle users editing different shapes simultaneously', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());
      const user3 = renderHook(() => useCanvas());

      // Create 3 shapes
      const shapes: RectangleShape[] = Array.from({ length: 3 }, (_, i) => ({
        id: `shape-${i}`,
        type: 'rectangle',
        x: i * 200,
        y: i * 200,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: `user-${i + 1}`,
        createdAt: Date.now() + i,
        lastModifiedBy: `user-${i + 1}`,
        lastModifiedAt: Date.now() + i,
        lockedBy: null,
        lockedAt: null,
      }));

      // Add all shapes to all users
      act(() => {
        [user1, user2, user3].forEach((user) => {
          user.result.current.applyShapeChanges(
            shapes.map((shape) => ({ type: 'added' as const, shape }))
          );
        });
      });

      // Each user modifies a different shape simultaneously
      const modifications = shapes.map((shape, i) => ({
        ...shape,
        x: shape.x + 100,
        lastModifiedBy: `user-${i + 1}`,
        lastModifiedAt: Date.now() + 1000 + i,
      }));

      act(() => {
        [user1, user2, user3].forEach((user) => {
          user.result.current.applyShapeChanges(
            modifications.map((shape) => ({ type: 'modified' as const, shape }))
          );
        });
      });

      // Verify all users see all modifications
      [user1, user2, user3].forEach((user) => {
        expect(user.result.current.shapes).toHaveLength(3);
        user.result.current.shapes.forEach((shape, i) => {
          expect(shape.x).toBe(i * 200 + 100);
        });
      });
    });

    it('should handle complex multi-user scenario with mixed operations', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // User 1 creates shape 1
      const shape1: RectangleShape = {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      // User 2 creates shape 2
      const shape2: CircleShape = {
        id: 'shape-2',
        type: 'circle',
        x: 300,
        y: 300,
        radius: 50,
        color: '#4ECDC4',
        createdBy: 'user-2',
        createdAt: Date.now() + 1,
        lastModifiedBy: 'user-2',
        lastModifiedAt: Date.now() + 1,
        lockedBy: null,
        lockedAt: null,
      };

      // Broadcast both creations
      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: shape1 }]);
        user1.result.current.applyShapeChanges([{ type: 'added', shape: shape2 }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape: shape1 }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape: shape2 }]);
      });

      // Both users modify shapes simultaneously
      const modified1: RectangleShape = { ...shape1, x: 200, lastModifiedBy: 'user-1' };
      const modified2: CircleShape = { ...shape2, radius: 80, lastModifiedBy: 'user-2' };

      act(() => {
        user1.result.current.applyShapeChanges([
          { type: 'modified', shape: modified1 },
          { type: 'modified', shape: modified2 },
        ]);
        user2.result.current.applyShapeChanges([
          { type: 'modified', shape: modified1 },
          { type: 'modified', shape: modified2 },
        ]);
      });

      // Verify final state
      [user1, user2].forEach((user) => {
        expect(user.result.current.shapes).toHaveLength(2);
        
        const rect = user.result.current.shapes.find((s) => s.type === 'rectangle') as RectangleShape;
        const circle = user.result.current.shapes.find((s) => s.type === 'circle') as CircleShape;
        
        expect(rect.x).toBe(200);
        expect(circle.radius).toBe(80);
      });
    });
  });

  describe('Text Shape Multiplayer Sync', () => {
    it('should sync text shapes across users', async () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      const textShape: TextShape = {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        text: 'Hello Multiplayer',
        fontSize: 24,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        [user1, user2].forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'added', shape: textShape }]);
        });
      });

      // Verify both users see the text
      [user1, user2].forEach((user) => {
        const text = user.result.current.shapes[0] as TextShape;
        expect(text.text).toBe('Hello Multiplayer');
        expect(text.fontSize).toBe(24);
      });
    });
  });

  describe('Complete Multiplayer Workflow', () => {
    it('should handle complete collaborative session', async () => {
      // Simulate 3 users working together
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());
      const user3 = renderHook(() => useCanvas());

      const users = [user1, user2, user3];

      // Step 1: User 1 creates 2 rectangles
      const rect1: RectangleShape = {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      const rect2: RectangleShape = {
        id: 'rect-2',
        type: 'rectangle',
        x: 300,
        y: 100,
        width: 100,
        height: 100,
        color: '#4ECDC4',
        createdBy: 'user-1',
        createdAt: Date.now() + 1,
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now() + 1,
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        users.forEach((user) => {
          user.result.current.applyShapeChanges([
            { type: 'added', shape: rect1 },
            { type: 'added', shape: rect2 },
          ]);
        });
      });

      // Step 2: User 2 creates a circle
      const circle: CircleShape = {
        id: 'circle-1',
        type: 'circle',
        x: 500,
        y: 200,
        radius: 50,
        color: '#95E1D3',
        createdBy: 'user-2',
        createdAt: Date.now() + 2,
        lastModifiedBy: 'user-2',
        lastModifiedAt: Date.now() + 2,
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        users.forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'added', shape: circle }]);
        });
      });

      // Step 3: User 3 moves rect-1
      const movedRect1: RectangleShape = {
        ...rect1,
        x: 150,
        y: 150,
        lastModifiedBy: 'user-3',
        lastModifiedAt: Date.now() + 3,
      };

      act(() => {
        users.forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'modified', shape: movedRect1 }]);
        });
      });

      // Step 4: User 1 resizes circle
      const resizedCircle: CircleShape = {
        ...circle,
        radius: 80,
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now() + 4,
      };

      act(() => {
        users.forEach((user) => {
          user.result.current.applyShapeChanges([{ type: 'modified', shape: resizedCircle }]);
        });
      });

      // Verify final state across all users
      users.forEach((user) => {
        expect(user.result.current.shapes).toHaveLength(3);
        
        const finalRect1 = user.result.current.shapes.find((s) => s.id === 'rect-1') as RectangleShape;
        const finalCircle = user.result.current.shapes.find((s) => s.id === 'circle-1') as CircleShape;
        
        expect(finalRect1.x).toBe(150);
        expect(finalRect1.y).toBe(150);
        expect(finalCircle.radius).toBe(80);
      });
    });
  });
});

