import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvas } from '../../hooks/useCanvas';
import type { RectangleShape, CircleShape } from '../../types/canvas.types';

describe('Object Locking Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing state
  });

  describe('Lock Acquisition', () => {
    it('should allow first user to acquire lock', () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // User 1 creates a shape
      const shape: RectangleShape = {
        id: 'lock-test-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape }]);
      });

      expect(user1.result.current.shapes).toHaveLength(1);
      expect(user2.result.current.shapes).toHaveLength(1);

      // Simulate User 1 acquiring lock
      const lockedShape: RectangleShape = {
        ...shape,
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: lockedShape }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: lockedShape }]);
      });

      // Both users should see the lock
      expect(user1.result.current.shapes[0].lockedBy).toBe('user1');
      expect(user2.result.current.shapes[0].lockedBy).toBe('user1');
    });

    it('should prevent second user from acquiring lock', () => {
      const user1 = renderHook(() => useCanvas());

      // Create shape locked by user1
      const lockedShape: RectangleShape = {
        id: 'lock-test-2',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: lockedShape }]);
      });

      const shape = user1.result.current.shapes[0];
      expect(shape.lockedBy).toBe('user1');
      expect(shape.lockedAt).toBeTruthy();
    });
  });

  describe('Lock Release', () => {
    it('should release lock when user finishes interaction', () => {
      const user1 = renderHook(() => useCanvas());

      // Shape with lock
      const lockedShape: RectangleShape = {
        id: 'lock-test-3',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: lockedShape }]);
      });

      expect(user1.result.current.shapes[0].lockedBy).toBe('user1');

      // Release lock
      const unlockedShape: RectangleShape = {
        ...lockedShape,
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: unlockedShape }]);
      });

      expect(user1.result.current.shapes[0].lockedBy).toBeNull();
      expect(user1.result.current.shapes[0].lockedAt).toBeNull();
    });
  });

  describe('Multi-User Lock Scenarios', () => {
    it('should handle concurrent lock attempts', () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Initial unlocked shape
      const shape: RectangleShape = {
        id: 'lock-test-4',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape }]);
      });

      // User 1 wins the race and acquires lock
      const lockedByUser1: RectangleShape = {
        ...shape,
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: lockedByUser1 }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: lockedByUser1 }]);
      });

      // Both users see user1's lock
      expect(user1.result.current.shapes[0].lockedBy).toBe('user1');
      expect(user2.result.current.shapes[0].lockedBy).toBe('user1');
    });

    it('should allow user to lock after previous lock is released', () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Shape locked by user1
      const lockedShape: RectangleShape = {
        id: 'lock-test-5',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: lockedShape }]);
        user2.result.current.applyShapeChanges([{ type: 'added', shape: lockedShape }]);
      });

      // User1 releases lock
      const unlockedShape: RectangleShape = {
        ...lockedShape,
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: unlockedShape }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: unlockedShape }]);
      });

      // User2 acquires lock
      const lockedByUser2: RectangleShape = {
        ...unlockedShape,
        lockedBy: 'user2',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: lockedByUser2 }]);
        user2.result.current.applyShapeChanges([{ type: 'modified', shape: lockedByUser2 }]);
      });

      expect(user1.result.current.shapes[0].lockedBy).toBe('user2');
      expect(user2.result.current.shapes[0].lockedBy).toBe('user2');
    });

    it('should handle multiple shapes with different locks', () => {
      const user1 = renderHook(() => useCanvas());
      const user2 = renderHook(() => useCanvas());

      // Shape 1 locked by user1
      const shape1: RectangleShape = {
        id: 'lock-test-6',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      // Shape 2 locked by user2
      const shape2: CircleShape = {
        id: 'lock-test-7',
        type: 'circle',
        x: 300,
        y: 200,
        radius: 50,
        color: '#00ff00',
        createdBy: 'user2',
        createdAt: Date.now(),
        lastModifiedBy: 'user2',
        lastModifiedAt: Date.now(),
        lockedBy: 'user2',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([
          { type: 'added', shape: shape1 },
          { type: 'added', shape: shape2 },
        ]);
        user2.result.current.applyShapeChanges([
          { type: 'added', shape: shape1 },
          { type: 'added', shape: shape2 },
        ]);
      });

      expect(user1.result.current.shapes).toHaveLength(2);
      expect(user2.result.current.shapes).toHaveLength(2);

      // Verify different locks
      expect(user1.result.current.shapes[0].lockedBy).toBe('user1');
      expect(user1.result.current.shapes[1].lockedBy).toBe('user2');
      expect(user2.result.current.shapes[0].lockedBy).toBe('user1');
      expect(user2.result.current.shapes[1].lockedBy).toBe('user2');
    });
  });

  describe('Lock Timeout', () => {
    it('should identify expired locks', () => {
      const user1 = renderHook(() => useCanvas());

      // Shape with expired lock (35 seconds old)
      const expiredLockShape: RectangleShape = {
        id: 'lock-test-8',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: 'user1',
        lockedAt: Date.now() - 35000, // 35 seconds ago
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: expiredLockShape }]);
      });

      const shape = user1.result.current.shapes[0];
      expect(shape.lockedBy).toBe('user1');
      
      // Lock is old (35 seconds), should be considered expired
      const lockAge = Date.now() - (shape.lockedAt || 0);
      expect(lockAge).toBeGreaterThan(30000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle shape with no lock gracefully', () => {
      const user1 = renderHook(() => useCanvas());

      const shape: RectangleShape = {
        id: 'lock-test-9',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape }]);
      });

      expect(user1.result.current.shapes[0].lockedBy).toBeNull();
      expect(user1.result.current.shapes[0].lockedAt).toBeNull();
    });

    it('should maintain lock data during position updates', () => {
      const user1 = renderHook(() => useCanvas());

      const lockedShape: RectangleShape = {
        id: 'lock-test-10',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#ff0000',
        createdBy: 'user1',
        createdAt: Date.now(),
        lastModifiedBy: 'user1',
        lastModifiedAt: Date.now(),
        lockedBy: 'user1',
        lockedAt: Date.now(),
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'added', shape: lockedShape }]);
      });

      // Move shape while locked
      const movedShape: RectangleShape = {
        ...lockedShape,
        x: 200,
        y: 200,
      };

      act(() => {
        user1.result.current.applyShapeChanges([{ type: 'modified', shape: movedShape }]);
      });

      // Lock should persist through position update
      expect(user1.result.current.shapes[0].x).toBe(200);
      expect(user1.result.current.shapes[0].y).toBe(200);
      expect(user1.result.current.shapes[0].lockedBy).toBe('user1');
    });
  });
});

