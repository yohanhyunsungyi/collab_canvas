import { useState, useCallback, useRef } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';
import * as canvasService from '../services/canvas.service';
import type { ShapeChangeEvent } from '../services/canvas.service';
import type { ActionType } from '../types/history.types';
import { HistoryManager, type ChangeSet } from '../history/historyManager';
import * as zIndexUtils from '../utils/zindex.utils';
import * as alignmentUtils from '../utils/alignment.utils';

interface UseCanvasProps {
  userId?: string; // User ID for tracking history
}

interface UseCanvasReturn {
  // Canvas objects state
  shapes: CanvasShape[];
  setShapes: (shapes: CanvasShape[] | ((prev: CanvasShape[]) => CanvasShape[])) => void; // Added for initial load, supports functional updates
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
  updateMultipleShapes: (updates: Array<{ id: string; updates: Partial<CanvasShape> }>) => Promise<void>;
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
  commitChangeSet: (type: ActionType, changes: ChangeSet, meta?: Record<string, unknown>) => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  
  // Clipboard
  clipboard: CanvasShape[];
  copySelectedShapes: () => void;
  pasteShapes: (userId: string) => Promise<void>;
  
  // Z-Index operations
  bringToFront: () => Promise<void>;
  sendToBack: () => Promise<void>;
  bringForward: () => Promise<void>;
  sendBackward: () => Promise<void>;
  
  // Alignment operations
  alignLeft: () => Promise<void>;
  alignRight: () => Promise<void>;
  alignTop: () => Promise<void>;
  alignBottom: () => Promise<void>;
  alignCenterHorizontal: () => Promise<void>;
  alignMiddleVertical: () => Promise<void>;
  distributeHorizontally: () => Promise<void>;
  distributeVertically: () => Promise<void>;
}

/**
 * Custom hook for managing canvas state
 * Handles shapes, selection, tools, colors, undo/redo, and clipboard
 */
