import { useState, useCallback } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';
import * as canvasService from '../services/canvas.service';

interface UseCanvasReturn {
  // Canvas objects state
  shapes: CanvasShape[];
  setShapes: (shapes: CanvasShape[]) => void; // Added for initial load
  selectedShapeId: string | null;
  
  // Tool and style state
  currentTool: ToolType;
  currentColor: string;
  currentFontSize: number;
  
  // Shape management functions
  addShape: (shape: Omit<CanvasShape, 'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'>, userId: string) => Promise<void>;
  updateShape: (id: string, updates: Partial<CanvasShape>) => void;
  removeShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  
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

      // No longer updating local state directly.
      // Firestore listener will handle the update.
      await canvasService.createShape(newShape);
    } catch (error) {
      console.error("Failed to add shape:", error);
      // Here you could also set an error state to show in the UI
    }
  }, []);

  // Update an existing shape and persist it to Firestore
  const updateShape = useCallback(async (id: string, updates: Partial<CanvasShape>) => {
    // Optimistically update local state for better responsiveness
    setShapes((prev) =>
      prev.map((shape) => 
        shape.id === id ? { ...shape, ...updates } as CanvasShape : shape
      )
    );
    
    try {
      await canvasService.updateShape(id, updates);
    } catch (error) {
      console.error("Failed to update shape:", error);
      // Here you could revert the optimistic update if the API call fails
    }
  }, []);

  // Remove a shape from the canvas
  const removeShape = useCallback((id: string) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    // Clear selection if the removed shape was selected
    setSelectedShapeId((prev) => (prev === id ? null : prev));
  }, []);

  // Select a shape
  const selectShape = useCallback((id: string | null) => {
    setSelectedShapeId(id);
  }, []);

  return {
    // State
    shapes,
    setShapes, // Added for initial load
    selectedShapeId,
    currentTool,
    currentColor,
    currentFontSize,
    
    // Shape management
    addShape,
    updateShape,
    removeShape,
    selectShape,
    
    // Tool and style
    setCurrentTool,
    setCurrentColor,
    setCurrentFontSize,
  };
};

