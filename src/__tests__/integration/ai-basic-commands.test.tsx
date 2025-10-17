import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiExecutorService, type ExecutionContext } from '../../services/ai-executor.service';
import type { AIToolCall } from '../../types/ai.types';
import type { CanvasShape } from '../../types/canvas.types';
import * as canvasService from '../../services/canvas.service';

vi.mock('../../services/canvas.service');

describe('AI Basic Commands - Integration Tests', () => {
  let mockContext: ExecutionContext;
  let mockShapes: CanvasShape[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockShapes = [
      {
        id: 'shape-1',
        type: 'circle',
        x: 100,
        y: 200,
        radius: 50,
        color: '#FF0000',
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
        x: 300,
        y: 400,
        width: 200,
        height: 100,
        color: '#0000FF',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
      {
        id: 'shape-3',
        type: 'text',
        x: 150,
        y: 150,
        text: 'Hello',
        fontSize: 24,
        color: '#000000',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      },
    ];

    mockContext = {
      userId: 'user-1',
      shapes: mockShapes,
      selectedShapeIds: [],
      canvasWidth: 1200,
      canvasHeight: 800,
    };

    vi.mocked(canvasService.createShape).mockResolvedValue('new-shape-id');
    vi.mocked(canvasService.updateShape).mockResolvedValue(undefined);
    vi.mocked(canvasService.deleteShape).mockResolvedValue(undefined);
  });

  describe('Creation Commands', () => {
    it('executes createCircle command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createCircle',
          arguments: JSON.stringify({
            x: 100,
            y: 200,
            radius: 50,
            color: 'red',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created circle');
      expect(canvasService.createShape).toHaveBeenCalledTimes(1);
    });

    it('executes createRectangle command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createRectangle',
          arguments: JSON.stringify({
            x: 50,
            y: 50,
            width: 200,
            height: 300,
            color: '#0000FF',
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created rectangle');
      expect(canvasService.createShape).toHaveBeenCalledTimes(1);
    });

    it('executes createText command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createText',
          arguments: JSON.stringify({
            x: 150,
            y: 150,
            text: 'Hello World',
            fontSize: 24,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created text');
      expect(canvasService.createShape).toHaveBeenCalledTimes(1);
    });

    it('AI-generated shapes persist to Firestore', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createCircle',
          arguments: JSON.stringify({
            x: 100,
            y: 200,
            radius: 50,
            color: 'red',
          }),
        },
      };

      await aiExecutorService.executeTool(toolCall, mockContext);

      expect(canvasService.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'circle',
          x: 100,
          y: 200,
          radius: 50,
          createdBy: 'user-1',
        })
      );
    });
  });

  describe('Manipulation Commands', () => {
    it('executes moveShapeByDescription command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'moveShapeByDescription',
          arguments: JSON.stringify({
            type: 'circle',
            x: 500,
            y: 600,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Moved shape');
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'shape-1',
        expect.objectContaining({
          x: 500,
          y: 600,
        })
      );
    });

    it('executes resizeShapeByDescription command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'resizeShapeByDescription',
          arguments: JSON.stringify({
            type: 'circle',
            scaleMultiplier: 2,
          }),
        },
      };

      // Add the circle to selected shapes
      const contextWithSelection: ExecutionContext = {
        ...mockContext,
        selectedShapeIds: ['shape-1'],
      };

      const result = await aiExecutorService.executeTool(toolCall, contextWithSelection);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Resized');
      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'shape-1',
        expect.objectContaining({
          radius: 100, // 50 * 2
        })
      );
    });

    it('executes rotateShapes command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'rotateShapes',
          arguments: JSON.stringify({
            shapeIds: [],
            rotation: 45,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Rotated');
      expect(canvasService.updateShape).toHaveBeenCalledTimes(3); // All 3 shapes
    });

    it('manipulation commands persist to Firestore', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'changeColor',
          arguments: JSON.stringify({
            shapeId: 'shape-1',
            color: '#00FF00',
          }),
        },
      };

      await aiExecutorService.executeTool(toolCall, mockContext);

      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'shape-1',
        expect.objectContaining({
          color: '#00FF00',
          lastModifiedBy: 'user-1',
        })
      );
    });
  });

  describe('AI-Generated Shapes Sync', () => {
    it('shapes created by AI include proper metadata for sync', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createRectangle',
          arguments: JSON.stringify({
            x: 100,
            y: 200,
            width: 150,
            height: 200,
            color: '#FF6B6B',
          }),
        },
      };

      await aiExecutorService.executeTool(toolCall, mockContext);

      // Verify shape has all required fields for real-time sync
      expect(canvasService.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          type: 'rectangle',
          createdBy: 'user-1',
          createdAt: expect.any(Number),
          lastModifiedBy: 'user-1',
          lastModifiedAt: expect.any(Number),
          lockedBy: null,
          lockedAt: null,
        })
      );
    });

    it('shapes updated by AI include lastModifiedBy for multi-user sync', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'moveShape',
          arguments: JSON.stringify({
            shapeId: 'shape-1',
            x: 250,
            y: 350,
          }),
        },
      };

      await aiExecutorService.executeTool(toolCall, mockContext);

      expect(canvasService.updateShape).toHaveBeenCalledWith(
        'shape-1',
        expect.objectContaining({
          lastModifiedBy: 'user-1',
        })
      );
    });
  });

  describe('Layout Commands', () => {
    it('executes arrangeHorizontal command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'arrangeHorizontal',
          arguments: JSON.stringify({
            shapeIds: [],
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Arranged');
      // Should update all 3 shapes
      expect(canvasService.updateShape).toHaveBeenCalledTimes(3);
    });

    it('executes alignLeft command correctly', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'alignLeft',
          arguments: JSON.stringify({
            shapeIds: [],
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Aligned');
      // Needs at least 2 shapes - should update all 3
      expect(canvasService.updateShape).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('returns error when shape not found', async () => {
      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'moveShape',
          arguments: JSON.stringify({
            shapeId: 'non-existent-id',
            x: 100,
            y: 200,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SHAPE_NOT_FOUND');
    });

    it('handles Firestore errors gracefully', async () => {
      vi.mocked(canvasService.createShape).mockRejectedValue(new Error('Firestore error'));

      const toolCall: AIToolCall = {
        id: 'call-1',
        type: 'function',
        function: {
          name: 'createCircle',
          arguments: JSON.stringify({
            x: 100,
            y: 200,
          }),
        },
      };

      const result = await aiExecutorService.executeTool(toolCall, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

