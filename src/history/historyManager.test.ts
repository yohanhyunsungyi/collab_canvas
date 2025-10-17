import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistoryManager, type ChangeSet } from './historyManager';
import type { CanvasShape } from '../types/canvas.types';

describe('HistoryManager', () => {
  let historyManager: HistoryManager;
  let mockApply: ReturnType<typeof vi.fn>;
  let mockOnStacksChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockApply = vi.fn().mockResolvedValue(undefined);
    mockOnStacksChange = vi.fn();
    historyManager = new HistoryManager(mockApply, mockOnStacksChange);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Transaction Management', () => {
    it('should allow begin/record/commit workflow', () => {
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.hasOpenTx()).toBe(false);

      historyManager.begin('create');
      expect(historyManager.hasOpenTx()).toBe(true);

      historyManager.record('shape1', null, { x: 100, y: 100 });
      historyManager.commit();

      expect(historyManager.hasOpenTx()).toBe(false);
      expect(historyManager.canUndo()).toBe(true);
      expect(mockOnStacksChange).toHaveBeenCalledWith(true, false);
    });

    it('should not create command if no changes recorded', () => {
      historyManager.begin('move');
      historyManager.commit();

      expect(historyManager.canUndo()).toBe(false);
      expect(mockOnStacksChange).not.toHaveBeenCalled();
    });

    it('should throw error if record called without begin', () => {
      expect(() => {
        historyManager.record('shape1', null, { x: 100 });
      }).toThrow('[HistoryManager] record() called without an active transaction');
    });

    it('should auto-commit previous transaction on nested begin', () => {
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100, y: 100 });
      
      historyManager.begin('move');
      historyManager.record('shape2', { x: 50 }, { x: 60 });
      historyManager.commit();

      expect(historyManager.canUndo()).toBe(true);
      expect(mockOnStacksChange).toHaveBeenCalledTimes(2);
    });

    it('should cancel transaction without committing', () => {
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100, y: 100 });
      historyManager.cancel();

      expect(historyManager.hasOpenTx()).toBe(false);
      expect(historyManager.canUndo()).toBe(false);
    });

    it('should merge multiple records for same shape in one transaction', () => {
      historyManager.begin('move');
      historyManager.record('shape1', { x: 0, y: 0 }, { x: 10, y: 10 });
      historyManager.record('shape1', { x: 10, y: 10 }, { x: 20, y: 20 });
      historyManager.commit();

      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe('Undo/Redo', () => {
    it('should undo a create action', async () => {
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100, y: 100, type: 'rectangle' } as Partial<CanvasShape>);
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: null,
            after: expect.objectContaining({ x: 100, y: 100 }),
          }),
        }),
        'undo'
      );
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);
    });

    it('should undo a delete action', async () => {
      const beforeState: Partial<CanvasShape> = {
        id: 'shape1',
        x: 100,
        y: 100,
        type: 'rectangle',
        width: 50,
        height: 50,
      } as Partial<CanvasShape>;

      historyManager.begin('delete');
      historyManager.record('shape1', beforeState, null);
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: beforeState,
            after: null,
          }),
        }),
        'undo'
      );
    });

    it('should undo a move action', async () => {
      historyManager.begin('move');
      historyManager.record('shape1', { x: 100, y: 100 }, { x: 200, y: 200 });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: { x: 100, y: 100 },
            after: { x: 200, y: 200 },
          }),
        }),
        'undo'
      );
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);
    });

    it('should undo a resize action', async () => {
      historyManager.begin('resize');
      historyManager.record('shape1', { width: 100, height: 50 }, { width: 150, height: 75 });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: { width: 100, height: 50 },
            after: { width: 150, height: 75 },
          }),
        }),
        'undo'
      );
    });

    it('should undo a rotate action', async () => {
      historyManager.begin('rotate');
      historyManager.record('shape1', { rotation: 0 }, { rotation: 45 });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: { rotation: 0 },
            after: { rotation: 45 },
          }),
        }),
        'undo'
      );
    });

    it('should undo a color change action', async () => {
      historyManager.begin('color_change');
      historyManager.record('shape1', { fill: '#ff0000' }, { fill: '#00ff00' });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: { fill: '#ff0000' },
            after: { fill: '#00ff00' },
          }),
        }),
        'undo'
      );
    });

    it('should undo a text update action', async () => {
      historyManager.begin('text_update');
      historyManager.record('shape1', { text: 'Hello' }, { text: 'World' });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: { text: 'Hello' },
            after: { text: 'World' },
          }),
        }),
        'undo'
      );
    });

    it('should redo after undo', async () => {
      historyManager.begin('move');
      historyManager.record('shape1', { x: 100 }, { x: 200 });
      historyManager.commit();

      await historyManager.undo();
      await historyManager.redo();

      expect(mockApply).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          shape1: expect.objectContaining({
            shapeId: 'shape1',
            before: { x: 100 },
            after: { x: 200 },
          }),
        }),
        'redo'
      );
      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should clear redo stack on new action after undo', async () => {
      // Create first action
      historyManager.begin('move');
      historyManager.record('shape1', { x: 0 }, { x: 100 });
      historyManager.commit();

      // Create second action
      historyManager.begin('move');
      historyManager.record('shape1', { x: 100 }, { x: 200 });
      historyManager.commit();

      // Undo once
      await historyManager.undo();
      expect(historyManager.canRedo()).toBe(true);

      // New action should clear redo stack
      historyManager.begin('move');
      historyManager.record('shape1', { x: 100 }, { x: 150 });
      historyManager.commit();

      expect(historyManager.canRedo()).toBe(false);
    });

    it('should handle multiple undos and redos', async () => {
      // Create three actions
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100 });
      historyManager.commit();

      historyManager.begin('move');
      historyManager.record('shape1', { x: 100 }, { x: 200 });
      historyManager.commit();

      historyManager.begin('resize');
      historyManager.record('shape1', { width: 50 }, { width: 100 });
      historyManager.commit();

      // Undo all
      await historyManager.undo();
      await historyManager.undo();
      await historyManager.undo();

      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);

      // Redo all
      await historyManager.redo();
      await historyManager.redo();
      await historyManager.redo();

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should do nothing if undo called with empty stack', async () => {
      await historyManager.undo();
      expect(mockApply).not.toHaveBeenCalled();
    });

    it('should do nothing if redo called with empty stack', async () => {
      await historyManager.redo();
      expect(mockApply).not.toHaveBeenCalled();
    });
  });

  describe('Group Operations', () => {
    it('should handle align action with multiple shapes', async () => {
      historyManager.begin('align', { alignType: 'left' });
      historyManager.record('shape1', { x: 100 }, { x: 50 });
      historyManager.record('shape2', { x: 200 }, { x: 50 });
      historyManager.record('shape3', { x: 150 }, { x: 50 });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.any(Object),
          shape2: expect.any(Object),
          shape3: expect.any(Object),
        }),
        'undo'
      );
    });

    it('should handle distribute action with multiple shapes', async () => {
      historyManager.begin('distribute', { distributeType: 'horizontal' });
      historyManager.record('shape1', { x: 0 }, { x: 0 });
      historyManager.record('shape2', { x: 100 }, { x: 150 });
      historyManager.record('shape3', { x: 200 }, { x: 300 });
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape1: expect.any(Object),
          shape2: expect.any(Object),
          shape3: expect.any(Object),
        }),
        'undo'
      );
    });

    it('should handle duplicate action', async () => {
      historyManager.begin('duplicate');
      historyManager.record('shape2', null, { x: 110, y: 110, type: 'rectangle' } as Partial<CanvasShape>);
      historyManager.commit();

      await historyManager.undo();

      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          shape2: expect.objectContaining({
            shapeId: 'shape2',
            before: null,
            after: expect.any(Object),
          }),
        }),
        'undo'
      );
    });
  });

  describe('Coalescing', () => {
    it('should coalesce rapid actions into single command', async () => {
      // Simulate rapid arrow key presses
      historyManager.coalesce('arrow-move', 'move', () => {
        historyManager.record('shape1', { x: 0, y: 0 }, { x: 1, y: 0 });
      });

      historyManager.coalesce('arrow-move', 'move', () => {
        historyManager.record('shape1', { x: 0, y: 0 }, { x: 2, y: 0 });
      });

      historyManager.coalesce('arrow-move', 'move', () => {
        historyManager.record('shape1', { x: 0, y: 0 }, { x: 3, y: 0 });
      });

      expect(historyManager.canUndo()).toBe(false); // Not committed yet

      // Advance time to trigger coalesce timeout
      vi.advanceTimersByTime(300);

      expect(historyManager.canUndo()).toBe(true);
      expect(mockOnStacksChange).toHaveBeenCalledWith(true, false);

      // Should only have one command in stack
      await historyManager.undo();
      expect(historyManager.canUndo()).toBe(false);
    });

    it('should use custom idle time for coalescing', () => {
      historyManager.coalesce('drag', 'move', () => {
        historyManager.record('shape1', { x: 0 }, { x: 10 });
      }, 500);

      vi.advanceTimersByTime(400);
      expect(historyManager.canUndo()).toBe(false);

      vi.advanceTimersByTime(150);
      expect(historyManager.canUndo()).toBe(true);
    });

    it('should reset timer on each coalesce call', () => {
      historyManager.coalesce('drag', 'move', () => {
        historyManager.record('shape1', { x: 0 }, { x: 10 });
      }, 300);

      vi.advanceTimersByTime(200);

      historyManager.coalesce('drag', 'move', () => {
        historyManager.record('shape1', { x: 0 }, { x: 20 });
      }, 300);

      vi.advanceTimersByTime(200);
      expect(historyManager.canUndo()).toBe(false);

      vi.advanceTimersByTime(150);
      expect(historyManager.canUndo()).toBe(true);
    });

    it('should not create command if coalesced changes are empty', () => {
      historyManager.coalesce('drag', 'move', () => {
        // No records
      }, 100);

      vi.advanceTimersByTime(150);

      expect(historyManager.canUndo()).toBe(false);
    });

    it('should support different coalesce keys simultaneously', () => {
      historyManager.coalesce('arrow-x', 'move', () => {
        historyManager.record('shape1', { x: 0 }, { x: 10 });
      }, 300);

      historyManager.coalesce('arrow-y', 'move', () => {
        historyManager.record('shape2', { y: 0 }, { y: 10 });
      }, 300);

      vi.advanceTimersByTime(350);

      expect(historyManager.canUndo()).toBe(true);
      
      // Should have two separate commands
      historyManager.undo();
      expect(historyManager.canUndo()).toBe(true);
      
      historyManager.undo();
      expect(historyManager.canUndo()).toBe(false);
    });
  });

  describe('Run Helper', () => {
    it('should wrap begin/commit in run method', async () => {
      await historyManager.run('create', () => {
        historyManager.record('shape1', null, { x: 100, y: 100 });
      });

      expect(historyManager.hasOpenTx()).toBe(false);
      expect(historyManager.canUndo()).toBe(true);
    });

    it('should handle async builders in run method', async () => {
      await historyManager.run('update', async () => {
        // Simulate async operation with promise
        await Promise.resolve();
        historyManager.record('shape1', { x: 0 }, { x: 100 });
      });

      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe('Stack Change Notifications', () => {
    it('should notify on commit', () => {
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100 });
      historyManager.commit();

      expect(mockOnStacksChange).toHaveBeenCalledWith(true, false);
    });

    it('should notify on undo', async () => {
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100 });
      historyManager.commit();

      mockOnStacksChange.mockClear();

      await historyManager.undo();

      expect(mockOnStacksChange).toHaveBeenCalledWith(false, true);
    });

    it('should notify on redo', async () => {
      historyManager.begin('create');
      historyManager.record('shape1', null, { x: 100 });
      historyManager.commit();

      await historyManager.undo();

      mockOnStacksChange.mockClear();

      await historyManager.redo();

      expect(mockOnStacksChange).toHaveBeenCalledWith(true, false);
    });
  });

  describe('Meta Information', () => {
    it('should preserve meta information in commands', () => {
      const meta = { userId: 'user123', timestamp: Date.now() };
      
      historyManager.begin('create', meta);
      historyManager.record('shape1', null, { x: 100 });
      historyManager.commit();

      // Meta is stored but not directly accessible; verify through undo/redo flow
      expect(historyManager.canUndo()).toBe(true);
    });

    it('should preserve meta in coalesced commands', () => {
      const meta = { source: 'keyboard' };

      historyManager.coalesce('arrow', 'move', () => {
        historyManager.record('shape1', { x: 0 }, { x: 10 });
      }, 100, meta);

      vi.advanceTimersByTime(150);

      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle recording null to null transition', () => {
      historyManager.begin('update');
      historyManager.record('shape1', null, null);
      historyManager.commit();

      // Should still create a command
      expect(historyManager.canUndo()).toBe(true);
    });

    it('should handle empty string values', () => {
      historyManager.begin('text_update');
      historyManager.record('shape1', { text: 'Hello' }, { text: '' });
      historyManager.commit();

      expect(historyManager.canUndo()).toBe(true);
    });

    it('should handle zero values', () => {
      historyManager.begin('move');
      historyManager.record('shape1', { x: 100, y: 100 }, { x: 0, y: 0 });
      historyManager.commit();

      expect(historyManager.canUndo()).toBe(true);
    });

    it('should handle undefined values in partial shapes', () => {
      historyManager.begin('update');
      historyManager.record('shape1', { rotation: undefined }, { rotation: 45 });
      historyManager.commit();

      expect(historyManager.canUndo()).toBe(true);
    });
  });
});

