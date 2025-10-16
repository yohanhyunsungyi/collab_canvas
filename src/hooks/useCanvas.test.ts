import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvas } from './useCanvas';
import type { RectangleShape, CircleShape, CanvasShape } from '../types/canvas.types';
import { createShape } from '../services/canvas.service';

vi.mock('../services/canvas.service', () => ({
  createShape: vi.fn(),
  updateShape: vi.fn(),
  deleteShape: vi.fn(),
}));

describe('useCanvas', () => {
  // Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createShape service when adding a shape', async () => {
    const { result } = renderHook(() => useCanvas());
    const userId = 'user-123';
    
    const shapeData = {
      type: 'rectangle' as const,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
    };

    await act(async () => {
      await result.current.addShape(shapeData, userId);
    });

    expect(createShape).toHaveBeenCalledTimes(1);
    expect(createShape).toHaveBeenCalledWith(
      expect.objectContaining({
        ...shapeData,
        createdBy: userId,
        lastModifiedBy: userId,
      })
    );
  });

  it('should select and deselect shapes', () => {
    const { result } = renderHook(() => useCanvas());
    
    act(() => {
      result.current.selectShape('shape-1');
    });

    expect(result.current.selectedShapeIds).toEqual(['shape-1']);

    act(() => {
      result.current.selectShape(null);
    });

    expect(result.current.selectedShapeIds).toEqual([]);
  });

  it('should support multi-select with toggleShapeSelection', () => {
    const { result } = renderHook(() => useCanvas());
    
    // Select first shape
    act(() => {
      result.current.selectShape('shape-1');
    });

    expect(result.current.selectedShapeIds).toEqual(['shape-1']);

    // Add second shape with toggle
    act(() => {
      result.current.toggleShapeSelection('shape-2');
    });

    expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2']);

    // Add third shape
    act(() => {
      result.current.toggleShapeSelection('shape-3');
    });

    expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2', 'shape-3']);

    // Remove second shape (toggle off)
    act(() => {
      result.current.toggleShapeSelection('shape-2');
    });

    expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-3']);

    // Clear all selections
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedShapeIds).toEqual([]);
  });

  it('should select shapes within a rectangular area', () => {
    const { result } = renderHook(() => useCanvas());
    
    // Create test shapes at different positions
    const shapes: RectangleShape[] = [
      {
        id: 'rect-1',
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        color: '#ff0000',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
      {
        id: 'rect-2',
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        color: '#00ff00',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
      {
        id: 'rect-3',
        type: 'rectangle',
        x: 500,
        y: 500,
        width: 100,
        height: 100,
        color: '#0000ff',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
    ];

    act(() => {
      result.current.setShapes(shapes);
    });

    // Select shapes in area that covers rect-1 and rect-2, but not rect-3
    act(() => {
      result.current.selectShapesInArea(0, 0, 350, 350);
    });

    expect(result.current.selectedShapeIds).toHaveLength(2);
    expect(result.current.selectedShapeIds).toContain('rect-1');
    expect(result.current.selectedShapeIds).toContain('rect-2');
    expect(result.current.selectedShapeIds).not.toContain('rect-3');

    // Select all shapes with larger area
    act(() => {
      result.current.selectShapesInArea(0, 0, 700, 700);
    });

    expect(result.current.selectedShapeIds).toHaveLength(3);
    expect(result.current.selectedShapeIds).toContain('rect-1');
    expect(result.current.selectedShapeIds).toContain('rect-2');
    expect(result.current.selectedShapeIds).toContain('rect-3');

    // Select no shapes (area outside all shapes)
    act(() => {
      result.current.selectShapesInArea(1000, 1000, 1100, 1100);
    });

    expect(result.current.selectedShapeIds).toHaveLength(0);
  });

  it('should duplicate selected shapes', async () => {
    const { result } = renderHook(() => useCanvas());
    const userId = 'user-123';
    
    // Create a test shape
    const shape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    act(() => {
      result.current.setShapes([shape]);
      result.current.selectShape('rect-1');
    });

    expect(result.current.shapes).toHaveLength(1);
    expect(result.current.selectedShapeIds).toEqual(['rect-1']);

    // Duplicate the shape
    await act(async () => {
      await result.current.duplicateSelectedShapes(userId);
    });

    // Should have 2 shapes now (original + duplicate)
    expect(result.current.shapes).toHaveLength(2);
    
    // Should select only the duplicated shape
    expect(result.current.selectedShapeIds).toHaveLength(1);
    expect(result.current.selectedShapeIds[0]).not.toBe('rect-1');
    
    // Duplicate should be offset by 20px
    const duplicatedShape = result.current.shapes.find(s => s.id === result.current.selectedShapeIds[0]);
    expect(duplicatedShape).toBeDefined();
    if (duplicatedShape && duplicatedShape.type === 'rectangle') {
      expect(duplicatedShape.x).toBe(120); // 100 + 20
      expect(duplicatedShape.y).toBe(120); // 100 + 20
      expect(duplicatedShape.width).toBe(200);
      expect(duplicatedShape.height).toBe(150);
      expect(duplicatedShape.color).toBe('#ff0000');
    }

    // createShape service should have been called
    expect(createShape).toHaveBeenCalledTimes(1);
  });

  it('should duplicate multiple selected shapes', async () => {
    const { result } = renderHook(() => useCanvas());
    const userId = 'user-123';
    
    // Create test shapes
    const shapes: CanvasShape[] = [
      {
        id: 'rect-1',
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        color: '#ff0000',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
      {
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        color: '#00ff00',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
    ];

    act(() => {
      result.current.setShapes(shapes);
      result.current.selectShape('rect-1');
      result.current.toggleShapeSelection('circle-1');
    });

    expect(result.current.shapes).toHaveLength(2);
    expect(result.current.selectedShapeIds).toHaveLength(2);

    // Duplicate both shapes
    await act(async () => {
      await result.current.duplicateSelectedShapes(userId);
    });

    // Should have 4 shapes now (2 originals + 2 duplicates)
    expect(result.current.shapes).toHaveLength(4);
    
    // Should select the 2 duplicated shapes
    expect(result.current.selectedShapeIds).toHaveLength(2);

    // createShape service should have been called twice
    expect(createShape).toHaveBeenCalledTimes(2);
  });

  it('should update shape position (movement)', () => {
    const { result } = renderHook(() => useCanvas());
    
    const shape: CircleShape = {
      id: 'circle-1',
      type: 'circle',
      x: 100,
      y: 100,
      radius: 50,
      color: '#00ff00',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    act(() => {
      // Manually set initial shapes for this test, as addShape is now async service call
      result.current.setShapes([shape]);
    });

    act(() => {
      result.current.updateShape('circle-1', { x: 200, y: 250 });
    });

    expect(result.current.shapes[0].x).toBe(200);
    expect(result.current.shapes[0].y).toBe(250);
  });

  it('should update shape dimensions (resize)', () => {
    const { result } = renderHook(() => useCanvas());
    
    const shape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#0000ff',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    act(() => {
      // Manually set initial shapes
      result.current.setShapes([shape]);
    });

    act(() => {
      result.current.updateShape('rect-1', { width: 300, height: 250 });
    });

    const updatedShape = result.current.shapes[0] as RectangleShape;
    expect(updatedShape.width).toBe(300);
    expect(updatedShape.height).toBe(250);
  });

  it('should switch tools', () => {
    const { result } = renderHook(() => useCanvas());
    
    expect(result.current.currentTool).toBe('select');

    act(() => {
      result.current.setCurrentTool('rectangle');
    });

    expect(result.current.currentTool).toBe('rectangle');

    act(() => {
      result.current.setCurrentTool('circle');
    });

    expect(result.current.currentTool).toBe('circle');

    act(() => {
      result.current.setCurrentTool('text');
    });

    expect(result.current.currentTool).toBe('text');
  });

  it('should remove shapes and clear selection if selected', () => {
    const { result } = renderHook(() => useCanvas());
    
    const shape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    act(() => {
      result.current.setShapes([shape]);
      result.current.selectShape('rect-1');
    });

    expect(result.current.shapes).toHaveLength(1);
    expect(result.current.selectedShapeIds).toEqual(['rect-1']);

    act(() => {
      result.current.removeShape('rect-1');
    });

    expect(result.current.shapes).toHaveLength(0);
    expect(result.current.selectedShapeIds).toEqual([]);
  });

  it('should change color and font size', () => {
    const { result } = renderHook(() => useCanvas());
    
    act(() => {
      result.current.setCurrentColor('#123456');
    });

    expect(result.current.currentColor).toBe('#123456');

    act(() => {
      result.current.setCurrentFontSize(48);
    });

    expect(result.current.currentFontSize).toBe(48);
  });

  describe('Group Operations', () => {
    it('should delete multiple selected shapes together', () => {
      const { result } = renderHook(() => useCanvas());
      
      // Create test shapes
      const shapes: CanvasShape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          color: '#ff0000',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'shape-2',
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          color: '#00ff00',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'shape-3',
          type: 'rectangle',
          x: 400,
          y: 400,
          width: 80,
          height: 80,
          color: '#0000ff',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
      ];

      act(() => {
        result.current.setShapes(shapes);
      });

      expect(result.current.shapes).toHaveLength(3);

      // Select multiple shapes
      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
      });

      expect(result.current.selectedShapeIds).toHaveLength(2);

      // Delete both selected shapes
      act(() => {
        result.current.selectedShapeIds.forEach(id => result.current.removeShape(id));
      });

      // Should have only 1 shape left
      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0].id).toBe('shape-3');
    });

    it('should maintain selection state when shapes are selected', () => {
      const { result } = renderHook(() => useCanvas());
      
      const shapes: CanvasShape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          color: '#ff0000',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'shape-2',
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          color: '#00ff00',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
      ];

      act(() => {
        result.current.setShapes(shapes);
      });

      // Test shift-click like behavior with toggle
      act(() => {
        result.current.selectShape('shape-1');
      });
      
      expect(result.current.selectedShapeIds).toEqual(['shape-1']);
      
      act(() => {
        result.current.toggleShapeSelection('shape-2');
      });
      
      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2']);

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedShapeIds).toEqual([]);
    });

    it('should allow updating multiple shapes at once', () => {
      const { result } = renderHook(() => useCanvas());
      
      const shapes: CanvasShape[] = [
        {
          id: 'shape-1',
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          color: '#ff0000',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'shape-2',
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          color: '#00ff00',
          createdBy: 'user-1',
          createdAt: Date.now(),
          lastModifiedBy: 'user-1',
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        },
      ];

      act(() => {
        result.current.setShapes(shapes);
      });

      // Select both shapes
      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
      });

      // Update both shapes (simulating group move)
      act(() => {
        result.current.updateShape('shape-1', { x: 100, y: 100 });
        result.current.updateShape('shape-2', { x: 250, y: 250 });
      });

      const shape1 = result.current.shapes.find(s => s.id === 'shape-1');
      const shape2 = result.current.shapes.find(s => s.id === 'shape-2');

      expect(shape1?.x).toBe(100);
      expect(shape1?.y).toBe(100);
      expect(shape2?.x).toBe(250);
      expect(shape2?.y).toBe(250);
    });
  });
});