export const useCanvas = ({ userId: initialUserId = '' }: UseCanvasProps = {}): UseCanvasReturn => {
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
    // Batch-apply changes via service for a single snapshot/render
    await canvasService.applyDirectionalChangeSet(changes, direction);
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

  // Commit a batch of changes as a single history command and single Firestore batch
  const commitChangeSet = useCallback(async (type: ActionType, changes: ChangeSet, meta?: Record<string, unknown>) => {
    historyBegin(type, meta);
    for (const change of Object.values(changes)) {
      historyRecord(change.shapeId, change.before, change.after);
    }
    historyCommit();
    await canvasService.applyChangeSet(changes);
  }, [historyBegin, historyRecord, historyCommit]);

  // Add a new shape to the canvas and persist it to Firestore
  const addShape = useCallback(async (
    shapeData: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>,
    userId: string,
    overrideId?: string
  ) => {
    const effectiveUserId = userId ?? (initialUserId as string);
    
    // Calculate next zIndex (highest current zIndex + 1, or 0 if no shapes)
    const maxZIndex = shapes.length > 0 
      ? Math.max(...shapes.map(s => s.zIndex ?? 0)) 
      : -1;
    const nextZIndex = shapeData.zIndex ?? (maxZIndex + 1);
    
    // Create the full shape object with metadata
    const newShape: CanvasShape = {
      ...shapeData,
      id: overrideId ?? `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      zIndex: nextZIndex,
      createdBy: effectiveUserId,
      createdAt: Date.now(),
      lastModifiedBy: effectiveUserId,
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

  // Update multiple shapes in a batch (optimized for group operations)
  const updateMultipleShapes = useCallback(async (
    updates: Array<{ id: string; updates: Partial<CanvasShape> }>
  ) => {
    const startTime = performance.now();
    console.log(`[useCanvas] Batch updating ${updates.length} shapes`);
    
    // Store original shapes for rollback
    const originalShapes = new Map<string, CanvasShape>();
    updates.forEach(({ id }) => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        originalShapes.set(id, { ...shape });
      }
    });
    
    // Optimistic update: Apply all changes at once
    setShapes((prevShapes) => {
      return prevShapes.map((shape) => {
        const update = updates.find(u => u.id === shape.id);
        return update ? { ...shape, ...update.updates } as CanvasShape : shape;
      });
    });
    
    try {
      // Single batch write to Firestore
      await canvasService.updateMultipleShapesInBatch(updates);
      const elapsed = performance.now() - startTime;
      console.log(`[useCanvas] Batch update completed in ${elapsed.toFixed(2)}ms`);
    } catch (error) {
      console.error("Failed to batch update shapes:", error);
      setError('Failed to update shapes. Please check your connection.');
      
      // Revert all updates on failure
      setShapes((prev) =>
        prev.map((shape) => originalShapes.get(shape.id) || shape)
      );
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
      const changes: ChangeSet = {};
      // Calculate base zIndex for duplicated shapes
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex ?? 0)) : -1;

      let zIndexOffset = 0;
      for (const shape of selectedShapes) {
        const nextZIndex = maxZIndex + 1 + zIndexOffset;
        zIndexOffset++;

        if (shape.type === 'rectangle') {
          const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'rectangle',
              x: shape.x + duplicateOffset,
              y: shape.y + duplicateOffset,
              width: shape.width,
              height: shape.height,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        } else if (shape.type === 'circle') {
          const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'circle',
              x: shape.x + duplicateOffset,
              y: shape.y + duplicateOffset,
              radius: shape.radius,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        } else if (shape.type === 'text') {
          const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'text',
              x: shape.x + duplicateOffset,
              y: shape.y + duplicateOffset,
              text: shape.text,
              fontSize: shape.fontSize,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        } else if (shape.type === 'image') {
          const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'image',
              x: shape.x + duplicateOffset,
              y: shape.y + duplicateOffset,
              width: shape.width,
              height: shape.height,
              src: shape.src,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        }
      }
      await commitChangeSet('duplicate', changes);
    } catch (error) {
      console.error("Failed to duplicate shapes:", error);
      setError('Failed to duplicate shapes. Please check your connection.');
    }
  }, [shapes, selectedShapeIds, commitChangeSet]);
  
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
      
      // OPTIMIZED: Use Map for O(1) lookups instead of O(n) array operations
      const shapeMap = new Map<string, CanvasShape>();
      prevShapes.forEach(shape => shapeMap.set(shape.id, shape));
      
      let addedCount = 0;
      let modifiedCount = 0;
      let removedCount = 0;
      let skippedDuplicates = 0;
      
      // Process all changes using Map operations (much faster for bulk updates)
      changes.forEach((change) => {
        const { type, shape } = change;
        
        if (type === 'added') {
          // Add new shape if it doesn't already exist (prevent duplicates)
          if (!shapeMap.has(shape.id)) {
            shapeMap.set(shape.id, shape);
            addedCount++;
            console.log(`[useCanvas] Added shape from real-time update: ${shape.id} (${shape.type})`);
          } else {
            skippedDuplicates++;
            console.log(`[useCanvas] Skipped duplicate shape: ${shape.id} (already in state)`);
          }
        } else if (type === 'modified') {
          // Update existing shape (O(1) Map operation)
          if (shapeMap.has(shape.id)) {
            shapeMap.set(shape.id, shape);
            modifiedCount++;
            console.log(`[useCanvas] Modified shape from real-time update: ${shape.id}`);
          }
        } else if (type === 'removed') {
          // Remove shape (O(1) Map operation)
          if (shapeMap.has(shape.id)) {
            shapeMap.delete(shape.id);
            removedCount++;
            console.log(`[useCanvas] Removed shape from real-time update: ${shape.id}`);
          }
        }
      });
      
      // Convert Map back to array
      const updatedShapes = Array.from(shapeMap.values());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`[useCanvas] Applied ${changes.length} changes in ${duration.toFixed(2)}ms (added: ${addedCount}, modified: ${modifiedCount}, removed: ${removedCount}, skipped: ${skippedDuplicates})`);
      console.log('[useCanvas] New shapes count:', updatedShapes.length);
      
      return updatedShapes;
    });
    
    // Clear selection for any removed shapes
    const removedIds = changes.filter(c => c.type === 'removed').map(c => c.shape.id);
    if (removedIds.length > 0) {
      setSelectedShapeIds((prev) => prev.filter(id => !removedIds.includes(id)));
    }
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
    try {
      const changes: ChangeSet = {};
      // Calculate base zIndex for pasted shapes
      const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex ?? 0)) : -1;

      for (let i = 0; i < clipboard.length; i++) {
        const shape = clipboard[i];
        const newId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const nextZIndex = maxZIndex + 1 + i; // Each pasted shape gets incrementing zIndex

        if (shape.type === 'rectangle') {
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'rectangle',
              x: shape.x + pasteOffset,
              y: shape.y + pasteOffset,
              width: shape.width,
              height: shape.height,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        } else if (shape.type === 'circle') {
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'circle',
              x: shape.x + pasteOffset,
              y: shape.y + pasteOffset,
              radius: shape.radius,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        } else if (shape.type === 'text') {
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'text',
              x: shape.x + pasteOffset,
              y: shape.y + pasteOffset,
              text: shape.text,
              fontSize: shape.fontSize,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        } else if (shape.type === 'image') {
          changes[newId] = {
            shapeId: newId,
            before: null,
            after: {
              type: 'image',
              x: shape.x + pasteOffset,
              y: shape.y + pasteOffset,
              width: shape.width,
              height: shape.height,
              src: shape.src,
              color: shape.color,
              zIndex: nextZIndex,
              rotation: shape.rotation || 0,
              id: newId,
              createdBy: userId,
              createdAt: Date.now(),
              lastModifiedBy: userId,
              lastModifiedAt: Date.now(),
              lockedBy: null,
              lockedAt: null,
            } as CanvasShape,
          };
        }
      }
      await commitChangeSet('duplicate', changes);
      console.log(`[useCanvas] Successfully pasted ${clipboard.length} shapes`);
    } catch (error) {
      console.error("Failed to paste shape:", error);
      setError('Failed to paste shapes. Please check your connection.');
    }
  }, [clipboard, commitChangeSet, shapes]);

  // Z-Index operations: Bring to front
  const bringToFront = useCallback(async () => {
    if (selectedShapeIds.length === 0) return;
    
    const changes: ChangeSet = {};
    for (const shapeId of selectedShapeIds) {
      const updates = zIndexUtils.bringToFront(shapeId, shapes);
      // Process all updates (includes renormalization of other shapes)
      updates.forEach((newZIndex, updateShapeId) => {
        const shape = shapes.find(s => s.id === updateShapeId);
        if (shape) {
          changes[updateShapeId] = {
            shapeId: updateShapeId,
            before: { zIndex: shape.zIndex },
            after: { zIndex: newZIndex },
          };
        }
      });
    }
    
    if (Object.keys(changes).length > 0) {
      await commitChangeSet('update', changes, { action: 'zIndex' });
    }
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Z-Index operations: Send to back
  const sendToBack = useCallback(async () => {
    if (selectedShapeIds.length === 0) return;
    
    const changes: ChangeSet = {};
    for (const shapeId of selectedShapeIds) {
      const updates = zIndexUtils.sendToBack(shapeId, shapes);
      // Process all updates (includes renormalization of other shapes)
      updates.forEach((newZIndex, updateShapeId) => {
        const shape = shapes.find(s => s.id === updateShapeId);
        if (shape) {
          changes[updateShapeId] = {
            shapeId: updateShapeId,
            before: { zIndex: shape.zIndex },
            after: { zIndex: newZIndex },
          };
        }
      });
    }
    
    if (Object.keys(changes).length > 0) {
      await commitChangeSet('update', changes, { action: 'zIndex' });
    }
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Z-Index operations: Bring forward
  const bringForward = useCallback(async () => {
    if (selectedShapeIds.length === 0) return;
    
    const changes: ChangeSet = {};
    for (const shapeId of selectedShapeIds) {
      const updates = zIndexUtils.bringForward(shapeId, shapes);
      // Process all updates (includes renormalization of other shapes)
      updates.forEach((newZIndex, updateShapeId) => {
        const shape = shapes.find(s => s.id === updateShapeId);
        if (shape) {
          changes[updateShapeId] = {
            shapeId: updateShapeId,
            before: { zIndex: shape.zIndex },
            after: { zIndex: newZIndex },
          };
        }
      });
    }
    
    if (Object.keys(changes).length > 0) {
      await commitChangeSet('update', changes, { action: 'zIndex' });
    }
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Z-Index operations: Send backward
  const sendBackward = useCallback(async () => {
    if (selectedShapeIds.length === 0) return;
    
    const changes: ChangeSet = {};
    for (const shapeId of selectedShapeIds) {
      const updates = zIndexUtils.sendBackward(shapeId, shapes);
      // Process all updates (includes renormalization of other shapes)
      updates.forEach((newZIndex, updateShapeId) => {
        const shape = shapes.find(s => s.id === updateShapeId);
        if (shape) {
          changes[updateShapeId] = {
            shapeId: updateShapeId,
            before: { zIndex: shape.zIndex },
            after: { zIndex: newZIndex },
          };
        }
      });
    }
    
    if (Object.keys(changes).length > 0) {
      await commitChangeSet('update', changes, { action: 'zIndex' });
    }
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Align left
  const alignLeftFn = useCallback(async () => {
    if (selectedShapeIds.length < 2) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.alignShapesLeft(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { x: shape.x },
          after: { x: newPos.x },
        };
      }
    });
    
    await commitChangeSet('align', changes, { action: 'alignLeft' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Align right
  const alignRightFn = useCallback(async () => {
    if (selectedShapeIds.length < 2) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.alignShapesRight(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { x: shape.x },
          after: { x: newPos.x },
        };
      }
    });
    
    await commitChangeSet('align', changes, { action: 'alignRight' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Align top
  const alignTopFn = useCallback(async () => {
    if (selectedShapeIds.length < 2) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.alignShapesTop(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { y: shape.y },
          after: { y: newPos.y },
        };
      }
    });
    
    await commitChangeSet('align', changes, { action: 'alignTop' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Align bottom
  const alignBottomFn = useCallback(async () => {
    if (selectedShapeIds.length < 2) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.alignShapesBottom(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { y: shape.y },
          after: { y: newPos.y },
        };
      }
    });
    
    await commitChangeSet('align', changes, { action: 'alignBottom' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Align center horizontal
  const alignCenterHorizontalFn = useCallback(async () => {
    if (selectedShapeIds.length < 2) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.alignShapesCenterHorizontal(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { x: shape.x },
          after: { x: newPos.x },
        };
      }
    });
    
    await commitChangeSet('align', changes, { action: 'alignCenterHorizontal' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Align middle vertical
  const alignMiddleVerticalFn = useCallback(async () => {
    if (selectedShapeIds.length < 2) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.alignShapesMiddleVertical(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { y: shape.y },
          after: { y: newPos.y },
        };
      }
    });
    
    await commitChangeSet('align', changes, { action: 'alignMiddleVertical' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Distribute horizontally
  const distributeHorizontallyFn = useCallback(async () => {
    if (selectedShapeIds.length < 3) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.distributeHorizontally(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { x: shape.x },
          after: { x: newPos.x },
        };
      }
    });
    
    await commitChangeSet('distribute', changes, { action: 'distributeHorizontally' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

  // Alignment operations: Distribute vertically
  const distributeVerticallyFn = useCallback(async () => {
    if (selectedShapeIds.length < 3) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const updates = alignmentUtils.distributeVertically(selectedShapes);
    
    if (updates.size === 0) return;
    
    const changes: ChangeSet = {};
    updates.forEach((newPos, shapeId) => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        changes[shapeId] = {
          shapeId,
          before: { x: shape.x, y: shape.y },
          after: { x: newPos.x, y: newPos.y },
        };
      }
    });
    
    await commitChangeSet('distribute', changes, { action: 'distributeVertically' });
  }, [selectedShapeIds, shapes, commitChangeSet]);

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
    updateMultipleShapes,
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
    commitChangeSet,
    canUndo: canUndoState,
    canRedo: canRedoState,
    undo: () => historyRef.current?.undo() ?? Promise.resolve(),
    redo: () => historyRef.current?.redo() ?? Promise.resolve(),
    
    // Clipboard
    clipboard,
    copySelectedShapes,
    pasteShapes,
    
    // Z-Index operations
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    
    // Alignment operations
    alignLeft: alignLeftFn,
    alignRight: alignRightFn,
    alignTop: alignTopFn,
    alignBottom: alignBottomFn,
    alignCenterHorizontal: alignCenterHorizontalFn,
    alignMiddleVertical: alignMiddleVerticalFn,
    distributeHorizontally: distributeHorizontallyFn,
    distributeVertically: distributeVerticallyFn,
  };
};
