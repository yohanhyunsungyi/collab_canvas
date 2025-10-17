import type { CanvasShape } from '../types/canvas.types';
import { createShape, updateShape, deleteShape } from './canvas.service';
import type { AIToolCall } from '../types/ai.types';
import { normalizeHexColor, resolveColorQuery } from '../utils/colorMatching';
import { SHAPE_COLORS } from '../utils/colors';

/**
 * Generate a unique ID for shapes
 */
const generateShapeId = (): string => {
  return `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Get a random color from the shape color palette
 */
const getRandomColor = (): string => {
  return SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];
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
  selectedShapeIds?: string[];
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

        // Smart manipulation tools (with auto-lookup)
        case 'moveShapeByDescription':
          return await this.moveShapeByDescription(args, context);
        case 'resizeShapeByDescription':
          return await this.resizeShapeByDescription(args, context);
        case 'rotateShapeByDescription':
          return await this.rotateShapeByDescription(args, context);

        // Manipulation tools
        case 'moveShape':
          return await this.moveShape(args, context);
        case 'resizeShape':
          return await this.resizeShape(args, context);
        case 'rotateShape':
          return await this.rotateShape(args, context);
        case 'rotateShapes':
          return await this.rotateShapes(args, context);
        case 'changeColor':
          return await this.changeColor(args, context);
        case 'updateText':
          return await this.updateText(args, context);
        case 'changeFontSize':
          return await this.changeFontSize(args, context);
        case 'deleteShape':
          return await this.deleteShape(args, context);
        case 'deleteMultipleShapes':
          return await this.deleteMultipleShapes(args, context);

        // Batch manipulation tools
        case 'moveMultipleShapes':
          return await this.moveMultipleShapes(args, context);

        // Query tools
        case 'getCanvasState':
          return this.getCanvasState(context);
        case 'findShapesByType':
          return this.findShapesByType(args, context);
        case 'findShapesByColor':
          return this.findShapesByColor(args, context);
        case 'findShapesByText':
          return this.findShapesByText(args, context);

        // Alignment tools (from toolbar)
        case 'alignLeft':
          return await this.alignLeft(args, context);
        case 'alignCenter':
          return await this.alignCenter(args, context);
        case 'alignRight':
          return await this.alignRight(args, context);

        // Distribution tools (from toolbar)
        case 'arrangeHorizontal':
          return await this.arrangeHorizontal(args, context);
        case 'distributeHorizontally':
          return await this.distributeHorizontally(args, context);
        case 'distributeVertically':
          return await this.distributeVertically(args, context);

        // Legacy layout tools (kept for backward compatibility)
        case 'arrangeVertical':
          return await this.arrangeVertical(args, context);
        case 'arrangeGrid':
          return await this.arrangeGrid(args, context);
        case 'centerShape':
          return await this.centerShape(args, context);
        case 'distributeEvenly':
          return await this.distributeEvenly(args, context);

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
    const executionContext: ExecutionContext = {
      ...context,
      shapes: context.shapes.map((shape) => ({ ...shape } as CanvasShape)),
      selectedShapeIds: context.selectedShapeIds ? [...context.selectedShapeIds] : [],
    };
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall, executionContext);
      results.push(result);
    }

    return results;
  }

  /**
   * Filter shapes by color using natural language resolution
   */
  private filterShapesByColorDescription(shapes: CanvasShape[], color: string): CanvasShape[] {
    const { direct, fallback } = resolveColorQuery(color);
    const normalizedQuery = normalizeHexColor(color);
    const candidateColors = direct.size > 0 ? direct : fallback;

    return shapes.filter((shape) => {
      const normalizedShapeColor = normalizeHexColor(shape.color);

      if (candidateColors.size > 0 && normalizedShapeColor) {
        return candidateColors.has(normalizedShapeColor);
      }

      if (normalizedQuery && normalizedShapeColor) {
        return normalizedShapeColor === normalizedQuery;
      }

      return shape.color.toLowerCase() === color.toLowerCase();
    });
  }

  // ==========================================
  // CREATION TOOLS IMPLEMENTATION
  // ==========================================

  private async createRectangle(
    args: { x?: number; y?: number; width: number; height: number; color?: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    // Default to center-ish position (-100, -100) in centered coordinate system
    const defaultX = args.x ?? -100;
    const defaultY = args.y ?? -100;
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'rectangle',
      x: defaultX,
      y: defaultY,
      width: args.width,
      height: args.height,
      color: args.color ?? getRandomColor(),
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    await createShape(shape);
    context.shapes.push(shape);

    return {
      success: true,
      message: `Created rectangle at (${shape.x}, ${shape.y})`,
      data: { shapeId: shape.id },
    };
  }

  private async createCircle(
    args: { x?: number; y?: number; radius?: number; color?: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    // Default to center-ish position (0, 0) in centered coordinate system
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'circle',
      x: args.x ?? 0,
      y: args.y ?? 0,
      radius: args.radius ?? 50,
      color: args.color ?? getRandomColor(),
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    await createShape(shape);
    context.shapes.push(shape);

    return {
      success: true,
      message: `Created circle at (${shape.x}, ${shape.y})`,
      data: { shapeId: shape.id },
    };
  }

  private async createText(
    args: { x?: number; y?: number; text: string; fontSize?: number; color?: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    // Default to center-ish position (-50, -50) in centered coordinate system
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'text',
      x: args.x ?? -50,
      y: args.y ?? -50,
      text: args.text,
      fontSize: args.fontSize ?? 24,
      color: args.color ?? getRandomColor(),
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    };

    await createShape(shape);
    context.shapes.push(shape);

    return {
      success: true,
      message: `Created text "${args.text}" at (${shape.x}, ${shape.y})`,
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
          color: shapeData.color ?? getRandomColor(),
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
          color: shapeData.color ?? getRandomColor(),
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
          color: shapeData.color ?? getRandomColor(),
          createdBy: context.userId,
          createdAt: now,
          lastModifiedBy: context.userId,
          lastModifiedAt: now,
          lockedBy: null,
          lockedAt: null,
        };
      }

      await createShape(shape);
      context.shapes.push(shape);
      createdShapes.push(shape.id);
    }

    return {
      success: true,
      message: `Created ${createdShapes.length} shapes`,
      data: { shapeIds: createdShapes },
    };
  }

  // ==========================================
  // SMART MANIPULATION TOOLS IMPLEMENTATION
  // ==========================================

  private async moveShapeByDescription(
    args: { type?: string; color?: string; x: number; y: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Find shapes matching the description
    let matchingShapes = context.shapes;

    if (args.type) {
      matchingShapes = matchingShapes.filter(s => s.type === args.type);
    }

    if (args.color) {
      matchingShapes = this.filterShapesByColorDescription(matchingShapes, args.color);
    }

    if (matchingShapes.length === 0) {
      return {
        success: false,
        message: `No ${args.color || ''} ${args.type || 'shape'} found on canvas`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = matchingShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Call the underlying moveShape method
    return await this.moveShape({ shapeId: targetShape.id, x: args.x, y: args.y }, context);
  }

  private async resizeShapeByDescription(
    args: { type?: string; color?: string; scaleMultiplier?: number; newWidth?: number; newHeight?: number; newRadius?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Find shapes matching the description
    const applyFilters = (shapes: CanvasShape[]) => {
      let result = shapes;

      if (args.type) {
        result = result.filter((s) => s.type === args.type);
      }

      if (args.color) {
        result = this.filterShapesByColorDescription(result, args.color);
      }

      return result;
    };

    const matchingShapes = applyFilters(context.shapes);
    const selectedShapes =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? applyFilters(
            context.shapes.filter((shape) =>
              context.selectedShapeIds!.includes(shape.id)
            )
          )
        : [];
    const candidateShapes = selectedShapes.length > 0 ? selectedShapes : matchingShapes;

    if (candidateShapes.length === 0) {
      if (args.type) {
        const friendlyType =
          args.type === 'circle'
            ? 'circle'
            : args.type === 'rectangle'
              ? 'rectangle'
              : args.type === 'text'
                ? 'text'
                : 'shape';

        return {
          success: false,
          message: `Select a ${friendlyType} object.`,
          error: 'SHAPE_NOT_FOUND',
        };
      }

      return {
        success: false,
        message: `No ${args.color || ''} ${args.type || 'shape'} found on canvas`,
        error: 'SHAPE_NOT_FOUND',
      };
    } else if (args.type && selectedShapes.length === 0) {
      const friendlyType =
        args.type === 'circle'
          ? 'circle'
          : args.type === 'rectangle'
            ? 'rectangle'
            : args.type === 'text'
              ? 'text'
              : 'shape';

      return {
        success: false,
        message: `Select a ${friendlyType} object.`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = candidateShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Calculate new dimensions
    const resizeArgs: { shapeId: string; width?: number; height?: number; radius?: number } = {
      shapeId: targetShape.id,
    };

    if (args.scaleMultiplier) {
      // Scale current dimensions
      if (targetShape.type === 'rectangle') {
        resizeArgs.width = targetShape.width * args.scaleMultiplier;
        resizeArgs.height = targetShape.height * args.scaleMultiplier;
      } else if (targetShape.type === 'circle') {
        resizeArgs.radius = targetShape.radius * args.scaleMultiplier;
      }
    } else {
      // Use explicit dimensions
      if (args.newWidth !== undefined) resizeArgs.width = args.newWidth;
      if (args.newHeight !== undefined) resizeArgs.height = args.newHeight;
      if (args.newRadius !== undefined) resizeArgs.radius = args.newRadius;
    }

    // Call the underlying resizeShape method
    return await this.resizeShape(resizeArgs, context);
  }

  private async rotateShapeByDescription(
    args: { type?: string; color?: string; rotation: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Find shapes matching the description
    let matchingShapes = context.shapes;

    if (args.type) {
      matchingShapes = matchingShapes.filter(s => s.type === args.type);
    }

    if (args.color) {
      matchingShapes = this.filterShapesByColorDescription(matchingShapes, args.color);
    }

    if (matchingShapes.length === 0) {
      return {
        success: false,
        message: `No ${args.color || ''} ${args.type || 'shape'} found on canvas`,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = matchingShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Call the underlying rotateShape method
    return await this.rotateShape({ shapeId: targetShape.id, rotation: args.rotation }, context);
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

    try {
      await updateShape(args.shapeId, {
        x: args.x,
        y: args.y,
        lastModifiedBy: context.userId,
      });

      return {
        success: true,
        message: `Moved shape to (${args.x}, ${args.y})`,
      };
    } catch (error) {
      console.error('[AI Executor] Error moving shape:', error);
      return {
        success: false,
        message: `Failed to move shape: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'UPDATE_FAILED',
      };
    }
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

    try {
      await updateShape(args.shapeId, updates);

      return {
        success: true,
        message: `Resized ${shape.type}`,
      };
    } catch (error) {
      console.error('[AI Executor] Error resizing shape:', error);
      return {
        success: false,
        message: `Failed to resize shape: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'UPDATE_FAILED',
      };
    }
  }

  private async rotateShape(
    args: { shapeId: string; rotation: number },
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

    try {
      await updateShape(args.shapeId, {
        rotation: args.rotation,
        lastModifiedBy: context.userId,
      });

      return {
        success: true,
        message: `Rotated shape to ${args.rotation} degrees`,
      };
    } catch (error) {
      console.error('[AI Executor] Error rotating shape:', error);
      return {
        success: false,
        message: `Failed to rotate shape: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'UPDATE_FAILED',
      };
    }
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

  private async changeFontSize(
    args: { shapeIds: string[]; fontSize: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use the SAME LOGIC as toolbar's handleFontSizeChange
    // Priority: 1) explicit shapeIds, 2) selected shapes, 3) all text shapes on canvas
    let shapeIds = args.shapeIds;
    
    if (shapeIds.length === 0) {
      // If no shapeIds provided, check if shapes are selected
      if (context.selectedShapeIds && context.selectedShapeIds.length > 0) {
        shapeIds = context.selectedShapeIds;
      } else {
        // If nothing selected, find all text shapes on canvas
        const allTextShapes = context.shapes.filter(s => s.type === 'text');
        shapeIds = allTextShapes.map(s => s.id);
      }
    }

    if (shapeIds.length === 0) {
      return {
        success: false,
        message: 'No text shapes found on canvas',
        error: 'NO_TEXT_SHAPES',
      };
    }

    // Update only text shapes (matching toolbar behavior)
    let updatedCount = 0;
    for (const shapeId of shapeIds) {
      const shape = context.shapes.find(s => s.id === shapeId);
      if (shape && shape.type === 'text') {
        await updateShape(shapeId, {
          fontSize: args.fontSize,
          lastModifiedBy: context.userId,
        });
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      return {
        success: false,
        message: 'No text shapes found to update',
        error: 'NO_TEXT_SHAPES',
      };
    }

    return {
      success: true,
      message: `Changed font size to ${args.fontSize}px for ${updatedCount} text shape(s)`,
    };
  }

  private async rotateShapes(
    args: { shapeIds: string[]; rotation: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Toolbar-style logic: rotate selected shapes or all shapes if none selected
    // Priority: 1) explicit shapeIds, 2) selected shapes, 3) all shapes on canvas
    let shapeIds = args.shapeIds;
    
    if (shapeIds.length === 0) {
      // If no shapeIds provided, check if shapes are selected
      if (context.selectedShapeIds && context.selectedShapeIds.length > 0) {
        shapeIds = context.selectedShapeIds;
      } else {
        // If nothing selected, rotate all shapes on canvas
        shapeIds = context.shapes.map(s => s.id);
      }
    }

    if (shapeIds.length === 0) {
      return {
        success: false,
        message: 'No shapes found to rotate',
        error: 'NO_SHAPES',
      };
    }

    // Rotate all specified shapes
    let rotatedCount = 0;
    for (const shapeId of shapeIds) {
      const shape = context.shapes.find(s => s.id === shapeId);
      if (shape) {
        await updateShape(shapeId, {
          rotation: args.rotation,
          lastModifiedBy: context.userId,
        });
        rotatedCount++;
      }
    }

    if (rotatedCount === 0) {
      return {
        success: false,
        message: 'No shapes found to rotate',
        error: 'NO_SHAPES',
      };
    }

    return {
      success: true,
      message: `Rotated ${rotatedCount} shape(s) to ${args.rotation} degrees`,
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
    const index = context.shapes.findIndex((s) => s.id === args.shapeId);
    if (index >= 0) {
      context.shapes.splice(index, 1);
    }
    if (context.selectedShapeIds) {
      context.selectedShapeIds = context.selectedShapeIds.filter((id) => id !== args.shapeId);
    }

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
        const index = context.shapes.findIndex((s) => s.id === shapeId);
        if (index >= 0) {
          context.shapes.splice(index, 1);
        }
      }
    }
    if (context.selectedShapeIds) {
      context.selectedShapeIds = context.selectedShapeIds.filter((id) => !args.shapeIds.includes(id));
    }

    return {
      success: true,
      message: `Deleted ${deleted} shapes`,
    };
  }

  // ==========================================
  // BATCH MANIPULATION TOOLS IMPLEMENTATION
  // ==========================================

  private async moveMultipleShapes(
    args: { 
      shapeIds: string[]; 
      deltaX?: number; 
      deltaY?: number; 
      x?: number; 
      y?: number; 
    },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // If shapeIds is empty, use all shapes
    const targetIds = args.shapeIds.length === 0 
      ? context.shapes.map(s => s.id) 
      : args.shapeIds;
    
    let movedCount = 0;
    const errors: string[] = [];

    for (const shapeId of targetIds) {
      const shape = context.shapes.find((s) => s.id === shapeId);
      if (!shape) {
        errors.push(`Shape ${shapeId} not found`);
        continue;
      }

      // Calculate new position
      let newX = shape.x;
      let newY = shape.y;

      if (args.deltaX !== undefined) {
        newX += args.deltaX;
      } else if (args.x !== undefined) {
        newX = args.x;
      }

      if (args.deltaY !== undefined) {
        newY += args.deltaY;
      } else if (args.y !== undefined) {
        newY = args.y;
      }

      try {
        await updateShape(shapeId, {
          x: newX,
          y: newY,
          lastModifiedBy: context.userId,
        });
        movedCount++;
      } catch (error) {
        errors.push(`Failed to move ${shapeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const message = errors.length > 0
      ? `Moved ${movedCount}/${targetIds.length} shapes. ${errors.length} errors.`
      : `Successfully moved ${movedCount} shapes`;

    return {
      success: errors.length === 0,
      message,
      data: { movedCount, totalShapes: targetIds.length, errors },
      error: errors.length > 0 ? errors.join('; ') : undefined,
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
    const { direct, fallback } = resolveColorQuery(args.color);

    const normalizedShapes = context.shapes
      .map((shape) => ({
        shape,
        hex: normalizeHexColor(shape.color),
      }))
      .filter((entry): entry is { shape: CanvasShape; hex: string } => !!entry.hex);

    const candidateColors =
      direct.size > 0 ? direct : fallback.size > 0 ? fallback : new Set<string>();

    const matchingShapes =
      candidateColors.size === 0
        ? normalizedShapes.filter((entry) => {
            const shapeColor = entry.hex;
            const requestedColor = normalizeHexColor(args.color);
            return requestedColor ? shapeColor === requestedColor : false;
          })
        : normalizedShapes.filter((entry) => candidateColors.has(entry.hex));

    return {
      success: true,
      message:
        matchingShapes.length > 0
          ? `Found ${matchingShapes.length} shapes matching color "${args.color}"`
          : `No shapes matched color "${args.color}"`,
      data: {
        shapes: matchingShapes.map((entry) => entry.shape),
        shapeIds: matchingShapes.map((entry) => entry.shape.id),
      },
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
  // Using the EXACT SAME logic as Canvas.tsx toolbar buttons
  // ==========================================

  // Helper functions - copied directly from Canvas.tsx
  private getShapeLeft(shape: CanvasShape): number {
    if (shape.type === 'circle') return shape.x - shape.radius;
    if (shape.type === 'rectangle') return shape.x;
    if (shape.type === 'text') return shape.x;
    return shape.x;
  }

  private getShapeRight(shape: CanvasShape): number {
    if (shape.type === 'circle') return shape.x + shape.radius;
    if (shape.type === 'rectangle') return shape.x + shape.width;
    if (shape.type === 'text') return shape.x + (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
    return shape.x;
  }

  private getShapeTop(shape: CanvasShape): number {
    if (shape.type === 'circle') return shape.y - shape.radius;
    if (shape.type === 'rectangle') return shape.y;
    if (shape.type === 'text') return shape.y;
    return shape.y;
  }

  private getShapeBottom(shape: CanvasShape): number {
    if (shape.type === 'circle') return shape.y + shape.radius;
    if (shape.type === 'rectangle') return shape.y + shape.height;
    if (shape.type === 'text') return shape.y + (shape.fontSize || 24);
    return shape.y;
  }

  private getShapeWidth(shape: CanvasShape): number {
    if (shape.type === 'circle') return shape.radius * 2;
    if (shape.type === 'rectangle') return shape.width;
    if (shape.type === 'text') return (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
    return 0;
  }

  private getShapeHeight(shape: CanvasShape): number {
    if (shape.type === 'circle') return shape.radius * 2;
    if (shape.type === 'rectangle') return shape.height;
    if (shape.type === 'text') return shape.fontSize || 24;
    return 0;
  }

  private setShapeLeft(shape: CanvasShape, left: number): number {
    if (shape.type === 'circle') return left + shape.radius;
    return left;
  }

  private setShapeCenterX(shape: CanvasShape, centerX: number): number {
    if (shape.type === 'circle') return centerX;
    if (shape.type === 'rectangle') return centerX - shape.width / 2;
    if (shape.type === 'text') return centerX - ((shape.text?.length || 0) * (shape.fontSize || 24) * 0.6) / 2;
    return centerX;
  }

  private setShapeRight(shape: CanvasShape, rightX: number): number {
    if (shape.type === 'circle') return rightX - shape.radius;
    if (shape.type === 'rectangle') return rightX - shape.width;
    if (shape.type === 'text') return rightX - (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
    return rightX;
  }

  private setShapeTop(shape: CanvasShape, topY: number): number {
    if (shape.type === 'circle') return topY + shape.radius;
    return topY;
  }

  // ==========================================
  // ALIGNMENT TOOLS - Using toolbar's handleAlignLeft/Center/Right logic
  // ==========================================

  private async alignLeft(
    args: { shapeIds: string[] },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const defaultIds =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? context.selectedShapeIds
        : context.shapes.map((s) => s.id);
    const shapeIds = args.shapeIds.length === 0 ? defaultIds : args.shapeIds;
    
    if (shapeIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to align',
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => shapeIds.includes(s.id));
    const leftmostX = Math.min(...selectedShapes.map(s => this.getShapeLeft(s)));
    
    for (const shape of selectedShapes) {
      await updateShape(shape.id, {
        x: this.setShapeLeft(shape, leftmostX),
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Aligned ${selectedShapes.length} shapes to the left`,
    };
  }

  private async alignCenter(
    args: { shapeIds: string[] },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const defaultIds =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? context.selectedShapeIds
        : context.shapes.map((s) => s.id);
    const shapeIds = args.shapeIds.length === 0 ? defaultIds : args.shapeIds;
    
    if (shapeIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to align',
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => shapeIds.includes(s.id));
    
    // Find the bounding box center
    const leftmostX = Math.min(...selectedShapes.map(s => this.getShapeLeft(s)));
    const rightmostX = Math.max(...selectedShapes.map(s => this.getShapeRight(s)));
    const centerX = (leftmostX + rightmostX) / 2;
    
    for (const shape of selectedShapes) {
      await updateShape(shape.id, {
        x: this.setShapeCenterX(shape, centerX),
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Aligned ${selectedShapes.length} shapes to the center`,
    };
  }

  private async alignRight(
    args: { shapeIds: string[] },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const defaultIds =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? context.selectedShapeIds
        : context.shapes.map((s) => s.id);
    const shapeIds = args.shapeIds.length === 0 ? defaultIds : args.shapeIds;
    
    if (shapeIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to align',
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => shapeIds.includes(s.id));
    const rightmostX = Math.max(...selectedShapes.map(s => this.getShapeRight(s)));
    
    for (const shape of selectedShapes) {
      await updateShape(shape.id, {
        x: this.setShapeRight(shape, rightmostX),
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Aligned ${selectedShapes.length} shapes to the right`,
    };
  }

  // ==========================================
  // DISTRIBUTE TOOLS - Using toolbar's handleDistribute logic
  // ==========================================

  private async arrangeHorizontal(
    args: { shapeIds: string[]; startX?: number; y?: number; spacing?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Get shapes to arrange
    const defaultIds =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? context.selectedShapeIds
        : context.shapes.map((s) => s.id);
    const shapeIds =
      args.shapeIds.length === 0 ? defaultIds : args.shapeIds;
    const uniqueShapeIds = Array.from(new Set(shapeIds));

    if (uniqueShapeIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to arrange horizontally',
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => uniqueShapeIds.includes(s.id));
    
    if (selectedShapes.length < 2) {
      return {
        success: false,
        message: 'Could not find enough shapes to arrange',
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the SAME LOGIC as toolbar's handleDistributeHorizontally
    // Sort shapes by their left edge
    const sortedShapes = [...selectedShapes].sort((a, b) => this.getShapeLeft(a) - this.getShapeLeft(b));
    
    // Keep the leftmost and rightmost shapes in place
    const leftmostLeft = this.getShapeLeft(sortedShapes[0]);
    const rightmostRight = this.getShapeRight(sortedShapes[sortedShapes.length - 1]);
    const totalSpace = rightmostRight - leftmostLeft;
    
    // Calculate total width of all shapes
    const totalShapeWidth = sortedShapes.reduce((sum, shape) => sum + this.getShapeWidth(shape), 0);
    
    // Calculate spacing between shapes
    const spacing = (totalSpace - totalShapeWidth) / (sortedShapes.length - 1);
    
    // Position each shape
    let currentLeft = leftmostLeft;
    for (const shape of sortedShapes) {
      await updateShape(shape.id, {
        x: this.setShapeLeft(shape, currentLeft),
        lastModifiedBy: context.userId,
      });
      currentLeft += this.getShapeWidth(shape) + spacing;
    }

    return {
      success: true,
      message: `Arranged ${sortedShapes.length} shapes horizontally`,
    };
  }

  private async arrangeVertical(
    args: { shapeIds: string[]; x?: number; startY?: number; spacing?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const spacing = args.spacing ?? 120;
    const x = args.x ?? 100;
    const startY = args.startY ?? 100;
    
    // If shapeIds is empty, use all shapes from canvas
    const targetShapeIds = args.shapeIds.length === 0 
      ? context.shapes.map(s => s.id)
      : args.shapeIds;

    let currentY = startY;

    for (const shapeId of targetShapeIds) {
      const shape = context.shapes.find((s) => s.id === shapeId);
      if (shape) {
        await updateShape(shapeId, {
          x: x,
          y: currentY,
          lastModifiedBy: context.userId,
        });

        // Update shape in context
        const shapeIndex = context.shapes.findIndex((s) => s.id === shapeId);
        if (shapeIndex !== -1) {
          context.shapes[shapeIndex] = { ...shape, x, y: currentY };
        }

        // Calculate height for spacing
        const height = shape.type === 'rectangle' ? shape.height : shape.type === 'circle' ? shape.radius * 2 : 50;
        currentY += height + spacing;
      }
    }

    return {
      success: true,
      message: `Arranged ${targetShapeIds.length} shapes vertically`,
    };
  }

  private async arrangeGrid(
    args: {
      shapeIds: string[];
      startX?: number;
      startY?: number;
      columns: number;
      spacingX?: number;
      spacingY?: number;
    },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Get shapes to arrange (support empty array to arrange all shapes)
    let defaultIds: string[];
    
    if (args.shapeIds.length === 0) {
      // When shapeIds=[], use context.shapes instead of Firestore
      // This ensures we arrange the shapes that were just created in the same execution context
      defaultIds =
        context.selectedShapeIds && context.selectedShapeIds.length > 0
          ? context.selectedShapeIds
          : context.shapes.map((s) => s.id);
    } else {
      defaultIds = args.shapeIds;
    }
    
    const uniqueShapeIds = Array.from(new Set(defaultIds));

    if (uniqueShapeIds.length === 0) {
      return {
        success: false,
        message: 'No shapes to arrange in grid',
        error: 'NO_SHAPES',
      };
    }

    const spacingX = args.spacingX || 20;
    const spacingY = args.spacingY || 20;
    const cellWidth = 100;
    const cellHeight = 100;

    // Calculate default start position (centered for the grid)
    const rows = Math.ceil(uniqueShapeIds.length / args.columns);
    const gridWidth = args.columns * (cellWidth + spacingX) - spacingX;
    const gridHeight = rows * (cellHeight + spacingY) - spacingY;
    const defaultStartX = args.startX ?? -gridWidth / 2;
    const defaultStartY = args.startY ?? -gridHeight / 2;

    for (let i = 0; i < uniqueShapeIds.length; i++) {
      const row = Math.floor(i / args.columns);
      const col = i % args.columns;
      const x = defaultStartX + col * (cellWidth + spacingX);
      const y = defaultStartY + row * (cellHeight + spacingY);

      await updateShape(uniqueShapeIds[i], {
        x,
        y,
        lastModifiedBy: context.userId,
      });
    }

    return {
      success: true,
      message: `Arranged ${uniqueShapeIds.length} shapes in a ${args.columns}-column grid`,
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

    // Canvas uses centered coordinate system where (0, 0) is at the center
    let centerX = 0;
    let centerY = 0;

    if (shape.type === 'rectangle') {
      // For rectangles, x,y is top-left corner, so offset by half dimensions
      centerX -= shape.width / 2;
      centerY -= shape.height / 2;
    } else if (shape.type === 'circle') {
      // Circle's x,y is already the center
    } else if (shape.type === 'text') {
      // For text, x,y is top-left corner, so offset by half dimensions
      const textWidth = (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
      const textHeight = shape.fontSize || 24;
      centerX -= textWidth / 2;
      centerY -= textHeight / 2;
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
    args: { shapeIds: string[]; startX?: number; endX?: number; y?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Get shapes to distribute
    const defaultIds =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? context.selectedShapeIds
        : context.shapes.map((s) => s.id);
    const shapeIds =
      args.shapeIds.length === 0 ? defaultIds : args.shapeIds;
    const uniqueShapeIds = Array.from(new Set(shapeIds));

    if (uniqueShapeIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to distribute',
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => uniqueShapeIds.includes(s.id));
    
    if (selectedShapes.length < 2) {
      return {
        success: false,
        message: 'Could not find enough shapes to distribute',
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the SAME LOGIC as toolbar's handleDistributeHorizontally
    // This is identical to arrangeHorizontal - they use the same toolbar function
    const sortedShapes = [...selectedShapes].sort((a, b) => this.getShapeLeft(a) - this.getShapeLeft(b));
    
    const leftmostLeft = this.getShapeLeft(sortedShapes[0]);
    const rightmostRight = this.getShapeRight(sortedShapes[sortedShapes.length - 1]);
    const totalSpace = rightmostRight - leftmostLeft;
    
    const totalShapeWidth = sortedShapes.reduce((sum, shape) => sum + this.getShapeWidth(shape), 0);
    const spacing = (totalSpace - totalShapeWidth) / (sortedShapes.length - 1);
    
    let currentLeft = leftmostLeft;
    for (const shape of sortedShapes) {
      await updateShape(shape.id, {
        x: this.setShapeLeft(shape, currentLeft),
        lastModifiedBy: context.userId,
      });
      currentLeft += this.getShapeWidth(shape) + spacing;
    }

    return {
      success: true,
      message: `Distributed ${sortedShapes.length} shapes horizontally`,
    };
  }

  private async distributeVertically(
    args: { shapeIds: string[]; x?: number; startY?: number; endY?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Get shapes to distribute
    const defaultIds =
      context.selectedShapeIds && context.selectedShapeIds.length > 0
        ? context.selectedShapeIds
        : context.shapes.map((s) => s.id);
    const shapeIds =
      args.shapeIds.length === 0 ? defaultIds : args.shapeIds;
    const uniqueShapeIds = Array.from(new Set(shapeIds));

    if (uniqueShapeIds.length < 2) {
      return {
        success: false,
        message: 'Need at least 2 shapes to distribute',
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => uniqueShapeIds.includes(s.id));
    
    if (selectedShapes.length < 2) {
      return {
        success: false,
        message: 'Could not find enough shapes to distribute',
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the SAME LOGIC as toolbar's handleDistributeVertically
    const sortedShapes = [...selectedShapes].sort((a, b) => this.getShapeTop(a) - this.getShapeTop(b));
    
    const topmostTop = this.getShapeTop(sortedShapes[0]);
    const bottommostBottom = this.getShapeBottom(sortedShapes[sortedShapes.length - 1]);
    const totalSpace = bottommostBottom - topmostTop;
    
    const totalShapeHeight = sortedShapes.reduce((sum, shape) => sum + this.getShapeHeight(shape), 0);
    const spacing = (totalSpace - totalShapeHeight) / (sortedShapes.length - 1);
    
    let currentTop = topmostTop;
    for (const shape of sortedShapes) {
      await updateShape(shape.id, {
        y: this.setShapeTop(shape, currentTop),
        lastModifiedBy: context.userId,
      });
      currentTop += this.getShapeHeight(shape) + spacing;
    }

    return {
      success: true,
      message: `Distributed ${sortedShapes.length} shapes vertically`,
    };
  }

  private async distributeEvenly(
    args: { shapeIds: string[]; direction: 'horizontal' | 'vertical' },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    if (args.direction === 'horizontal') {
      return await this.distributeHorizontally({ shapeIds: args.shapeIds }, context);
    } else if (args.direction === 'vertical') {
      return await this.distributeVertically({ shapeIds: args.shapeIds }, context);
    } else {
      return {
        success: false,
        message: 'Invalid direction. Must be "horizontal" or "vertical"',
        error: 'INVALID_DIRECTION',
      };
    }
  }

  // ==========================================
  // UTILITY TOOLS IMPLEMENTATION
  // ==========================================

  private getCanvasBounds(context: ExecutionContext): ToolExecutionResult {
    const width = context.canvasWidth || 5000;
    const height = context.canvasHeight || 5000;
    const minX = -width / 2;
    const maxX = width / 2;
    const minY = -height / 2;
    const maxY = height / 2;

    return {
      success: true,
      message: `Canvas dimensions: ${width}x${height}. Coordinate system: x from ${minX} to ${maxX}, y from ${minY} to ${maxY}. Center is at (0, 0).`,
      data: { width, height, minX, maxX, minY, maxY },
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

    // Clear the context.shapes array to reflect the cleared canvas
    context.shapes.splice(0, context.shapes.length);

    return {
      success: true,
      message: `Cleared ${count} shapes from canvas`,
    };
  }
}

// Export singleton instance
export const aiExecutorService = new AIExecutorService();
export default aiExecutorService;
