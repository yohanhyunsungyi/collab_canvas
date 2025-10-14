import { useState, useCallback } from 'react';
import type { CanvasShape, ToolType } from '../types/canvas.types';
import { USER_COLORS } from '../utils/colors';

interface UseCanvasReturn {
  // Canvas objects state
  shapes: CanvasShape[];
  selectedShapeId: string | null;
  
  // Tool and style state
  currentTool: ToolType;
  currentColor: string;
  currentFontSize: number;
  
  // Shape management functions
  addShape: (shape: CanvasShape) => void;
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

  // Add a new shape to the canvas
  const addShape = useCallback((shape: CanvasShape) => {
    setShapes((prev) => [...prev, shape]);
  }, []);

  // Update an existing shape
  const updateShape = useCallback((id: string, updates: Partial<CanvasShape>) => {
    setShapes((prev) =>
      prev.map((shape) => {
        if (shape.id === id) {
          // Merge updates while maintaining proper type
          return { ...shape, ...updates } as CanvasShape;
        }
        return shape;
      })
    );
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

