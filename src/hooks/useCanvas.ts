import { useState, useCallback } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';
import * as canvasService from '../services/canvas.service';
import type { ShapeChangeEvent } from '../services/canvas.service';

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
  addShape: (shape: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>, userId: string) => Promise<void>;
  updateShape: (id: string, updates: Partial<CanvasShape>) => void;
  removeShape: (id: string) => void;
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
}

/**
 * Custom hook for managing canvas state
 * Handles shapes, selection, tools, and colors
 */
export const useCanvas = (): UseCanvasReturn => {
  // Canvas objects state
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]); // Changed to array for multi-select
  
  // Tool and style state
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [currentColor, setCurrentColor] = useState<string>(USER_COLORS[0]);
  const [currentFontSize, setCurrentFontSize] = useState<number>(24);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Add a new shape to the canvas and persist it to Firestore
  const addShape = useCallback(async (
    shapeData: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>,
    userId: string
  ) => {
    try {
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

      // Optimistic update: Add to local state immediately for better UX
      setShapes(prevShapes => [...prevShapes, newShape]);

      // Persist to Firestore (real-time listener will sync across users)
      await canvasService.createShape(newShape);
    } catch (error) {
      console.error("Failed to add shape:", error);
      setError('Failed to create shape. Please check your connection.');
      // TODO: Rollback optimistic update on error if needed
    }
  }, []);

  // Update an existing shape and persist it to Firestore
  const updateShape = useCallback(async (id: string, updates: Partial<CanvasShape>) => {
    // Store original shape for potential rollback
    let originalShape: CanvasShape | undefined;
    
    // Optimistically update local state for better responsiveness
    setShapes((prev) => {
      originalShape = prev.find(s => s.id === id);
      return prev.map((shape) => 
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
        setShapes((prev) =>
          prev.map((shape) => 
            shape.id === id ? originalShape! : shape
          )
        );
      }
    }
  }, []);

  // Remove a shape from the canvas and delete from Firestore
  const removeShape = useCallback(async (id: string) => {
    try {
      // Optimistically remove from local state
      setShapes((prev) => prev.filter((shape) => shape.id !== id));
      // Clear selection if the removed shape was selected
      setSelectedShapeIds((prev) => prev.filter(shapeId => shapeId !== id));
      
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

    // Select all shapes in the area
    setSelectedShapeIds(shapesInArea.map(shape => shape.id));
  }, [shapes]);

  // Duplicate selected shapes
  const duplicateSelectedShapes = useCallback(async (userId: string) => {
    if (selectedShapeIds.length === 0) return;

    const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
    const duplicateOffset = 20; // Offset duplicates by 20px
    const newShapeIds: string[] = [];

    try {
      // Create duplicates for each selected shape
      for (const shape of selectedShapes) {
        let newShape: CanvasShape;

        if (shape.type === 'rectangle') {
          newShape = {
            type: 'rectangle',
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            width: shape.width,
            height: shape.height,
            color: shape.color,
            id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdBy: userId,
            createdAt: Date.now(),
            lastModifiedBy: userId,
            lastModifiedAt: Date.now(),
            lockedBy: null,
            lockedAt: null,
          };
        } else if (shape.type === 'circle') {
          newShape = {
            type: 'circle',
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            radius: shape.radius,
            color: shape.color,
            id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdBy: userId,
            createdAt: Date.now(),
            lastModifiedBy: userId,
            lastModifiedAt: Date.now(),
            lockedBy: null,
            lockedAt: null,
          };
        } else if (shape.type === 'text') {
          newShape = {
            type: 'text',
            x: shape.x + duplicateOffset,
            y: shape.y + duplicateOffset,
            text: shape.text,
            fontSize: shape.fontSize,
            color: shape.color,
            id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdBy: userId,
            createdAt: Date.now(),
            lastModifiedBy: userId,
            lastModifiedAt: Date.now(),
            lockedBy: null,
            lockedAt: null,
          };
        } else {
          continue; // Skip unknown types
        }

        // Optimistic update
        setShapes(prevShapes => [...prevShapes, newShape]);
        newShapeIds.push(newShape.id);

        // Persist to Firestore
        await canvasService.createShape(newShape);
      }

      // Select the newly duplicated shapes
      setSelectedShapeIds(newShapeIds);
    } catch (error) {
      console.error("Failed to duplicate shapes:", error);
      setError('Failed to duplicate shapes. Please check your connection.');
    }
  }, [selectedShapeIds, shapes]);
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Apply real-time shape changes from Firestore
  const applyShapeChanges = useCallback((changes: ShapeChangeEvent[]) => {
    const startTime = performance.now();
    
    setShapes((prevShapes) => {
      let updatedShapes = [...prevShapes];
      let addedCount = 0;
      let modifiedCount = 0;
      let removedCount = 0;
      
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
            console.log(`[useCanvas] Skipped duplicate shape: ${shape.id}`);
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
      
      console.log(`[useCanvas] Applied ${changes.length} changes in ${duration.toFixed(2)}ms (added: ${addedCount}, modified: ${modifiedCount}, removed: ${removedCount})`);
      
      return updatedShapes;
    });
    
    // Clear selection for any removed shapes
    changes.forEach((change) => {
      if (change.type === 'removed') {
        setSelectedShapeIds((prev) => prev.filter(id => id !== change.shape.id));
      }
    });
  }, []);

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
  };
};

