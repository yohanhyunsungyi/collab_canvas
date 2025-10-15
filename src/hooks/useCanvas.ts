import { useState, useCallback } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';
import * as canvasService from '../services/canvas.service';
import type { ShapeChangeEvent } from '../services/canvas.service';

interface UseCanvasReturn {
  // Canvas objects state
  shapes: CanvasShape[];
  setShapes: (shapes: CanvasShape[]) => void; // Added for initial load
  selectedShapeId: string | null;
  
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
  selectShape: (id: string | null) => void;
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
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
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
      setSelectedShapeId((prev) => (prev === id ? null : prev));
      
      // Delete from Firestore
      await canvasService.deleteShape(id);
    } catch (error) {
      console.error("Failed to delete shape:", error);
      setError('Failed to delete shape. Please check your connection.');
      // Note: The shape will reappear via onSnapshot if deletion failed
    }
  }, []);

  // Select a shape
  const selectShape = useCallback((id: string | null) => {
    setSelectedShapeId(id);
  }, []);
  
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
          
          // Clear selection if removed shape was selected
          if (shape.id === selectedShapeId) {
            setSelectedShapeId(null);
          }
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`[useCanvas] Applied ${changes.length} changes in ${duration.toFixed(2)}ms (added: ${addedCount}, modified: ${modifiedCount}, removed: ${removedCount})`);
      
      return updatedShapes;
    });
  }, [selectedShapeId]);

  return {
    // State
    shapes,
    setShapes, // Added for initial load
    selectedShapeId,
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
    selectShape,
    applyShapeChanges, // Handle real-time changes
    
    // Tool and style
    setCurrentTool,
    setCurrentColor,
    setCurrentFontSize,
  };
};

