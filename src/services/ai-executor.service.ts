import type { CanvasShape } from '../types/canvas.types';
import { createShape, updateShape, deleteShape } from './canvas.service';
import type { AIToolCall } from '../types/ai.types';

/**
 * Generate a unique ID for shapes
 */
const generateShapeId = (): string => {
  return `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Result of executing an AI tool
 */
export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * Context needed for tool execution
 */
export interface ExecutionContext {
  userId: string;
  shapes: CanvasShape[];
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * AI Tool Executor Service
 * Executes AI function calls by calling canvas service functions
 */
class AIExecutorService {
  /**
   * Execute a single tool call
   */
  async executeTool(
    toolCall: AIToolCall,
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      const functionName = toolCall.function.name;

      console.log(`[AI Executor] Executing tool: ${functionName}`, args);

      // Route to appropriate handler
      switch (functionName) {
        // Creation tools
        case 'createRectangle':
          return await this.createRectangle(args, context);
        case 'createCircle':
          return await this.createCircle(args, context);
        case 'createText':
          return await this.createText(args, context);
        case 'createMultipleShapes':
          return await this.createMultipleShapes(args, context);

        // Manipulation tools
        case 'moveShape':
          return await this.moveShape(args, context);
        case 'resizeShape':
          return await this.resizeShape(args, context);
        case 'changeColor':
          return await this.changeColor(args, context);
        case 'updateText':
          return await this.updateText(args, context);
        case 'deleteShape':
          return await this.deleteShape(args, context);
        case 'deleteMultipleShapes':
          return await this.deleteMultipleShapes(args, context);

        // Query tools
        case 'getCanvasState':
          return this.getCanvasState(context);
        case 'findShapesByType':
          return this.findShapesByType(args, context);
        case 'findShapesByColor':
          return this.findShapesByColor(args, context);
        case 'findShapesByText':
          return this.findShapesByText(args, context);

        // Layout tools
        case 'arrangeHorizontal':
          return await this.arrangeHorizontal(args, context);
        case 'arrangeVertical':
          return await this.arrangeVertical(args, context);
        case 'arrangeGrid':
          return await this.arrangeGrid(args, context);
        case 'centerShape':
          return await this.centerShape(args, context);
        case 'distributeHorizontally':
          return await this.distributeHorizontally(args, context);
        case 'distributeVertically':
          return await this.distributeVertically(args, context);

        // Utility tools
        case 'getCanvasBounds':
          return this.getCanvasBounds(context);
        case 'clearCanvas':
          return await this.clearCanvas(args, context);

        default:
          return {
            success: false,
            message: `Unknown function: ${functionName}`,
            error: 'UNKNOWN_FUNCTION',
          };
      }
    } catch (error) {
      console.error('[AI Executor] Error executing tool:', error);
      return {
        success: false,
        message: 'Failed to execute tool',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute multiple tool calls in sequence
   */
  async executeTools(
    toolCalls: AIToolCall[],
    context: ExecutionContext
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall, context);
      results.push(result);
    }

    return results;
  }

  // ==========================================
  // CREATION TOOLS IMPLEMENTATION
  // ==========================================

  private async createRectangle(
    args: { x: number; y: number; width: number; height: number; color: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'rectangle',
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
      color: args.color,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    await createShape(shape);

    return {
      success: true,
      message: `Created rectangle at (${args.x}, ${args.y})`,
      data: { shapeId: shape.id },
    };
  }

  private async createCircle(
    args: { x: number; y: number; radius: number; color: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'circle',
      x: args.x,
      y: args.y,
      radius: args.radius,
      color: args.color,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    await createShape(shape);

    return {
      success: true,
      message: `Created circle at (${args.x}, ${args.y})`,
      data: { shapeId: shape.id },
    };
  }

  private async createText(
    args: { x: number; y: number; text: string; fontSize?: number; color?: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'text',
      x: args.x,
      y: args.y,
      text: args.text,
      fontSize: args.fontSize || 24,
      color: args.color || '#000000',
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    await createShape(shape);

    return {
      success: true,
      message: `Created text "${args.text}" at (${args.x}, ${args.y})`,
      data: { shapeId: shape.id },
    };
  }

  private async createMultipleShapes(
    args: {
      shapes: Array<{
        type: 'rectangle' | 'circle' | 'text';
        x: number;
        y: number;
        width?: number;
        height?: number;
        radius?: number;
        text?: string;
        fontSize?: number;
        color: string;
      }>;
    },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const createdShapes: string[] = [];

    for (const shapeData of args.shapes) {
      const now = Date.now();
      let shape: CanvasShape;

      if (shapeData.type === 'rectangle') {
        shape = {
          id: generateShapeId(),
          type: 'rectangle',
          x: shapeData.x,
          y: shapeData.y,
          width: shapeData.width || 100,
          height: shapeData.height || 100,
          color: shapeData.color,
          createdBy: context.userId,
          createdAt: now,
          lastModifiedBy: context.userId,
          lastModifiedAt: now,
          lockedBy: null,
          lockedAt: null,
        };
      } else if (shapeData.type === 'circle') {
        shape = {
          id: generateShapeId(),
          type: 'circle',
          x: shapeData.x,
          y: shapeData.y,
          radius: shapeData.radius || 50,
          color: shapeData.color,
          createdBy: context.userId,
          createdAt: now,
          lastModifiedBy: context.userId,
          lastModifiedAt: now,
          lockedBy: null,
          lockedAt: null,
        };
      } else {
        shape = {
          id: generateShapeId(),
          type: 'text',
          x: shapeData.x,
          y: shapeData.y,
          text: shapeData.text || 'Text',
          fontSize: shapeData.fontSize || 24,
          color: shapeData.color,
          createdBy: context.userId,
          createdAt: now,
          lastModifiedBy: context.userId,
          lastModifiedAt: now,
          lockedBy: null,
          lockedAt: null,
        };
      }

      await createShape(shape);
      createdShapes.push(shape.id);
    }

    return {
      success: true,
      message: `Created ${createdShapes.length} shapes`,
      data: { shapeIds: createdShapes },
    };
  }

  // ==========================================
  // MANIPULATION TOOLS IMPLEMENTATION
  // ==========================================

  private async moveShape(
    args: { shapeId: string; x: number; y: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const shape = context.shapes.find((s) => s.id === args.shapeId);
    if (!shape) {
      return {
        success: false,
        message: `Shape ${args.shapeId} not found`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    await updateShape(args.shapeId, {
      x: args.x,
      y: args.y,
      lastModifiedBy: context.userId,
    });

    return {
      success: true,
      message: `Moved shape to (${args.x}, ${args.y})`,
    };
  }

  private async resizeShape(
    args: { shapeId: string; width?: number; height?: number; radius?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const shape = context.shapes.find((s) => s.id === args.shapeId);
    if (!shape) {
      return {
        success: false,
        message: `Shape ${args.shapeId} not found`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    const updates: Partial<CanvasShape> = { lastModifiedBy: context.userId };

    if (shape.type === 'rectangle' && args.width !== undefined && args.height !== undefined) {
      updates.width = args.width;
      updates.height = args.height;
    } else if (shape.type === 'circle' && args.radius !== undefined) {
      updates.radius = args.radius;
    } else {
      return {
        success: false,
        message: 'Invalid resize parameters for shape type',
        error: 'INVALID_PARAMETERS',
      };
    }

    await updateShape(args.shapeId, updates);

    return {
      success: true,
      message: `Resized ${shape.type}`,
    };
  }

  private async changeColor(
    args: { shapeId: string; color: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const shape = context.shapes.find((s) => s.id === args.shapeId);
    if (!shape) {
      return {
        success: false,
        message: `Shape ${args.shapeId} not found`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    await updateShape(args.shapeId, {
      color: args.color,
      lastModifiedBy: context.userId,
    });

    return {
      success: true,
      message: `Changed color to ${args.color}`,
    };
  }

  private async updateText(
    args: { shapeId: string; text?: string; fontSize?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const shape = context.shapes.find((s) => s.id === args.shapeId);
    if (!shape || shape.type !== 'text') {
      return {
        success: false,
        message: 'Text shape not found',
        error: 'SHAPE_NOT_FOUND',
      };
    }

    const updates: Partial<CanvasShape> = { lastModifiedBy: context.userId };
    if (args.text !== undefined) updates.text = args.text;
    if (args.fontSize !== undefined) updates.fontSize = args.fontSize;

    await updateShape(args.shapeId, updates);

    return {
      success: true,
      message: 'Updated text',
    };
  }

  private async deleteShape(
    args: { shapeId: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const shape = context.shapes.find((s) => s.id === args.shapeId);
    if (!shape) {
      return {
        success: false,
        message: `Shape ${args.shapeId} not found`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    await deleteShape(args.shapeId);

    return {
      success: true,
      message: `Deleted ${shape.type}`,
    };
  }

  private async deleteMultipleShapes(
    args: { shapeIds: string[] },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    let deleted = 0;

    for (const shapeId of args.shapeIds) {
      const shape = context.shapes.find((s) => s.id === shapeId);
      if (shape) {
        await deleteShape(shapeId);
        deleted++;
      }
    }

    return {
      success: true,
      message: `Deleted ${deleted} shapes`,
    };
  }

  // ==========================================
  // QUERY TOOLS IMPLEMENTATION
  // ==========================================

  private getCanvasState(context: ExecutionContext): ToolExecutionResult {
    return {
      success: true,
      message: `Canvas has ${context.shapes.length} shapes`,
      data: { shapes: context.shapes },
    };
  }

  private findShapesByType(
    args: { type: 'rectangle' | 'circle' | 'text' },
    context: ExecutionContext
  ): ToolExecutionResult {
    const shapes = context.shapes.filter((s) => s.type === args.type);

    return {
      success: true,
      message: `Found ${shapes.length} ${args.type} shapes`,
      data: { shapes, shapeIds: shapes.map((s) => s.id) },
    };
  }

  private findShapesByColor(
    args: { color: string },
    context: ExecutionContext
  ): ToolExecutionResult {
    const normalizedColor = args.color.toLowerCase();
    const shapes = context.shapes.filter((s) => s.color.toLowerCase() === normalizedColor);

    return {
      success: true,
      message: `Found ${shapes.length} shapes with color ${args.color}`,
      data: { shapes, shapeIds: shapes.map((s) => s.id) },
    };
  }

  private findShapesByText(
    args: { searchText: string },
    context: ExecutionContext
  ): ToolExecutionResult {
    const searchLower = args.searchText.toLowerCase();
    const shapes = context.shapes.filter(
      (s) => s.type === 'text' && s.text.toLowerCase().includes(searchLower)
    );

    return {
      success: true,
      message: `Found ${shapes.length} text shapes containing "${args.searchText}"`,
      data: { shapes, shapeIds: shapes.map((s) => s.id) },
    };
  }

  // ==========================================
  // LAYOUT TOOLS IMPLEMENTATION
  // ==========================================

  private async arrangeHorizontal(
    args: { shapeIds: string[]; startX: number; y: number; spacing?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const spacing = args.spacing || 20;
    let currentX = args.startX;

    for (const shapeId of args.shapeIds) {
      const shape = context.shapes.find((s) => s.id === shapeId);
      if (shape) {
        await updateShape(shapeId, {
          x: currentX,
          y: args.y,
          lastModifiedBy: context.userId,
        });

        // Calculate width for spacing
        const width = shape.type === 'rectangle' ? shape.width : shape.type === 'circle' ? shape.radius * 2 : 100;
        currentX += width + spacing;
      }
    }

    return {
      success: true,
      message: `Arranged ${args.shapeIds.length} shapes horizontally`,
    };
  }

  private async arrangeVertical(
    args: { shapeIds: string[]; x: number; startY: number; spacing?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const spacing = args.spacing || 20;
    let currentY = args.startY;

    for (const shapeId of args.shapeIds) {
      const shape = context.shapes.find((s) => s.id === shapeId);
      if (shape) {
        await updateShape(shapeId, {
          x: args.x,
          y: currentY,
          lastModifiedBy: context.userId,
        });

        // Calculate height for spacing
        const height = shape.type === 'rectangle' ? shape.height : shape.type === 'circle' ? shape.radius * 2 : 50;
        currentY += height + spacing;
      }
    }

    return {
      success: true,
      message: `Arranged ${args.shapeIds.length} shapes vertically`,
    };
  }

  private async arrangeGrid(
    args: {
      shapeIds: string[];
      startX: number;
      startY: number;
      columns: number;
      spacingX?: number;
      spacingY?: number;
    },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const spacingX = args.spacingX || 20;
    const spacingY = args.spacingY || 20;
    const cellWidth = 100;
    const cellHeight = 100;

    for (let i = 0; i < args.shapeIds.length; i++) {
      const row = Math.floor(i / args.columns);
      const col = i % args.columns;
      const x = args.startX + col * (cellWidth + spacingX);
      const y = args.startY + row * (cellHeight + spacingY);

      await updateShape(args.shapeIds[i], {
        x,
        y,
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Arranged ${args.shapeIds.length} shapes in a grid`,
    };
  }

  private async centerShape(
    args: { shapeId: string; canvasWidth?: number; canvasHeight?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const shape = context.shapes.find((s) => s.id === args.shapeId);
    if (!shape) {
      return {
        success: false,
        message: 'Shape not found',
        error: 'SHAPE_NOT_FOUND',
      };
    }

    const canvasWidth = args.canvasWidth || context.canvasWidth || 1200;
    const canvasHeight = args.canvasHeight || context.canvasHeight || 800;

    let centerX = canvasWidth / 2;
    let centerY = canvasHeight / 2;

    if (shape.type === 'rectangle') {
      centerX -= shape.width / 2;
      centerY -= shape.height / 2;
    } else if (shape.type === 'circle') {
      // Circle's x,y is already the center
    }

    await updateShape(args.shapeId, {
      x: centerX,
      y: centerY,
      lastModifiedBy: context.userId,
    });

    return {
      success: true,
      message: 'Centered shape',
    };
  }

  private async distributeHorizontally(
    args: { shapeIds: string[]; startX: number; endX: number; y: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const count = args.shapeIds.length;
    if (count < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to distribute',
        error: 'INVALID_PARAMETERS',
      };
    }

    const spacing = (args.endX - args.startX) / (count - 1);

    for (let i = 0; i < count; i++) {
      const x = args.startX + i * spacing;
      await updateShape(args.shapeIds[i], {
        x,
        y: args.y,
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Distributed ${count} shapes horizontally`,
    };
  }

  private async distributeVertically(
    args: { shapeIds: string[]; x: number; startY: number; endY: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const count = args.shapeIds.length;
    if (count < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to distribute',
        error: 'INVALID_PARAMETERS',
      };
    }

    const spacing = (args.endY - args.startY) / (count - 1);

    for (let i = 0; i < count; i++) {
      const y = args.startY + i * spacing;
      await updateShape(args.shapeIds[i], {
        x: args.x,
        y,
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Distributed ${count} shapes vertically`,
    };
  }

  // ==========================================
  // UTILITY TOOLS IMPLEMENTATION
  // ==========================================

  private getCanvasBounds(context: ExecutionContext): ToolExecutionResult {
    const width = context.canvasWidth || 1200;
    const height = context.canvasHeight || 800;

    return {
      success: true,
      message: `Canvas dimensions: ${width}x${height}`,
      data: { width, height },
    };
  }

  private async clearCanvas(
    args: { confirm: boolean },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    if (!args.confirm) {
      return {
        success: false,
        message: 'Clear canvas requires confirmation',
        error: 'CONFIRMATION_REQUIRED',
      };
    }

    const count = context.shapes.length;
    for (const shape of context.shapes) {
      await deleteShape(shape.id);
    }

    return {
      success: true,
      message: `Cleared ${count} shapes from canvas`,
    };
  }
}

// Export singleton instance
export const aiExecutorService = new AIExecutorService();
export default aiExecutorService;

