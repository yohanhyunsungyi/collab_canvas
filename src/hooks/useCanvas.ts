import { useState, useCallback, useRef } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';
import * as canvasService from '../services/canvas.service';
import type { ShapeChangeEvent } from '../services/canvas.service';
import type { ActionType } from '../types/history.types';
import { HistoryManager, type ChangeSet } from '../history/historyManager';

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
  addShape: (
    shape: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>,
    userId: string,
    overrideId?: string
  ) => Promise<void>;
  updateShape: (id: string, updates: Partial<CanvasShape>) => Promise<void>;
  removeShape: (id: string) => Promise<void>;
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
  historyBegin: (type: ActionType, meta?: Record<string, unknown>) => void;
  historyRecord: (shapeId: string, before: Partial<CanvasShape> | null, after: Partial<CanvasShape> | null) => void;
  historyCommit: () => void;
  historyCoalesce: (key: string, type: ActionType, builder: () => void, idleMs?: number, meta?: Record<string, unknown>) => void;
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
  
  // History manager integration
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);

  const applyChangeSet = useCallback(async (changes: ChangeSet, direction: 'undo' | 'redo') => {
    // Apply via Firestore service; real-time listener will sync local state
    for (const change of Object.values(changes)) {
      const { shapeId, before, after } = change;
      if (direction === 'undo') {
        if (before === null && after !== null) {
          // Undo a creation → delete
          await canvasService.deleteShape(shapeId);
        } else if (before !== null && after === null) {
          // Undo a deletion → recreate (expects full shape in before)
          await canvasService.createShape(before as CanvasShape);
        } else if (before !== null && after !== null) {
          // Undo an update → restore previous fields
          await canvasService.updateShape(shapeId, before);
        }
      } else {
        if (before === null && after !== null) {
          // Redo a creation → create
          await canvasService.createShape(after as CanvasShape);
        } else if (before !== null && after === null) {
          // Redo a deletion → delete again
          await canvasService.deleteShape(shapeId);
        } else if (before !== null && after !== null) {
          // Redo an update → apply after fields
          await canvasService.updateShape(shapeId, after);
        }
      }
    }
  }, []);

  const historyRef = useRef<HistoryManager | null>(null);
  if (!historyRef.current) {
    historyRef.current = new HistoryManager(applyChangeSet, (canUndo, canRedo) => {
      setCanUndoState(canUndo);
      setCanRedoState(canRedo);
    });
  }

  // History helpers
  const historyBegin = useCallback((type: ActionType, meta?: Record<string, unknown>) => {
    historyRef.current?.begin(type, meta);
  }, []);

  const historyRecord = useCallback((shapeId: string, before: Partial<CanvasShape> | null, after: Partial<CanvasShape> | null) => {
    historyRef.current?.record(shapeId, before, after);
  }, []);

  const historyCommit = useCallback(() => {
    historyRef.current?.commit();
  }, []);

  const historyCoalesce = useCallback((key: string, type: ActionType, builder: () => void, idleMs = 250, meta?: Record<string, unknown>) => {
    historyRef.current?.coalesce(key, type, builder, idleMs, meta);
  }, []);

  // Add a new shape to the canvas and persist it to Firestore
  const addShape = useCallback(async (
    shapeData: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>,
    userId: string,
    overrideId?: string
  ) => {
    // Create the full shape object with metadata
    const newShape: CanvasShape = {
      ...shapeData,
      id: overrideId ?? `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
        return [...prevShapes, newShape];
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
  }, []);

  // Update an existing shape and persist it to Firestore
  const updateShape = useCallback(async (id: string, updates: Partial<CanvasShape>) => {
    let originalShape: CanvasShape | undefined = shapes.find(s => s.id === id);
    setShapes((prevShapes) => {
      return prevShapes.map((shape) => 
        shape.id === id ? { ...shape, ...updates } as CanvasShape : shape
      );
    });
    
    try {
      await canvasService.updateShape(id, updates);
    } catch (error) {
      console.error("Failed to update shape:", error);
      setError('Failed to update shape. Please check your connection.');
      // Revert optimistic update on failure
      if (originalShape) {
        setShapes((prev) => prev.map((shape) => shape.id === id ? originalShape! : shape));
      }
    }
  }, [shapes]);

  // Remove a shape from the canvas and delete from Firestore
  const removeShape = useCallback(async (id: string) => {
    setShapes((prevShapes) => {
      return prevShapes.filter(s => s.id !== id);
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
  }, []);

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
    setSelectedShapeIds(() => {
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
      // Batch as one history transaction
      historyBegin('duplicate');
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

        const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const afterShape: CanvasShape = {
          ...(shapeData as any),
          id: newId,
          createdBy: userId,
          createdAt: Date.now(),
          lastModifiedBy: userId,
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        } as CanvasShape;
        historyRecord(newId, null, afterShape);
        await addShape(shapeData as any, userId, newId);
      }
      historyCommit();
    } catch (error) {
      console.error("Failed to duplicate shapes:", error);
      setError('Failed to duplicate shapes. Please check your connection.');
    }
  }, [shapes, selectedShapeIds, addShape, historyBegin, historyRecord, historyCommit]);
  
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
    
    // Create copies for each clipboard shape as one transaction
    historyBegin('duplicate');
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
        const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const afterShape: CanvasShape = {
          ...(shapeData as any),
          id: newId,
          createdBy: userId,
          createdAt: Date.now(),
          lastModifiedBy: userId,
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        } as CanvasShape;
        historyRecord(newId, null, afterShape);
        await addShape(shapeData as any, userId, newId);
        console.log(`[useCanvas] Pasted shape: ${shape.type}`);
      } catch (error) {
        console.error("Failed to paste shape:", error);
        setError('Failed to paste shapes. Please check your connection.');
      }
    }
    historyCommit();
    console.log(`[useCanvas] Successfully pasted ${clipboard.length} shapes`);
  }, [clipboard, addShape, historyBegin, historyRecord, historyCommit]);

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
    historyBegin,
    historyRecord,
    historyCommit,
    historyCoalesce,
    canUndo: canUndoState,
    canRedo: canRedoState,
    undo: () => historyRef.current?.undo() ?? Promise.resolve(),
    redo: () => historyRef.current?.redo() ?? Promise.resolve(),
    
    // Clipboard
    clipboard,
    copySelectedShapes,
    pasteShapes,
  };
};

