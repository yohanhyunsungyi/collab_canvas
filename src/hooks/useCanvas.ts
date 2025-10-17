import { useState, useCallback, useRef } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';
import * as canvasService from '../services/canvas.service';
import type { ShapeChangeEvent } from '../services/canvas.service';
import { useHistory } from './useHistory';
import type { ActionType, HistoryAction } from '../types/history.types';

interface UseCanvasProps {
  userId?: string; // User ID for tracking history
}

interface UseCanvasReturn {
  // Canvas objects state
  shapes: CanvasShape[];
  setShapes: (shapes: CanvasShape[]) => void; // Added for initial load
  selectedShapeIds: string[]; // Changed from selectedShapeId for multi-select
  
  // Tool and style state
  currentTool: ToolType;
  currentColor: string;
  currentFontSize: number;
  
  // Error state
  error: string | null;
  clearError: () => void;
  
  // Shape management functions
  addShape: (shape: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>, userId: string, recordHistory?: boolean) => Promise<void>;
  updateShape: (id: string, updates: Partial<CanvasShape>, recordHistory?: boolean) => void;
  removeShape: (id: string, recordHistory?: boolean) => void;
  selectShape: (id: string | null) => void; // Select single shape (clears others)
  toggleShapeSelection: (id: string) => void; // Add/remove from selection (for shift-click)
  clearSelection: () => void; // Clear all selections
  selectShapesInArea: (x1: number, y1: number, x2: number, y2: number) => void; // Select shapes within rectangle
  duplicateSelectedShapes: (userId: string) => Promise<void>; // Duplicate selected shapes
  applyShapeChanges: (changes: ShapeChangeEvent[]) => void; // Handle real-time changes
  
  // Tool and style handlers
  setCurrentTool: (tool: ToolType) => void;
  setCurrentColor: (color: string) => void;
  setCurrentFontSize: (fontSize: number) => void;
  
  // History (undo/redo)
  recordHistoryAction: (type: ActionType, affectedShapeIds: string[], beforeState: CanvasShape[], afterState: CanvasShape[]) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  
  // Clipboard
  clipboard: CanvasShape[];
  copySelectedShapes: () => void;
  pasteShapes: (userId: string) => Promise<void>;
}

/**
 * Custom hook for managing canvas state
 * Handles shapes, selection, tools, colors, undo/redo, and clipboard
 */
