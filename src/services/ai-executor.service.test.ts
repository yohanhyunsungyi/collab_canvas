import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { aiExecutorService, type ExecutionContext, type ToolExecutionResult } from './ai-executor.service';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../types/canvas.types';
import type { AIToolCall } from '../types/ai.types';

// Mock canvas service
vi.mock('./canvas.service', () => ({
  createShape: vi.fn().mockResolvedValue('new-shape-id'),
  updateShape: vi.fn().mockResolvedValue(undefined),
  deleteShape: vi.fn().mockResolvedValue(undefined),
}));

import * as canvasService from './canvas.service';

describe('AI Executor Service', () => {
  let mockContext: ExecutionContext;
  let mockShapes: CanvasShape[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock shapes for context
    mockShapes = [
      {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF0000',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      } as RectangleShape,
      {
        id: 'circle-1',
        type: 'circle',
        x: 300,
        y: 300,
        radius: 50,
        color: '#00FF00',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      } as CircleShape,
      {
        id: 'text-1',
        type: 'text',
        x: 500,
        y: 500,
        text: 'Hello',
        fontSize: 24,
        color: '#0000FF',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      } as TextShape,
    ];

    mockContext = {
      userId: 'test-user',
      shapes: mockShapes,
      canvasWidth: 1200,
      canvasHeight: 800,
    };
  });

  describe('Creation Tools', () => {
    it('should execute createRectangle', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createRectangle',
          arguments: JSON.stringify({
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            color: '#FF6B6B',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created rectangle');
      expect(canvasService.createShape).toHaveBeenCalledTimes(1);
      expect(canvasService.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          color: '#FF6B6B',
        })
      );
    });

    it('should execute createCircle', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createCircle',
          arguments: JSON.stringify({
            x: 200,
            y: 200,
            radius: 75,
            color: '#4ECDC4',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created circle');
      expect(canvasService.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'circle',
          x: 200,
          y: 200,
          radius: 75,
          color: '#4ECDC4',
        })
      );
    });

    it('should execute createText with defaults', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createText',
          arguments: JSON.stringify({
            x: 150,
            y: 150,
            text: 'Hello World',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created text');
      expect(canvasService.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          x: 150,
          y: 150,
          text: 'Hello World',
          fontSize: 24, // default
          color: '#000000', // default
        })
      );
    });

    it('should execute createMultipleShapes', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createMultipleShapes',
          arguments: JSON.stringify({
            shapes: [
              { type: 'rectangle', x: 0, y: 0, width: 50, height: 50, color: '#FF0000' },
              { type: 'circle', x: 100, y: 100, radius: 25, color: '#00FF00' },
              { type: 'text', x: 200, y: 200, text: 'Test', color: '#0000FF' },
            ],
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created 3 shapes');
      expect(canvasService.createShape).toHaveBeenCalledTimes(3);
    });
  });

  describe('Manipulation Tools', () => {
    it('should execute moveShape', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'moveShape',
          arguments: JSON.stringify({
            shapeId: 'rect-1',
            x: 250,
            y: 250,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Moved shape');
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'rect-1',
        expect.objectContaining({
          x: 250,
          y: 250,
        })
      );
    });

    it('should handle moveShape with non-existent shape', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'moveShape',
          arguments: JSON.stringify({
            shapeId: 'non-existent',
            x: 100,
            y: 100,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SHAPE_NOT_FOUND');
    });

    it('should execute resizeShape for rectangle', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'resizeShape',
          arguments: JSON.stringify({
            shapeId: 'rect-1',
            width: 300,
            height: 200,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'rect-1',
        expect.objectContaining({
          width: 300,
          height: 200,
        })
      );
    });

    it('should execute resizeShape for circle', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'resizeShape',
          arguments: JSON.stringify({
            shapeId: 'circle-1',
            radius: 100,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'circle-1',
        expect.objectContaining({
          radius: 100,
        })
      );
    });

    it('should execute changeColor', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'changeColor',
          arguments: JSON.stringify({
            shapeId: 'rect-1',
            color: '#FFFF00',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'rect-1',
        expect.objectContaining({
          color: '#FFFF00',
        })
      );
    });

    it('should execute updateText', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'updateText',
          arguments: JSON.stringify({
            shapeId: 'text-1',
            text: 'Updated Text',
            fontSize: 32,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'text-1',
        expect.objectContaining({
          text: 'Updated Text',
          fontSize: 32,
        })
      );
    });

    it('should execute deleteShape', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'deleteShape',
          arguments: JSON.stringify({
            shapeId: 'rect-1',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(canvasService.deleteShape).toHaveBeenCalledWith('rect-1');
    });

    it('should execute deleteMultipleShapes', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'deleteMultipleShapes',
          arguments: JSON.stringify({
            shapeIds: ['rect-1', 'circle-1'],
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Deleted 2 shapes');
      expect(canvasService.deleteShape).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query Tools', () => {
    it('should execute getCanvasState', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'getCanvasState',
          arguments: '{}',
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('shapes');
      expect((result.data as any).shapes).toHaveLength(3);
    });

    it('should execute findShapesByType', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'findShapesByType',
          arguments: JSON.stringify({ type: 'rectangle' }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Found 1 rectangle');
      expect((result.data as any).shapeIds).toContain('rect-1');
    });

    it('should execute findShapesByColor', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'findShapesByColor',
          arguments: JSON.stringify({ color: '#FF0000' }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect((result.data as any).shapeIds).toContain('rect-1');
    });

    it('should execute findShapesByText', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'findShapesByText',
          arguments: JSON.stringify({ searchText: 'Hello' }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect((result.data as any).shapeIds).toContain('text-1');
    });
  });

  describe('Layout Tools', () => {
    it('should execute arrangeHorizontal', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'arrangeHorizontal',
          arguments: JSON.stringify({
            shapeIds: ['rect-1', 'circle-1'],
            startX: 50,
            y: 100,
            spacing: 30,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Arranged 2 shapes horizontally');
      expect(canvasService.updateShape).toHaveBeenCalled();
    });

    it('should execute arrangeVertical', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'arrangeVertical',
          arguments: JSON.stringify({
            shapeIds: ['rect-1', 'circle-1'],
            x: 100,
            startY: 50,
            spacing: 30,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Arranged 2 shapes vertically');
    });

    it('should execute arrangeGrid', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'arrangeGrid',
          arguments: JSON.stringify({
            shapeIds: ['rect-1', 'circle-1', 'text-1'],
            startX: 50,
            startY: 50,
            columns: 2,
            spacingX: 20,
            spacingY: 20,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Arranged 3 shapes in a grid');
    });

    it('should execute centerShape', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'centerShape',
          arguments: JSON.stringify({
            shapeId: 'rect-1',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Centered shape');
    });

    it('should execute distributeHorizontally', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'distributeHorizontally',
          arguments: JSON.stringify({
            shapeIds: ['rect-1', 'circle-1', 'text-1'],
            startX: 100,
            endX: 500,
            y: 200,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Distributed 3 shapes horizontally');
    });

    it('should execute distributeVertically', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'distributeVertically',
          arguments: JSON.stringify({
            shapeIds: ['rect-1', 'circle-1'],
            x: 200,
            startY: 100,
            endY: 500,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Distributed 2 shapes vertically');
    });

    it('should fail distribute with insufficient shapes', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'distributeHorizontally',
          arguments: JSON.stringify({
            shapeIds: ['rect-1'],
            startX: 100,
            endX: 500,
            y: 200,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Utility Tools', () => {
    it('should execute getCanvasBounds', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'getCanvasBounds',
          arguments: '{}',
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('width', 1200);
      expect(result.data).toHaveProperty('height', 800);
    });

    it('should execute clearCanvas with confirmation', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'clearCanvas',
          arguments: JSON.stringify({ confirm: true }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleared 3 shapes');
      expect(canvasService.deleteShape).toHaveBeenCalledTimes(3);
    });

    it('should fail clearCanvas without confirmation', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'clearCanvas',
          arguments: JSON.stringify({ confirm: false }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('CONFIRMATION_REQUIRED');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown function names', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'unknownFunction',
          arguments: '{}',
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_FUNCTION');
    });

    it('should handle invalid JSON arguments', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createRectangle',
          arguments: 'invalid json',
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Batch Execution', () => {
    it('should execute multiple tools in sequence', async () => {
      const toolCalls: AIToolCall[] = [
        {
          id: 'call-1',
          type: 'function',
          function: {
            name: 'createRectangle',
            arguments: JSON.stringify({ x: 0, y: 0, width: 50, height: 50, color: '#FF0000' }),
          },
        },
        {
          id: 'call-2',
          type: 'function',
          function: {
            name: 'createCircle',
            arguments: JSON.stringify({ x: 100, y: 100, radius: 25, color: '#00FF00' }),
          },
        },
      ];

      const results = await aiExecutorService.executeTools(toolCalls, mockContext);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(canvasService.createShape).toHaveBeenCalledTimes(2);
    });
  });
});

