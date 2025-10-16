import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvas } from './useCanvas';
import type { RectangleShape, CircleShape, TextShape, CanvasShape } from '../types/canvas.types';
import { createShape, deleteShape } from '../services/canvas.service';

vi.mock('../services/canvas.service', () => ({
  createShape: vi.fn(),
  updateShape: vi.fn(),
  deleteShape: vi.fn(),
}));

/**
 * Multi-Select Feature Tests
 * Tests for shift-click selection, drag-to-select, duplicate, and group operations
 */
describe('useCanvas - Multi-Select Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Shift-Click Selection', () => {
    it('should add shape to selection with toggleShapeSelection', () => {
      const { result } = renderHook(() => useCanvas());
      
      // Select first shape
      act(() => {
        result.current.selectShape('shape-1');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1']);

      // Add second shape with shift-click (toggle)
      act(() => {
        result.current.toggleShapeSelection('shape-2');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2']);
    });

    it('should remove shape from selection with toggleShapeSelection', () => {
      const { result } = renderHook(() => useCanvas());
      
      // Select two shapes
      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2']);

      // Remove first shape (toggle off)
      act(() => {
        result.current.toggleShapeSelection('shape-1');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-2']);
    });

    it('should toggle multiple shapes on and off', () => {
      const { result } = renderHook(() => useCanvas());
      
      // Build up selection
      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
        result.current.toggleShapeSelection('shape-3');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2', 'shape-3']);

      // Remove middle shape
      act(() => {
        result.current.toggleShapeSelection('shape-2');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-3']);

      // Re-add middle shape
      act(() => {
        result.current.toggleShapeSelection('shape-2');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-3', 'shape-2']);
    });

    it('should clear all selections with clearSelection', () => {
      const { result } = renderHook(() => useCanvas());
      
      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
        result.current.toggleShapeSelection('shape-3');
      });

      expect(result.current.selectedShapeIds).toHaveLength(3);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedShapeIds).toEqual([]);
    });

    it('should replace selection when selectShape is called', () => {
      const { result } = renderHook(() => useCanvas());
      
      // Multi-select
      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2']);

      // Regular click replaces selection
      act(() => {
        result.current.selectShape('shape-3');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-3']);
    });
  });

  describe('Drag-to-Select', () => {
    const createTestShapes = (): CanvasShape[] => [
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
        x: 250,
        y: 250,
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
        id: 'text-1',
        type: 'text',
        x: 500,
        y: 500,
        text: 'Hello',
        fontSize: 24,
        color: '#0000ff',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
    ];

    it('should select shapes within rectangular area', () => {
      const { result } = renderHook(() => useCanvas());
      const shapes = createTestShapes();
      
      act(() => {
        result.current.setShapes(shapes);
      });

      // Select area covering rect-1 and circle-1
      act(() => {
        result.current.selectShapesInArea(0, 0, 400, 400);
      });

      expect(result.current.selectedShapeIds).toHaveLength(2);
      expect(result.current.selectedShapeIds).toContain('rect-1');
      expect(result.current.selectedShapeIds).toContain('circle-1');
      expect(result.current.selectedShapeIds).not.toContain('text-1');
    });

    it('should select all shapes when area encompasses everything', () => {
      const { result } = renderHook(() => useCanvas());
      const shapes = createTestShapes();
      
      act(() => {
        result.current.setShapes(shapes);
      });

      // Large selection area
      act(() => {
        result.current.selectShapesInArea(0, 0, 1000, 1000);
      });

      expect(result.current.selectedShapeIds).toHaveLength(3);
      expect(result.current.selectedShapeIds).toContain('rect-1');
      expect(result.current.selectedShapeIds).toContain('circle-1');
      expect(result.current.selectedShapeIds).toContain('text-1');
    });

    it('should select no shapes when area is outside all shapes', () => {
      const { result } = renderHook(() => useCanvas());
      const shapes = createTestShapes();
      
      act(() => {
        result.current.setShapes(shapes);
      });

      // Selection area far away from shapes
      act(() => {
        result.current.selectShapesInArea(2000, 2000, 2100, 2100);
      });

      expect(result.current.selectedShapeIds).toHaveLength(0);
    });

    it('should handle selection area with negative coordinates', () => {
      const { result } = renderHook(() => useCanvas());
      const shapes = createTestShapes();
      
      act(() => {
        result.current.setShapes(shapes);
      });

      // Drag from bottom-right to top-left (creates negative width/height)
      // The implementation should handle this by normalizing coordinates
      act(() => {
        result.current.selectShapesInArea(400, 400, 0, 0);
      });

      expect(result.current.selectedShapeIds).toHaveLength(2);
      expect(result.current.selectedShapeIds).toContain('rect-1');
      expect(result.current.selectedShapeIds).toContain('circle-1');
    });

    it('should select single shape when area only covers it', () => {
      const { result } = renderHook(() => useCanvas());
      const shapes = createTestShapes();
      
      act(() => {
        result.current.setShapes(shapes);
      });

      // Precise selection around circle-1
      act(() => {
        result.current.selectShapesInArea(200, 200, 300, 300);
      });

      expect(result.current.selectedShapeIds).toEqual(['circle-1']);
    });
  });

  describe('Duplicate Functionality', () => {
    it('should duplicate a single selected shape', async () => {
      const { result } = renderHook(() => useCanvas());
      const userId = 'user-123';
      
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

      // Duplicate
      await act(async () => {
        await result.current.duplicateSelectedShapes(userId);
      });

      // Should have 2 shapes now
      expect(result.current.shapes).toHaveLength(2);
      
      // Duplicate should be offset by 20px
      const duplicatedShape = result.current.shapes.find(s => s.id !== 'rect-1') as RectangleShape;
      expect(duplicatedShape).toBeDefined();
      expect(duplicatedShape.type).toBe('rectangle');
      expect(duplicatedShape.x).toBe(120); // 100 + 20
      expect(duplicatedShape.y).toBe(120); // 100 + 20
      expect(duplicatedShape.width).toBe(200);
      expect(duplicatedShape.height).toBe(150);
      expect(duplicatedShape.color).toBe('#ff0000');

      // Should select only the duplicated shape
      expect(result.current.selectedShapeIds).toHaveLength(1);
      expect(result.current.selectedShapeIds[0]).toBe(duplicatedShape.id);

      // Service should be called
      expect(createShape).toHaveBeenCalledTimes(1);
    });

    it('should duplicate multiple selected shapes', async () => {
      const { result } = renderHook(() => useCanvas());
      const userId = 'user-123';
      
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
        {
          id: 'text-1',
          type: 'text',
          x: 350,
          y: 350,
          text: 'Test',
          fontSize: 32,
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
        result.current.selectShape('rect-1');
        result.current.toggleShapeSelection('circle-1');
        result.current.toggleShapeSelection('text-1');
      });

      expect(result.current.shapes).toHaveLength(3);
      expect(result.current.selectedShapeIds).toHaveLength(3);

      // Duplicate all three
      await act(async () => {
        await result.current.duplicateSelectedShapes(userId);
      });

      // Should have 6 shapes now
      expect(result.current.shapes).toHaveLength(6);
      
      // Should select the 3 duplicated shapes
      expect(result.current.selectedShapeIds).toHaveLength(3);
      
      // All selected shapes should be new (not original IDs)
      expect(result.current.selectedShapeIds).not.toContain('rect-1');
      expect(result.current.selectedShapeIds).not.toContain('circle-1');
      expect(result.current.selectedShapeIds).not.toContain('text-1');

      // Service should be called three times
      expect(createShape).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate when no shapes are selected', async () => {
      const { result } = renderHook(() => useCanvas());
      const userId = 'user-123';
      
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
      });

      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.selectedShapeIds).toHaveLength(0);

      // Try to duplicate with nothing selected
      await act(async () => {
        await result.current.duplicateSelectedShapes(userId);
      });

      // Should still have only 1 shape
      expect(result.current.shapes).toHaveLength(1);
      expect(createShape).not.toHaveBeenCalled();
    });

    it('should duplicate text shape with correct properties', async () => {
      const { result } = renderHook(() => useCanvas());
      const userId = 'user-123';
      
      const textShape: TextShape = {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        text: 'Hello World',
        fontSize: 48,
        color: '#123456',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.setShapes([textShape]);
        result.current.selectShape('text-1');
      });

      await act(async () => {
        await result.current.duplicateSelectedShapes(userId);
      });

      expect(result.current.shapes).toHaveLength(2);
      
      const duplicatedText = result.current.shapes.find(s => s.id !== 'text-1') as TextShape;
      expect(duplicatedText.type).toBe('text');
      expect(duplicatedText.text).toBe('Hello World');
      expect(duplicatedText.fontSize).toBe(48);
      expect(duplicatedText.color).toBe('#123456');
      expect(duplicatedText.x).toBe(120); // 100 + 20
      expect(duplicatedText.y).toBe(120); // 100 + 20
    });

    it('should duplicate circle shape with correct properties', async () => {
      const { result } = renderHook(() => useCanvas());
      const userId = 'user-123';
      
      const circleShape: CircleShape = {
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 75,
        color: '#abcdef',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      act(() => {
        result.current.setShapes([circleShape]);
        result.current.selectShape('circle-1');
      });

      await act(async () => {
        await result.current.duplicateSelectedShapes(userId);
      });

      expect(result.current.shapes).toHaveLength(2);
      
      const duplicatedCircle = result.current.shapes.find(s => s.id !== 'circle-1') as CircleShape;
      expect(duplicatedCircle.type).toBe('circle');
      expect(duplicatedCircle.radius).toBe(75);
      expect(duplicatedCircle.color).toBe('#abcdef');
      expect(duplicatedCircle.x).toBe(220); // 200 + 20
      expect(duplicatedCircle.y).toBe(220); // 200 + 20
    });
  });

  describe('Group Operations', () => {
    it('should delete multiple selected shapes', () => {
      const { result } = renderHook(() => useCanvas());
      
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
        {
          id: 'text-1',
          type: 'text',
          x: 350,
          y: 350,
          text: 'Keep Me',
          fontSize: 24,
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
        result.current.selectShape('rect-1');
        result.current.toggleShapeSelection('circle-1');
      });

      expect(result.current.shapes).toHaveLength(3);
      expect(result.current.selectedShapeIds).toEqual(['rect-1', 'circle-1']);

      // Delete selected shapes
      act(() => {
        result.current.removeShape('rect-1');
        result.current.removeShape('circle-1');
      });

      // Should only have text-1 left
      expect(result.current.shapes).toHaveLength(1);
      expect(result.current.shapes[0].id).toBe('text-1');
      
      // Selection should be cleared for deleted shapes
      expect(result.current.selectedShapeIds).toEqual([]);
    });

    it('should clear selection when all selected shapes are deleted', () => {
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

      expect(result.current.selectedShapeIds).toEqual(['rect-1']);

      act(() => {
        result.current.removeShape('rect-1');
      });

      expect(result.current.shapes).toHaveLength(0);
      expect(result.current.selectedShapeIds).toEqual([]);
    });

    it('should maintain selection of undeleted shapes', () => {
      const { result } = renderHook(() => useCanvas());
      
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

      expect(result.current.selectedShapeIds).toEqual(['rect-1', 'circle-1']);

      // Delete only one shape
      act(() => {
        result.current.removeShape('rect-1');
      });

      expect(result.current.shapes).toHaveLength(1);
      // Selection should only include circle-1 now (rect-1 removed from selection)
      expect(result.current.selectedShapeIds).toEqual(['circle-1']);
    });

    it('should handle updating a shape in multi-selection', () => {
      const { result } = renderHook(() => useCanvas());
      
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

      // Update position of one shape in the selection
      act(() => {
        result.current.updateShape('rect-1', { x: 150, y: 150 });
      });

      const updatedRect = result.current.shapes.find(s => s.id === 'rect-1') as RectangleShape;
      expect(updatedRect.x).toBe(150);
      expect(updatedRect.y).toBe(150);

      // Other shape should remain unchanged
      const unchangedCircle = result.current.shapes.find(s => s.id === 'circle-1') as CircleShape;
      expect(unchangedCircle.x).toBe(200);
      expect(unchangedCircle.y).toBe(200);

      // Both should still be selected
      expect(result.current.selectedShapeIds).toEqual(['rect-1', 'circle-1']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty canvas for drag-to-select', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.selectShapesInArea(0, 0, 500, 500);
      });

      expect(result.current.selectedShapeIds).toEqual([]);
    });

    it('should handle selecting same shape multiple times', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.selectShape('shape-1');
        result.current.selectShape('shape-1');
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1']);
    });

    it('should handle toggling same shape multiple times', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.selectShape('shape-1');
        result.current.toggleShapeSelection('shape-2');
        result.current.toggleShapeSelection('shape-2'); // Toggle off
        result.current.toggleShapeSelection('shape-2'); // Toggle on
      });

      expect(result.current.selectedShapeIds).toEqual(['shape-1', 'shape-2']);
    });

    it('should handle clearing empty selection', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedShapeIds).toEqual([]);
    });

    it('should handle zero-size selection area', () => {
      const { result } = renderHook(() => useCanvas());
      
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
      ];

      act(() => {
        result.current.setShapes(shapes);
        result.current.selectShapesInArea(100, 100, 100, 100);
      });

      // Zero-size area might select or not select depending on implementation
      // Just ensure it doesn't crash
      expect(result.current.selectedShapeIds).toBeDefined();
    });
  });
});

