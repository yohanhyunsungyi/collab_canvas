import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvas } from './useCanvas';
import type { RectangleShape, CircleShape } from '../types/canvas.types';
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

    expect(result.current.selectedShapeId).toBe('shape-1');

    act(() => {
      result.current.selectShape(null);
    });

    expect(result.current.selectedShapeId).toBeNull();
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
    expect(result.current.selectedShapeId).toBe('rect-1');

    act(() => {
      result.current.removeShape('rect-1');
    });

    expect(result.current.shapes).toHaveLength(0);
    expect(result.current.selectedShapeId).toBeNull();
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
});