export const useCanvas = ({ userId = '' }: UseCanvasProps = {}): UseCanvasReturn => {
  // Canvas objects state
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]); // Changed to array for multi-select
  
  // Tool and style state
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [currentColor, setCurrentColor] = useState<string>(USER_COLORS[0]);
  const [currentFontSize, setCurrentFontSize] = useState<number>(24);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Clipboard state
  const [clipboard, setClipboard] = useState<CanvasShape[]>([]);
  
  // Track if we're applying history action (to prevent recursive recording)
  const isApplyingHistoryRef = useRef(false);

  /**
   * Handler for undo action
   */
  const handleUndo = useCallback(async (action: HistoryAction) => {
    if (!action.beforeState) return;
    
    isApplyingHistoryRef.current = true;
    console.log('[useCanvas] Undoing action:', action.type, 'affecting shapes:', action.affectedShapeIds);
    
    try {
      // Restore the before state
      const affectedIds = action.affectedShapeIds;
      
      // Update Firestore for each affected shape
      for (const shapeId of affectedIds) {
        const beforeShape = action.beforeState.find(s => s.id === shapeId);
        const afterShape = action.afterState?.find(s => s.id === shapeId);
        
        // Shape was created -> delete it
        if (!beforeShape && afterShape) {
          console.log('[useCanvas] Undo: Deleting created shape', shapeId);
          await canvasService.deleteShape(shapeId);
          // Real-time listener will update local state
        }
        // Shape was deleted -> recreate it
        else if (beforeShape && !afterShape) {
          console.log('[useCanvas] Undo: Recreating deleted shape', shapeId);
          await canvasService.createShape(beforeShape);
          // Real-time listener will update local state
        }
        // Shape was modified -> restore previous state
        else if (beforeShape) {
          console.log('[useCanvas] Undo: Restoring modified shape', shapeId);
          await canvasService.updateShape(shapeId, beforeShape);
          // Real-time listener will update local state
        }
      }
      console.log('[useCanvas] Undo completed successfully');
    } catch (error) {
      console.error('Failed to undo action:', error);
      setError('Failed to undo. Please check your connection.');
    } finally {
      isApplyingHistoryRef.current = false;
    }
  }, []);

  /**
   * Handler for redo action
   */
  const handleRedo = useCallback(async (action: HistoryAction) => {
    if (!action.afterState) return;
    
    isApplyingHistoryRef.current = true;
    console.log('[useCanvas] Redoing action:', action.type, 'affecting shapes:', action.affectedShapeIds);
    
    try {
      // Restore the after state
      const affectedIds = action.affectedShapeIds;
      
      // Update Firestore for each affected shape
      for (const shapeId of affectedIds) {
        const beforeShape = action.beforeState?.find(s => s.id === shapeId);
        const afterShape = action.afterState.find(s => s.id === shapeId);
        
        // Shape was created -> recreate it
        if (!beforeShape && afterShape) {
          console.log('[useCanvas] Redo: Recreating created shape', shapeId);
          await canvasService.createShape(afterShape);
          // Real-time listener will update local state
        }
        // Shape was deleted -> delete it again
        else if (beforeShape && !afterShape) {
          console.log('[useCanvas] Redo: Deleting shape again', shapeId);
          await canvasService.deleteShape(shapeId);
          // Real-time listener will update local state
        }
        // Shape was modified -> restore after state
        else if (afterShape) {
          console.log('[useCanvas] Redo: Restoring modified shape', shapeId);
          await canvasService.updateShape(shapeId, afterShape);
          // Real-time listener will update local state
        }
      }
      console.log('[useCanvas] Redo completed successfully');
    } catch (error) {
      console.error('Failed to redo action:', error);
      setError('Failed to redo. Please check your connection.');
    } finally {
      isApplyingHistoryRef.current = false;
    }
  }, []);

  // Initialize history hook
  const history = useHistory({
    userId,
    shapes,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  /**
   * Helper to record action in history
   */
  const recordHistoryAction = useCallback(
    (type: ActionType, affectedShapeIds: string[], beforeState: CanvasShape[], afterState: CanvasShape[]) => {
      if (isApplyingHistoryRef.current || !userId) {
        console.log('[useCanvas] Skipping history record:', isApplyingHistoryRef.current ? 'applying history' : 'no user');
        return;
      }
      console.log('[useCanvas] Recording history action:', type, 'for shapes:', affectedShapeIds);
      console.log('[useCanvas] Before state length:', beforeState.length, 'After state length:', afterState.length);
      history.recordAction(type, affectedShapeIds, beforeState, afterState);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId] // history는 의도적으로 제외 (무한 루프 방지)
  );

  // Add a new shape to the canvas and persist it to Firestore
  const addShape = useCallback(async (
    shapeData: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>,
    userId: string,
    recordHistory = true
  ) => {
    // Create the full shape object with metadata
    const newShape: CanvasShape = {
      ...shapeData,
      id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdBy: userId,
      createdAt: Date.now(),
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    } as CanvasShape; // Explicitly cast to handle union type

    console.log('[useCanvas] Creating shape:', newShape.id, newShape.type);
    
    try {
      // Optimistic update: Add to local state immediately for better UX
      setShapes(prevShapes => {
        const beforeState = [...prevShapes];
        const afterState = [...prevShapes, newShape];
        
        // Record in history
        if (recordHistory && !isApplyingHistoryRef.current) {
          recordHistoryAction('create', [newShape.id], beforeState, afterState);
        }
        
        return afterState;
      });

      // Persist to Firestore (real-time listener will sync across users)
      await canvasService.createShape(newShape);
      console.log('[useCanvas] Shape created successfully:', newShape.id);
    } catch (error) {
      console.error("Failed to add shape:", error);
      setError('Failed to create shape. Please check your connection.');
      // Rollback optimistic update on error
      setShapes(prevShapes => prevShapes.filter(s => s.id !== newShape.id));
    }
  }, [recordHistoryAction]);

  // Update an existing shape and persist it to Firestore
  const updateShape = useCallback(async (id: string, updates: Partial<CanvasShape>, recordHistory = true) => {
    setShapes((prevShapes) => {
      // Check if this is a meaningful update (not just metadata)
      const isMeaningfulUpdate = recordHistory && (
        updates.x !== undefined ||
        updates.y !== undefined ||
        updates.color !== undefined ||
        updates.rotation !== undefined ||
        'width' in updates ||
        'height' in updates ||
        'radius' in updates ||
        'text' in updates ||
        'fontSize' in updates
      );
      
      const originalShape = prevShapes.find(s => s.id === id);
      const beforeState = [...prevShapes];
      const afterState = prevShapes.map((shape) => 
        shape.id === id ? { ...shape, ...updates } as CanvasShape : shape
      );
      
      // Record in history only for meaningful updates
      if (isMeaningfulUpdate && originalShape && !isApplyingHistoryRef.current) {
        recordHistoryAction('update', [id], beforeState, afterState);
      }
      
      return afterState;
    });
    
    try {
      await canvasService.updateShape(id, updates);
    } catch (error) {
      console.error("Failed to update shape:", error);
      setError('Failed to update shape. Please check your connection.');
      // Revert optimistic update on failure
      if (originalShape) {
        setShapes((prev) =>
          prev.map((shape) => 
            shape.id === id ? originalShape! : shape
          )
        );
      }
    }
  }, [recordHistoryAction]);

  // Remove a shape from the canvas and delete from Firestore
  const removeShape = useCallback(async (id: string, recordHistory = true) => {
    setShapes((prevShapes) => {
      const beforeState = [...prevShapes];
      const shapeToDelete = prevShapes.find(s => s.id === id);
      const afterState = prevShapes.filter(s => s.id !== id);
      
      // Record in history before deletion
      if (recordHistory && shapeToDelete && !isApplyingHistoryRef.current) {
        recordHistoryAction('delete', [id], beforeState, afterState);
      }
      
      return afterState;
    });
    
    // Clear selection if the removed shape was selected
    setSelectedShapeIds((prev) => prev.filter(shapeId => shapeId !== id));
    
    try {
      // Delete from Firestore
      await canvasService.deleteShape(id);
    } catch (error) {
      console.error("Failed to delete shape:", error);
      setError('Failed to delete shape. Please check your connection.');
      // Note: The shape will reappear via onSnapshot if deletion failed
    }
  }, [recordHistoryAction]);

  // Select a single shape (clears other selections)
  const selectShape = useCallback((id: string | null) => {
    setSelectedShapeIds(id ? [id] : []);
  }, []);

  // Toggle shape selection (for shift-click multi-select)
  const toggleShapeSelection = useCallback((id: string) => {
    setSelectedShapeIds((prev) => {
      if (prev.includes(id)) {
        // Remove from selection
        return prev.filter(shapeId => shapeId !== id);
      } else {
        // Add to selection
        return [...prev, id];
      }
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);

  // Select shapes within a rectangular area (for drag-to-select)
  const selectShapesInArea = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    setSelectedShapeIds(prevSelectedIds => {
      // Normalize coordinates (handle dragging in any direction)
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const maxX = Math.max(x1, x2);
      const maxY = Math.max(y1, y2);

      // Find all shapes that intersect with the selection rectangle
      const shapesInArea = shapes.filter(shape => {
        let shapeMinX: number, shapeMinY: number, shapeMaxX: number, shapeMaxY: number;

        if (shape.type === 'rectangle') {
          shapeMinX = shape.x;
          shapeMinY = shape.y;
          shapeMaxX = shape.x + shape.width;
          shapeMaxY = shape.y + shape.height;
        } else if (shape.type === 'circle') {
          shapeMinX = shape.x - shape.radius;
          shapeMinY = shape.y - shape.radius;
          shapeMaxX = shape.x + shape.radius;
          shapeMaxY = shape.y + shape.radius;
        } else if (shape.type === 'image') {
          // For images, use width and height
          shapeMinX = shape.x;
          shapeMinY = shape.y;
          shapeMaxX = shape.x + shape.width;
          shapeMaxY = shape.y + shape.height;
        } else if (shape.type === 'text') {
          // For text, use approximate bounding box
          const estimatedWidth = shape.width || shape.text.length * shape.fontSize * 0.6;
          const estimatedHeight = shape.height || shape.fontSize * 1.2;
          shapeMinX = shape.x;
          shapeMinY = shape.y;
          shapeMaxX = shape.x + estimatedWidth;
          shapeMaxY = shape.y + estimatedHeight;
        } else {
          return false;
        }

        // Check if shape bounding box intersects with selection rectangle
        const intersects = !(
          shapeMaxX < minX || // Shape is to the left of selection
          shapeMinX > maxX || // Shape is to the right of selection
          shapeMaxY < minY || // Shape is above selection
          shapeMinY > maxY    // Shape is below selection
        );

        return intersects;
      });

      // Return new selection
      return shapesInArea.map(shape => shape.id);
    });
  }, [shapes]);

  // Duplicate selected shapes
  const duplicateSelectedShapes = useCallback(async (userId: string) => {
    if (selectedShapeIds.length === 0) return;

    const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
    const duplicateOffset = 20; // Offset duplicates by 20px

    try {
      // Create duplicates for each selected shape using addShape
      for (const shape of selectedShapes) {
        let shapeData;

        if (shape.type === 'rectangle') {
          shapeData = {
            type: 'rectangle' as const,
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            width: shape.width,
            height: shape.height,
            color: shape.color,
            rotation: shape.rotation || 0,
          };
        } else if (shape.type === 'circle') {
          shapeData = {
            type: 'circle' as const,
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            radius: shape.radius,
            color: shape.color,
            rotation: shape.rotation || 0,
          };
        } else if (shape.type === 'text') {
          shapeData = {
            type: 'text' as const,
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            text: shape.text,
            fontSize: shape.fontSize,
            color: shape.color,
            rotation: shape.rotation || 0,
          };
        } else if (shape.type === 'image') {
          shapeData = {
            type: 'image' as const,
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            width: shape.width,
            height: shape.height,
            src: shape.src,
            color: shape.color,
            rotation: shape.rotation || 0,
          };
        } else {
          continue; // Skip unknown types
        }

        // Use addShape which handles Firestore and history automatically
        await addShape(shapeData, userId, true);
      }
    } catch (error) {
      console.error("Failed to duplicate shapes:", error);
      setError('Failed to duplicate shapes. Please check your connection.');
    }
  }, [shapes, selectedShapeIds, addShape]);
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Apply real-time shape changes from Firestore
  const applyShapeChanges = useCallback((changes: ShapeChangeEvent[]) => {
    const startTime = performance.now();
    
    console.log('[useCanvas] applyShapeChanges called with', changes.length, 'changes');
    
    setShapes((prevShapes) => {
      console.log('[useCanvas] Current shapes count:', prevShapes.length);
      let updatedShapes = [...prevShapes];
      let addedCount = 0;
      let modifiedCount = 0;
      let removedCount = 0;
      let skippedDuplicates = 0;
      
      changes.forEach((change) => {
        const { type, shape } = change;
        
        if (type === 'added') {
          // Add new shape if it doesn't already exist (prevent duplicates)
          const exists = updatedShapes.some((s) => s.id === shape.id);
          if (!exists) {
            updatedShapes.push(shape);
            addedCount++;
            console.log(`[useCanvas] Added shape from real-time update: ${shape.id} (${shape.type})`);
          } else {
            skippedDuplicates++;
            console.log(`[useCanvas] Skipped duplicate shape: ${shape.id} (already in state)`);
          }
        } else if (type === 'modified') {
          // Update existing shape
          updatedShapes = updatedShapes.map((s) =>
            s.id === shape.id ? shape : s
          );
          modifiedCount++;
          console.log(`[useCanvas] Modified shape from real-time update: ${shape.id}`);
        } else if (type === 'removed') {
          // Remove shape
          updatedShapes = updatedShapes.filter((s) => s.id !== shape.id);
          removedCount++;
          console.log(`[useCanvas] Removed shape from real-time update: ${shape.id}`);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`[useCanvas] Applied ${changes.length} changes in ${duration.toFixed(2)}ms (added: ${addedCount}, modified: ${modifiedCount}, removed: ${removedCount}, skipped: ${skippedDuplicates})`);
      console.log('[useCanvas] New shapes count:', updatedShapes.length);
      
      return updatedShapes;
    });
    
    // Clear selection for any removed shapes
    changes.forEach((change) => {
      if (change.type === 'removed') {
        setSelectedShapeIds((prev) => prev.filter(id => id !== change.shape.id));
      }
    });
  }, []);

  /**
   * Copy selected shapes to clipboard
   */
  const copySelectedShapes = useCallback(() => {
    const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
    console.log('[useCanvas] Copying', selectedShapes.length, 'shapes to clipboard');
    setClipboard(selectedShapes);
  }, [shapes, selectedShapeIds]);

  /**
   * Paste shapes from clipboard
   */
  const pasteShapes = useCallback(async (userId: string) => {
    if (clipboard.length === 0) return;

    const pasteOffset = 20; // Offset pasted shapes by 20px

    console.log(`[useCanvas] Pasting ${clipboard.length} shapes...`);
    
    // Create copies for each clipboard shape using addShape
    for (const shape of clipboard) {
      let shapeData;

      if (shape.type === 'rectangle') {
        shapeData = {
          type: 'rectangle' as const,
          x: shape.x + pasteOffset,
          y: shape.y + pasteOffset,
          width: shape.width,
          height: shape.height,
          color: shape.color,
          rotation: shape.rotation || 0,
        };
      } else if (shape.type === 'circle') {
        shapeData = {
          type: 'circle' as const,
          x: shape.x + pasteOffset,
          y: shape.y + pasteOffset,
          radius: shape.radius,
          color: shape.color,
          rotation: shape.rotation || 0,
        };
      } else if (shape.type === 'text') {
        shapeData = {
          type: 'text' as const,
          x: shape.x + pasteOffset,
          y: shape.y + pasteOffset,
          text: shape.text,
          fontSize: shape.fontSize,
          color: shape.color,
          rotation: shape.rotation || 0,
        };
      } else if (shape.type === 'image') {
        shapeData = {
          type: 'image' as const,
          x: shape.x + pasteOffset,
          y: shape.y + pasteOffset,
          width: shape.width,
          height: shape.height,
          src: shape.src,
          color: shape.color,
          rotation: shape.rotation || 0,
        };
      } else {
        continue; // Skip unknown types
      }

      try {
        // Use addShape which handles Firestore and history automatically
        await addShape(shapeData, userId, true);
        console.log(`[useCanvas] Pasted shape: ${shape.type}`);
      } catch (error) {
        console.error("Failed to paste shape:", error);
        setError('Failed to paste shapes. Please check your connection.');
      }
    }

    console.log(`[useCanvas] Successfully pasted ${clipboard.length} shapes`);
  }, [clipboard, addShape]);

  return {
    // State
    shapes,
    setShapes, // Added for initial load
    selectedShapeIds, // Changed from selectedShapeId
    currentTool,
    currentColor,
    currentFontSize,
    
    // Error state
    error,
    clearError,
    
    // Shape management
    addShape,
    updateShape,
    removeShape,
    selectShape, // Select single shape
    toggleShapeSelection, // Toggle selection for shift-click
    clearSelection, // Clear all selections
    selectShapesInArea, // Select shapes in rectangular area
    duplicateSelectedShapes, // Duplicate selected shapes
    applyShapeChanges, // Handle real-time changes
    
    // Tool and style
    setCurrentTool,
    setCurrentColor,
    setCurrentFontSize,
    
    // History (undo/redo)
    recordHistoryAction, // Manual history recording
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    
    // Clipboard
    clipboard,
    copySelectedShapes,
    pasteShapes,
  };
};

