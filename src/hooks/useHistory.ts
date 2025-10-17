import { useState, useCallback, useRef } from 'react';
import type { CanvasShape } from '../types/canvas.types';
import type { HistoryAction, ActionType, HistoryState } from '../types/history.types';
import { DEFAULT_MAX_STACK_SIZE } from '../types/history.types';

interface UseHistoryProps {
  userId: string;
  shapes: CanvasShape[];
  onUndo: (action: HistoryAction) => Promise<void>;
  onRedo: (action: HistoryAction) => Promise<void>;
  maxStackSize?: number;
}

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  recordAction: (type: ActionType, affectedShapeIds: string[], beforeState: CanvasShape[], afterState: CanvasShape[]) => void;
  clearHistory: () => void;
  getHistoryState: () => HistoryState;
}

/**
 * Hook for managing undo/redo history
 * Only tracks actions by the current user
 */
// Deprecated legacy hook retained temporarily for backward-compatibility. Not used.
export const useHistory = ({
  userId,
  shapes,
  onUndo,
  onRedo,
  maxStackSize = DEFAULT_MAX_STACK_SIZE,
}: UseHistoryProps): UseHistoryReturn => {
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  const isUndoingRef = useRef(false); // Prevent recording during undo/redo

  /**
   * Record a new action to the undo stack
   */
  const recordAction = useCallback(
    (
      type: ActionType,
      affectedShapeIds: string[],
      beforeState: CanvasShape[],
      afterState: CanvasShape[]
    ) => {
      // Don't record if we're currently undoing/redoing
      if (isUndoingRef.current) {
        console.log('[useHistory] Skipping record - currently undoing/redoing');
        return;
      }

      // Check if before and after states are actually different
      const hasRealChanges = affectedShapeIds.some(shapeId => {
        const before = beforeState.find(s => s.id === shapeId);
        const after = afterState.find(s => s.id === shapeId);
        
        // If one exists but not the other, it's a real change (create/delete)
        if (!before || !after) return true;
        
        // Check if any meaningful properties changed
        return before.x !== after.x ||
               before.y !== after.y ||
               before.color !== after.color ||
               before.rotation !== after.rotation ||
               ('width' in before && 'width' in after && before.width !== after.width) ||
               ('height' in before && 'height' in after && before.height !== after.height) ||
               ('radius' in before && 'radius' in after && before.radius !== after.radius) ||
               ('text' in before && 'text' in after && before.text !== after.text) ||
               ('fontSize' in before && 'fontSize' in after && before.fontSize !== after.fontSize);
      });

      if (!hasRealChanges) {
        console.log('[useHistory] Skipping record - no meaningful changes detected');
        return;
      }

      const action: HistoryAction = {
        id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type,
        timestamp: Date.now(),
        userId,
        beforeState,
        afterState,
        affectedShapeIds,
      };

      console.log('[useHistory] Recording action:', type, 'shapes:', affectedShapeIds, 'changes verified');

      setUndoStack((prev) => {
        const newStack = [...prev, action];
        // Limit stack size
        if (newStack.length > maxStackSize) {
          return newStack.slice(-maxStackSize);
        }
        console.log('[useHistory] Undo stack size:', newStack.length);
        return newStack;
      });

      // Clear redo stack when new action is recorded
      setRedoStack([]);
    },
    [userId, maxStackSize]
  );

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    if (undoStack.length === 0) {
      console.log('[useHistory] Cannot undo - undo stack is empty');
      return;
    }

    const action = undoStack[undoStack.length - 1];
    console.log('[useHistory] Undoing action:', action.type, 'id:', action.id);
    
    // Set flag to prevent recording during undo
    isUndoingRef.current = true;

    try {
      await onUndo(action);

      // Move action from undo to redo stack
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, action]);
      console.log('[useHistory] Undo successful');
    } catch (error) {
      console.error('Failed to undo action:', error);
    } finally {
      isUndoingRef.current = false;
    }
  }, [undoStack, onUndo]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async () => {
    if (redoStack.length === 0) {
      console.log('[useHistory] Cannot redo - redo stack is empty');
      return;
    }

    const action = redoStack[redoStack.length - 1];
    console.log('[useHistory] Redoing action:', action.type, 'id:', action.id);

    // Set flag to prevent recording during redo
    isUndoingRef.current = true;

    try {
      await onRedo(action);

      // Move action from redo to undo stack
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, action]);
      console.log('[useHistory] Redo successful');
    } catch (error) {
      console.error('Failed to redo action:', error);
    } finally {
      isUndoingRef.current = false;
    }
  }, [redoStack, onRedo]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /**
   * Get current history state
   */
  const getHistoryState = useCallback((): HistoryState => {
    return {
      undoStack,
      redoStack,
      maxStackSize,
    };
  }, [undoStack, redoStack, maxStackSize]);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undo,
    redo,
    recordAction,
    clearHistory,
    getHistoryState,
  };
};

