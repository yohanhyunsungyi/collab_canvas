import type { CanvasShape } from '../types/canvas.types';
import { createShape, updateShape, deleteShape, deleteMultipleShapes as batchDeleteShapes, createMultipleShapesInBatch } from './canvas.service';
import type { AIToolCall } from '../types/ai.types';
import { normalizeHexColor, resolveColorQuery } from '../utils/colorMatching';
import { colors, spacing, spacingPx, typography, canvas as canvasTokens } from '../styles/design-system';

// Social login logos
import googleLogo from '../assets/social-logos/google-logo.svg';
import appleLogo from '../assets/social-logos/apple-logo.svg';
import facebookLogo from '../assets/social-logos/facebook-logo.svg';

// Icons
import chevronDown from '../assets/icons/chevron-down.svg';

// Design system shape colors as array for random selection
const DESIGN_SYSTEM_COLORS = [
  colors.shapes.red,
  colors.shapes.orange,
  colors.shapes.yellow,
  colors.shapes.green,
  colors.shapes.blue,
  colors.shapes.indigo,
  colors.shapes.purple,
  colors.shapes.pink,
  colors.shapes.gray,
  colors.shapes.black,
];

/**
 * Generate a unique ID for shapes
 */
const generateShapeId = (): string => {
  return `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Get a random color from the design system shape color palette
 */
const getRandomColor = (): string => {
  return DESIGN_SYSTEM_COLORS[Math.floor(Math.random() * DESIGN_SYSTEM_COLORS.length)];
};

/**
 * Resolve a color string (name or hex) to a valid hex color
 * This ensures color names like "blue" are converted to hex codes for consistent storage
 */
const resolveColorToHex = (color: string | undefined): string => {
  if (!color) {
    return getRandomColor();
  }

  // If it's already a valid hex, return normalized version
  const normalizedHex = normalizeHexColor(color);
  if (normalizedHex) {
    return normalizedHex;
  }

  // Try to resolve color name to hex using the color matching utility
  const { direct, fallback } = resolveColorQuery(color);
  
  // Use the first direct match if available
  if (direct.size > 0) {
    return Array.from(direct)[0];
  }
  
  // Use the first fallback match if available
  if (fallback.size > 0) {
    return Array.from(fallback)[0];
  }

  // If all else fails, use a random color
  return getRandomColor();
};

/**
 * Calculate next zIndex based on existing shapes
 */
const getNextZIndex = (shapes: CanvasShape[]): number => {
  if (shapes.length === 0) return 0;
  const maxZIndex = Math.max(...shapes.map(s => s.zIndex ?? 0));
  return maxZIndex + 1;
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
  viewportCenter?: { x: number; y: number };
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
      // Handle empty or invalid JSON
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments || '{}');
      } catch (parseError) {
        console.error('[AI Executor] JSON parse error:', toolCall.function.arguments);
        return {
          success: false,
          message: 'Invalid tool arguments',
          error: `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        };
      }

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
        case 'deleteShapeByDescription':
          return await this.deleteShapeByDescription(args, context);

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
        case 'setBold':
          return await this.setBold(args, context);
        case 'setItalic':
          return await this.setItalic(args, context);
        case 'setUnderline':
          return await this.setUnderline(args, context);
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

        // Complex layout tools
        case 'createLoginForm':
          return await this.createLoginForm(args, context);
        case 'createNavigationBar':
          return await this.createNavigationBar(args, context);
        case 'createCardLayout':
          return await this.createCardLayout(args, context);
        case 'createDashboard':
          return await this.createDashboard(args, context);

        // Design System tool
        case 'getDesignSystemTokens':
          return this.getDesignSystemTokens(args);

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
      console.error('[AI Executor] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
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

    console.log(`[Color Matching] Query: "${color}"`);
    console.log(`[Color Matching] Direct matches:`, Array.from(direct));
    console.log(`[Color Matching] Fallback matches:`, Array.from(fallback));
    console.log(`[Color Matching] Normalized query:`, normalizedQuery);
    console.log(`[Color Matching] Shapes to filter:`, shapes.map(s => ({ id: s.id, type: s.type, color: s.color, normalized: normalizeHexColor(s.color) })));

    const filtered = shapes.filter((shape) => {
      const normalizedShapeColor = normalizeHexColor(shape.color);

      if (candidateColors.size > 0 && normalizedShapeColor) {
        const matches = candidateColors.has(normalizedShapeColor);
        console.log(`[Color Matching] Shape ${shape.id} (${shape.color} -> ${normalizedShapeColor}) vs candidates: ${matches}`);
        return matches;
      }

      if (normalizedQuery && normalizedShapeColor) {
        const matches = normalizedShapeColor === normalizedQuery;
        console.log(`[Color Matching] Shape ${shape.id} (${normalizedShapeColor}) vs query (${normalizedQuery}): ${matches}`);
        return matches;
      }

      const matches = shape.color.toLowerCase() === color.toLowerCase();
      console.log(`[Color Matching] Shape ${shape.id} literal match: ${matches}`);
      return matches;
    });

    console.log(`[Color Matching] Filtered ${filtered.length} shapes out of ${shapes.length}`);
    return filtered;
  }

  // ==========================================
  // CREATION TOOLS IMPLEMENTATION
  // ==========================================

  private async createRectangle(
    args: { x?: number; y?: number; width?: number; height?: number; color?: string },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const now = Date.now();
    // Use viewport center if available, otherwise default to canvas center (0, 0)
    const defaultX = args.x ?? context.viewportCenter?.x ?? 0;
    const defaultY = args.y ?? context.viewportCenter?.y ?? 0;
    // Provide default dimensions if not specified (100x100)
    const width = args.width ?? 100;
    const height = args.height ?? 100;
    
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'rectangle',
      x: defaultX,
      y: defaultY,
      width,
      height,
      color: resolveColorToHex(args.color),
      zIndex: getNextZIndex(context.shapes),
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
    // Use viewport center if available, otherwise default to canvas center (0, 0)
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'circle',
      x: args.x ?? context.viewportCenter?.x ?? 0,
      y: args.y ?? context.viewportCenter?.y ?? 0,
      radius: args.radius ?? 50,
      color: resolveColorToHex(args.color),
      zIndex: getNextZIndex(context.shapes),
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
    // Use viewport center if available, otherwise default to canvas center (0, 0)
    const shape: CanvasShape = {
      id: generateShapeId(),
      type: 'text',
      x: args.x ?? context.viewportCenter?.x ?? 0,
      y: args.y ?? context.viewportCenter?.y ?? 0,
      text: args.text,
      fontSize: args.fontSize ?? 24,
      fontStyle: 'normal',
      fontWeight: 'normal',
      textDecoration: 'none',
      color: resolveColorToHex(args.color),
      zIndex: getNextZIndex(context.shapes),
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
      count?: number;
      spacingX?: number;
      spacingY?: number;
    },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    // If count is provided and > shapes.length, duplicate the first shape
    const totalShapes = args.count && args.count > args.shapes.length ? args.count : args.shapes.length;
    const templateShape = args.shapes[0];
    const shouldUseRandomColor = args.count && args.count > 1;

    // Check if we need to auto-arrange in a grid
    const firstX = templateShape.x;
    const firstY = templateShape.y;
    const allSamePosition = args.shapes.every(s => s.x === firstX && s.y === firstY);
    const shouldArrangeGrid = allSamePosition && totalShapes >= 4;

    // Calculate grid dimensions if needed
    let gridColumns = 1;
    
    // AUTO-CALCULATE spacing based on shape dimensions if not provided
    let gridSpacingX: number;
    let gridSpacingY: number;
    
    if (templateShape.type === 'rectangle') {
      const width = templateShape.width || 100;
      const height = templateShape.height || 100;
      // Add 20px gap between shapes (or use provided spacing)
      gridSpacingX = args.spacingX || (width + 20);
      gridSpacingY = args.spacingY || (height + 20);
    } else if (templateShape.type === 'circle') {
      const radius = templateShape.radius || 50;
      const diameter = radius * 2;
      // Add 20px gap between shapes (or use provided spacing)
      gridSpacingX = args.spacingX || (diameter + 20);
      gridSpacingY = args.spacingY || (diameter + 20);
    } else if (templateShape.type === 'text') {
      const fontSize = templateShape.fontSize || 24;
      // Estimate text dimensions (width ~10x fontSize, height ~1.5x fontSize)
      gridSpacingX = args.spacingX || (fontSize * 10 + 20);
      gridSpacingY = args.spacingY || (fontSize * 1.5 + 20);
    } else {
      // Fallback
      gridSpacingX = args.spacingX || 120;
      gridSpacingY = args.spacingY || 120;
    }
    
    if (shouldArrangeGrid) {
      gridColumns = Math.ceil(Math.sqrt(totalShapes));
      console.log(`[AI Executor] Pre-arranging ${totalShapes} shapes in a ${gridColumns}x${Math.ceil(totalShapes / gridColumns)} grid with spacing ${gridSpacingX}x${gridSpacingY}`);
    }

    // Build all shapes in memory first (much faster than individual Firebase writes)
    const shapesToCreate: CanvasShape[] = [];
    const now = Date.now();
    const baseZIndex = getNextZIndex(context.shapes);

    for (let i = 0; i < totalShapes; i++) {
      // Use the template shape if count is specified, otherwise use the indexed shape
      const shapeData = args.count ? templateShape : args.shapes[i];
      
      // Calculate final position (with grid arrangement if needed)
      let finalX = shapeData.x;
      let finalY = shapeData.y;
      
      if (shouldArrangeGrid) {
        const row = Math.floor(i / gridColumns);
        const col = i % gridColumns;
        finalX = firstX + (col * gridSpacingX);
        finalY = firstY + (row * gridSpacingY);
      }
      
      let shape: CanvasShape;
      
      if (shapeData.type === 'rectangle') {
        shape = {
          id: generateShapeId(),
          type: 'rectangle',
          x: finalX,
          y: finalY,
          width: shapeData.width || 100,
          height: shapeData.height || 100,
          color: shouldUseRandomColor ? getRandomColor() : resolveColorToHex(shapeData.color),
          zIndex: baseZIndex + i,
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
          x: finalX,
          y: finalY,
          radius: shapeData.radius || 50,
          color: shouldUseRandomColor ? getRandomColor() : resolveColorToHex(shapeData.color),
          zIndex: baseZIndex + i,
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
          x: finalX,
          y: finalY,
          text: shapeData.text || 'Text',
          fontSize: shapeData.fontSize || 24,
          fontStyle: 'normal',
          fontWeight: 'normal',
          textDecoration: 'none',
          color: shouldUseRandomColor ? getRandomColor() : resolveColorToHex(shapeData.color),
          zIndex: baseZIndex + i,
          createdBy: context.userId,
          createdAt: now,
          lastModifiedBy: context.userId,
          lastModifiedAt: now,
          lockedBy: null,
          lockedAt: null,
        };
      }

      shapesToCreate.push(shape);
    }

    // Use batch write for all shapes at once (MUCH faster)
    try {
      await createMultipleShapesInBatch(shapesToCreate);
      
      // Update context with created shapes
      context.shapes.push(...shapesToCreate);
      const createdShapeIds = shapesToCreate.map(s => s.id);
      
      const elapsed = Date.now() - startTime;
      const message = shouldArrangeGrid
        ? `Created ${totalShapes} shapes in a ${gridColumns}x${Math.ceil(totalShapes / gridColumns)} grid in ${elapsed}ms`
        : `Created ${totalShapes} shapes in ${elapsed}ms`;
      
      return {
        success: true,
        message,
        data: { shapeIds: createdShapeIds },
      };
    } catch (error) {
      console.error('[AI Executor] Error creating shapes:', error);
      return {
        success: false,
        message: `Failed to create shapes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'CREATE_FAILED',
      };
    }
  }

  // ==========================================
  // SMART MANIPULATION TOOLS IMPLEMENTATION
  // ==========================================

  private async moveShapeByDescription(
    args: { 
      type?: string; 
      color?: string; 
      x?: number; 
      y?: number;
      deltaX?: number;
      deltaY?: number;
    },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Validate that either absolute OR relative coordinates are provided
    const hasAbsolute = args.x !== undefined || args.y !== undefined;
    const hasRelative = args.deltaX !== undefined || args.deltaY !== undefined;
    
    if (!hasAbsolute && !hasRelative) {
      return {
        success: false,
        message: 'Must provide either absolute coordinates (x, y) or relative movement (deltaX, deltaY)',
        error: 'INVALID_ARGUMENTS',
      };
    }

    // Find shapes matching the description
    let matchingShapes = context.shapes;

    if (args.type) {
      matchingShapes = matchingShapes.filter(s => s.type === args.type);
    }

    if (args.color) {
      matchingShapes = this.filterShapesByColorDescription(matchingShapes, args.color);
    }

    if (matchingShapes.length === 0) {
      // If no shapes found, provide helpful error message
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `No ${args.color || ''} ${args.type || 'shape'} found on canvas`;
      
      if (hasShapesOnCanvas) {
        // Provide clear guidance to specify the object
        message += '. Specify the object description. Describe the object you want to move';
      }
      
      return {
        success: false,
        message,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = matchingShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Calculate target coordinates
    let targetX: number;
    let targetY: number;
    
    if (hasRelative) {
      // Relative movement
      targetX = targetShape.x + (args.deltaX || 0);
      targetY = targetShape.y + (args.deltaY || 0);
    } else {
      // Absolute movement
      targetX = args.x ?? targetShape.x;
      targetY = args.y ?? targetShape.y;
    }

    // Call the underlying moveShape method
    return await this.moveShape({ shapeId: targetShape.id, x: targetX, y: targetY }, context);
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
    
    // If no matching shapes found at all, return error
    if (matchingShapes.length === 0) {
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message: string;
      
      if (args.type) {
        const friendlyType =
          args.type === 'circle'
            ? 'circle'
            : args.type === 'rectangle'
              ? 'rectangle'
              : args.type === 'text'
                ? 'text'
                : 'shape';

        message = `No ${friendlyType} found on canvas`;
      } else {
        message = `No ${args.color || ''} ${args.type || 'shape'} found on canvas`;
      }
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to resize';
      }

      return {
        success: false,
        message,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = matchingShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `No ${args.color || ''} ${args.type || 'shape'} found on canvas`;
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to rotate';
      }
      
      return {
        success: false,
        message,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = matchingShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Call the underlying rotateShape method
    return await this.rotateShape({ shapeId: targetShape.id, rotation: args.rotation }, context);
  }

  private async deleteShapeByDescription(
    args: { type?: string; color?: string },
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `No ${args.color || ''} ${args.type || 'shape'} found on canvas`;
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to delete';
      }
      
      return {
        success: false,
        message,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    // Use the first matching shape (or most recently created if multiple)
    const targetShape = matchingShapes.sort((a, b) => b.createdAt - a.createdAt)[0];

    // Call the underlying deleteShape method
    return await this.deleteShape({ shapeId: targetShape.id }, context);
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `Shape ${args.shapeId} not found`;
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to move';
      }
      
      return {
        success: false,
        message,
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `Shape ${args.shapeId} not found`;
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to resize';
      }
      
      return {
        success: false,
        message,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    const updates: Partial<CanvasShape> = { lastModifiedBy: context.userId };

    if (shape.type === 'rectangle' && args.width !== undefined && args.height !== undefined) {
      (updates as Partial<import('../types/canvas.types').RectangleShape>).width = args.width;
      (updates as Partial<import('../types/canvas.types').RectangleShape>).height = args.height;
    } else if (shape.type === 'circle' && args.radius !== undefined) {
      (updates as Partial<import('../types/canvas.types').CircleShape>).radius = args.radius;
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `Shape ${args.shapeId} not found`;
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to rotate';
      }
      
      return {
        success: false,
        message,
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = `Shape ${args.shapeId} not found`;
      
      if (hasShapesOnCanvas) {
        message += '. Specify the object description. Describe the object you want to change color';
      }
      
      return {
        success: false,
        message,
        error: 'SHAPE_NOT_FOUND',
      };
    }

    const resolvedColor = resolveColorToHex(args.color);
    await updateShape(args.shapeId, {
      color: resolvedColor,
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
    if (args.text !== undefined) (updates as Partial<import('../types/canvas.types').TextShape>).text = args.text;
    if (args.fontSize !== undefined) (updates as Partial<import('../types/canvas.types').TextShape>).fontSize = args.fontSize;

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
        message: 'No text shapes found on canvas. Specify the object description. Describe the text you want to manipulate',
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'No text shapes found to update';
      
      if (hasShapesOnCanvas) {
        message += '. Select a text object first';
      }
      
      return {
        success: false,
        message,
        error: 'NO_TEXT_SHAPES',
      };
    }

    return {
      success: true,
      message: `Changed font size to ${args.fontSize}px for ${updatedCount} text shape(s)`,
    };
  }

  private async setBold(
    args: { shapeIds: string[]; bold: boolean },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use the SAME LOGIC as toolbar's handleFontWeightChange
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

    // Update only text shapes
    let updatedCount = 0;
    const fontWeight = args.bold ? 'bold' : 'normal';
    for (const shapeId of shapeIds) {
      const shape = context.shapes.find(s => s.id === shapeId);
      if (shape && shape.type === 'text') {
        await updateShape(shapeId, {
          fontWeight,
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
      message: `${args.bold ? 'Applied bold' : 'Removed bold'} to ${updatedCount} text shape(s)`,
    };
  }

  private async setItalic(
    args: { shapeIds: string[]; italic: boolean },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use the SAME LOGIC as toolbar's handleFontStyleChange
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

    // Update only text shapes
    let updatedCount = 0;
    const fontStyle = args.italic ? 'italic' : 'normal';
    for (const shapeId of shapeIds) {
      const shape = context.shapes.find(s => s.id === shapeId);
      if (shape && shape.type === 'text') {
        await updateShape(shapeId, {
          fontStyle,
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
      message: `${args.italic ? 'Applied italic' : 'Removed italic'} to ${updatedCount} text shape(s)`,
    };
  }

  private async setUnderline(
    args: { shapeIds: string[]; underline: boolean },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use the SAME LOGIC as toolbar's handleTextDecorationChange
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

    // Update only text shapes
    let updatedCount = 0;
    const textDecoration = args.underline ? 'underline' : 'none';
    for (const shapeId of shapeIds) {
      const shape = context.shapes.find(s => s.id === shapeId);
      if (shape && shape.type === 'text') {
        await updateShape(shapeId, {
          textDecoration,
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
      message: `${args.underline ? 'Applied underline' : 'Removed underline'} to ${updatedCount} text shape(s)`,
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
    // Find valid shape IDs that exist in context
    const validShapeIds = args.shapeIds.filter(id => 
      context.shapes.find(s => s.id === id)
    );

    if (validShapeIds.length === 0) {
      return {
        success: false,
        message: 'No shapes found to delete',
        error: 'NO_SHAPES_FOUND',
      };
    }

    // Batch delete all shapes in a single Firestore operation
    await batchDeleteShapes(validShapeIds);

    // Remove from context
    for (const shapeId of validShapeIds) {
      const index = context.shapes.findIndex((s) => s.id === shapeId);
      if (index >= 0) {
        context.shapes.splice(index, 1);
      }
    }
    
    if (context.selectedShapeIds) {
      context.selectedShapeIds = context.selectedShapeIds.filter((id) => !validShapeIds.includes(id));
    }

    return {
      success: true,
      message: `Deleted ${validShapeIds.length} shapes`,
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
    // If shapeIds is empty, use selected shapes (from context)
    const targetIds = args.shapeIds.length === 0 
      ? (context.selectedShapeIds || [])
      : args.shapeIds;
    
    // If no shapes to move, return error
    if (targetIds.length === 0) {
      return {
        success: false,
        message: 'No shapes selected. Select a shape first or describe which shape to move (e.g., "move the blue rectangle left")',
        error: 'NO_SHAPES_SELECTED',
      };
    }
    
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'Need at least 2 shapes to align';
      
      if (hasShapesOnCanvas) {
        message += '. Select multiple objects to proceed';
      }
      
      return {
        success: false,
        message,
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'Need at least 2 shapes to align';
      
      if (hasShapesOnCanvas) {
        message += '. Select multiple objects to proceed';
      }
      
      return {
        success: false,
        message,
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'Need at least 2 shapes to align';
      
      if (hasShapesOnCanvas) {
        message += '. Select multiple objects to proceed';
      }
      
      return {
        success: false,
        message,
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'Need at least 2 shapes to arrange horizontally';
      
      if (hasShapesOnCanvas) {
        message += '. Select multiple objects to proceed';
      }
      
      return {
        success: false,
        message,
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => uniqueShapeIds.includes(s.id));
    
    if (selectedShapes.length < 2) {
      return {
        success: false,
        message: 'Could not find enough shapes to arrange. Select multiple objects to proceed',
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
    
    // Position each shape with small delay to avoid rate limiting
    let currentLeft = leftmostLeft;
    for (const shape of sortedShapes) {
      try {
        await updateShape(shape.id, {
          x: this.setShapeLeft(shape, currentLeft),
          lastModifiedBy: context.userId,
        });
        currentLeft += this.getShapeWidth(shape) + spacing;
        
        // Add small delay every 10 shapes to avoid Firebase rate limiting
        if (sortedShapes.indexOf(shape) % 10 === 9) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`[AI Executor] Error arranging shape ${shape.id}:`, error);
        // Continue with other shapes even if one fails
      }
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
    // Use viewport center if available, otherwise default to (0, 0)
    const x = args.x ?? context.viewportCenter?.x ?? 0;
    const startY = args.startY ?? context.viewportCenter?.y ?? 0;
    
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'Need at least 2 shapes to distribute';
      
      if (hasShapesOnCanvas) {
        message += '. Select multiple objects to proceed';
      }
      
      return {
        success: false,
        message,
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => uniqueShapeIds.includes(s.id));
    
    if (selectedShapes.length < 2) {
      return {
        success: false,
        message: 'Could not find enough shapes to distribute. Select multiple objects to proceed',
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
      try {
        await updateShape(shape.id, {
          x: this.setShapeLeft(shape, currentLeft),
          lastModifiedBy: context.userId,
        });
        currentLeft += this.getShapeWidth(shape) + spacing;
        
        // Add small delay every 10 shapes to avoid Firebase rate limiting
        if (sortedShapes.indexOf(shape) % 10 === 9) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`[AI Executor] Error distributing shape ${shape.id}:`, error);
        // Continue with other shapes even if one fails
      }
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
      const hasShapesOnCanvas = context.shapes.length > 0;
      let message = 'Need at least 2 shapes to distribute';
      
      if (hasShapesOnCanvas) {
        message += '. Select multiple objects to proceed';
      }
      
      return {
        success: false,
        message,
        error: 'INSUFFICIENT_SHAPES',
      };
    }

    const selectedShapes = context.shapes.filter(s => uniqueShapeIds.includes(s.id));
    
    if (selectedShapes.length < 2) {
      return {
        success: false,
        message: 'Could not find enough shapes to distribute. Select multiple objects to proceed',
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
  // COMPLEX LAYOUT TOOLS IMPLEMENTATION
  // ==========================================

  /**
   * Create a complete login form with professional layout (Copy UI style)
   * Elements: Container, Title, Subtitle, Email/Password Labels/Inputs, Submit Button, Divider, Social Login (Google, Apple, Facebook)
   */
  private async createLoginForm(
    args: { x?: number; y?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use viewport center if no position specified OR if AI passes default (0,0)
    // Check if args are undefined or both are exactly 0 (AI's default)
    const useViewportCenter = (args.x === undefined && args.y === undefined) || 
                              (args.x === 0 && args.y === 0 && context.viewportCenter);
    
    const centerX = useViewportCenter ? (context.viewportCenter?.x ?? 0) : (args.x ?? 0);
    const centerY = useViewportCenter ? (context.viewportCenter?.y ?? 0) : (args.y ?? 0);

    // Form dimensions - modern clean layout
    const formWidth = 400;
    const formHeight = 640;
    const inputWidth = 360;
    const inputHeight = 48;
    const buttonHeight = 52;
    const socialButtonWidth = 112; // Social buttons (3 × 112 + 2 × 12 spacing = 360)
    const socialButtonHeight = 48;
    const titleFontSize = 28; // Reduced title size
    const subtitleFontSize = 14;
    const labelFontSize = 14;
    const buttonFontSize = 16;

    // Calculate positions relative to form center
    const containerX = centerX - formWidth / 2;
    const containerY = centerY - formHeight / 2;

    // Colors
    const containerColor = '#FAFAFA'; // Very light gray background
    const inputColor = '#FFFFFF'; // White inputs
    const buttonColor = '#5B7FEE'; // Modern blue button
    const textColor = '#1A1A1A'; // Very dark text
    const labelColor = '#6B7280'; // Gray labels
    const buttonTextColor = '#FFFFFF'; // White button text
    const subtitleColor = '#6B7280'; // Gray subtitle
    const socialBgColor = '#FFFFFF'; // White social buttons
    const dividerLineColor = '#D1D5DB'; // Gray divider lines

    // Create all shapes
    const now = Date.now();
    const shapesToCreate: CanvasShape[] = [];
    let currentZIndex = getNextZIndex(context.shapes);

    // 1. Container background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: containerX,
      y: containerY,
      width: formWidth,
      height: formHeight,
      color: containerColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 2. Title "Sign in to CollabCanvas"
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: containerX + 20,
      y: containerY + 30,
      text: 'Sign in to CollabCanvas',
      fontSize: titleFontSize,
      color: textColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 3. Subtitle "Don't have an account? Create one"
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: containerX + 20,
      y: containerY + 70,
      text: "Don't have an account? Create one",
      fontSize: subtitleFontSize,
      color: subtitleColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 4. Email label
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: containerX + 20,
      y: containerY + 120,
      text: 'Email address',
      fontSize: labelFontSize,
      color: labelColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 5. Email input field
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: containerX + 20,
      y: containerY + 145,
      width: inputWidth,
      height: inputHeight,
      color: inputColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 6. Password label
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: containerX + 20,
      y: containerY + 220,
      text: 'Password',
      fontSize: labelFontSize,
      color: labelColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 7. Password input field
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: containerX + 20,
      y: containerY + 245,
      width: inputWidth,
      height: inputHeight,
      color: inputColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 8. Sign in button
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: containerX + 20,
      y: containerY + 325,
      width: inputWidth,
      height: buttonHeight,
      color: buttonColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 9. Button text "Sign in"
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: centerX - 35,
      y: containerY + 342,
      text: 'Sign in',
      fontSize: buttonFontSize,
      color: buttonTextColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 10. Left divider line
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: containerX + 20,
      y: containerY + 415,
      width: 120,
      height: 1,
      color: dividerLineColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 11. Divider text "Or continue with"
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: containerX + 150,
      y: containerY + 405,
      text: 'Or continue with',
      fontSize: subtitleFontSize,
      color: subtitleColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 12. Right divider line
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: containerX + 260,
      y: containerY + 415,
      width: 120,
      height: 1,
      color: dividerLineColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // Social login buttons - positioned in a row with backgrounds + logos
    const socialButtonsStartX = containerX + 20;
    const socialButtonsY = containerY + 470;
    const socialButtonSpacing = 12;

    // 13. Google button background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: socialButtonsStartX,
      y: socialButtonsY,
      width: socialButtonWidth,
      height: socialButtonHeight,
      color: socialBgColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 14. Google logo
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'image',
      x: socialButtonsStartX + 40,
      y: socialButtonsY + 8,
      width: 32,
      height: 32,
      src: googleLogo,
      color: '#FFFFFF',
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 15. Apple button background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: socialButtonsStartX + socialButtonWidth + socialButtonSpacing,
      y: socialButtonsY,
      width: socialButtonWidth,
      height: socialButtonHeight,
      color: socialBgColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 16. Apple logo
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'image',
      x: socialButtonsStartX + socialButtonWidth + socialButtonSpacing + 40,
      y: socialButtonsY + 8,
      width: 32,
      height: 32,
      src: appleLogo,
      color: '#FFFFFF',
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 17. Facebook button background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: socialButtonsStartX + (socialButtonWidth + socialButtonSpacing) * 2,
      y: socialButtonsY,
      width: socialButtonWidth,
      height: socialButtonHeight,
      color: socialBgColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 18. Facebook logo
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'image',
      x: socialButtonsStartX + (socialButtonWidth + socialButtonSpacing) * 2 + 40,
      y: socialButtonsY + 8,
      width: 32,
      height: 32,
      src: facebookLogo,
      color: '#FFFFFF',
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // Create all shapes in Firestore
    const createdShapeIds: string[] = [];
    try {
      for (const shape of shapesToCreate) {
        await createShape(shape);
        context.shapes.push(shape);
        createdShapeIds.push(shape.id);
      }

      return {
        success: true,
        message: `Created modern login form with ${createdShapeIds.length} elements (including Google, Apple, Facebook social login) at (${centerX}, ${centerY})`,
        data: { shapeIds: createdShapeIds, elementCount: createdShapeIds.length },
      };
    } catch (error) {
      console.error('[AI Executor] Error creating login form:', error);
      return {
        success: false,
        message: `Failed to create login form: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'CREATE_FAILED',
      };
    }
  }

  /**
   * Create a professional navigation bar
   * Elements: Background bar, Logo, Menu items, Dropdown arrows, CTA button
   */
  private async createNavigationBar(
    args: { y?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use viewport center if no position specified OR if AI passes common defaults (-280, 0)
    const useViewportCenter = context.viewportCenter && 
                              (args.y === undefined || 
                               args.y === 0 || 
                               args.y === -280);
    
    // Position navbar at top of viewport (center Y minus 300px offset)
    const navY = useViewportCenter && context.viewportCenter ? 
                 context.viewportCenter.y - 300 : 
                 (args.y ?? -280);

    // Navbar dimensions
    const navWidth = 1200;
    const navHeight = 70;
    const logoSize = 40;
    const menuFontSize = 15;
    const ctaButtonWidth = 200;
    const ctaButtonHeight = 44;
    const dropdownSize = 16;

    // Calculate positions (navbar spans horizontally across canvas)
    // X position: Center horizontally relative to viewport center
    const navX = context.viewportCenter ? context.viewportCenter.x - navWidth / 2 : -navWidth / 2;

    // Colors
    const navBgColor = '#FFFFFF'; // White navbar
    const logoColor = '#5B7FEE'; // Purple/blue logo
    const menuTextColor = '#1A1A1A'; // Dark menu text
    const ctaButtonColor = '#D946EF'; // Magenta CTA button
    const ctaTextColor = '#FFFFFF'; // White CTA text

    // Create all shapes
    const now = Date.now();
    const shapesToCreate: CanvasShape[] = [];
    let currentZIndex = getNextZIndex(context.shapes);

    // 1. Navbar background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: navX,
      y: navY,
      width: navWidth,
      height: navHeight,
      color: navBgColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 2. Logo circle (left side)
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'circle',
      x: navX + 60,
      y: navY + navHeight / 2,
      radius: logoSize / 2,
      color: logoColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 3. CollabCanvas text (next to logo)
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: navX + 90,
      y: navY + 25,
      text: 'CollabCanvas',
      fontSize: 18,
      color: menuTextColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // Menu items with positions (centered in navbar)
    const menuStartX = navX + 300;
    const menuY = navY + 27;
    const menuSpacing = 120;

    const menuItems = [
      { text: 'Features', hasDropdown: true },
      { text: 'How it works', hasDropdown: false },
      { text: 'Use cases', hasDropdown: true },
      { text: 'Pricing', hasDropdown: false },
      { text: 'FAQ', hasDropdown: false },
    ];

    // Create menu items
    menuItems.forEach((item, index) => {
      const xPos = menuStartX + index * menuSpacing;

      // Menu text
      shapesToCreate.push({
        id: generateShapeId(),
        type: 'text',
        x: xPos,
        y: menuY,
        text: item.text,
        fontSize: menuFontSize,
        color: menuTextColor,
        zIndex: currentZIndex++,
        createdBy: context.userId,
        createdAt: now,
        lastModifiedBy: context.userId,
        lastModifiedAt: now,
        lockedBy: null,
        lockedAt: null,
      });

      // Dropdown arrow (if needed)
      if (item.hasDropdown) {
        shapesToCreate.push({
          id: generateShapeId(),
          type: 'image',
          x: xPos + item.text.length * 9 + 5,
          y: menuY + 2,
          width: dropdownSize,
          height: dropdownSize,
          src: chevronDown,
          color: '#FFFFFF',
          zIndex: currentZIndex++,
          createdBy: context.userId,
          createdAt: now,
          lastModifiedBy: context.userId,
          lastModifiedAt: now,
          lockedBy: null,
          lockedAt: null,
        });
      }
    });

    // CTA Button (right side)
    const ctaX = navX + navWidth - ctaButtonWidth - 40;
    const ctaY = navY + (navHeight - ctaButtonHeight) / 2;

    // CTA button background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: ctaX,
      y: ctaY,
      width: ctaButtonWidth,
      height: ctaButtonHeight,
      color: ctaButtonColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // CTA button text
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: ctaX + 25,
      y: ctaY + 13,
      text: 'Get CollabCanvas Plus',
      fontSize: menuFontSize,
      color: ctaTextColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // Create all shapes in Firestore
    const createdShapeIds: string[] = [];
    try {
      for (const shape of shapesToCreate) {
        await createShape(shape);
        context.shapes.push(shape);
        createdShapeIds.push(shape.id);
      }

      return {
        success: true,
        message: `Created navigation bar with ${createdShapeIds.length} elements at y=${navY}`,
        data: { shapeIds: createdShapeIds, elementCount: createdShapeIds.length },
      };
    } catch (error) {
      console.error('[AI Executor] Error creating navigation bar:', error);
      return {
        success: false,
        message: `Failed to create navigation bar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'CREATE_FAILED',
      };
    }
  }

  /**
   * Create a professional card layout (pricing/feature card)
   * Elements: Border rectangle, Title, Price, Image placeholder, Description, Button
   */
  private async createCardLayout(
    args: { x?: number; y?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use viewport center if no position specified OR if AI passes default (0,0)
    const useViewportCenter = (args.x === undefined && args.y === undefined) || 
                              (args.x === 0 && args.y === 0 && context.viewportCenter);
    
    const centerX = useViewportCenter ? (context.viewportCenter?.x ?? 0) : (args.x ?? 0);
    const centerY = useViewportCenter ? (context.viewportCenter?.y ?? 0) : (args.y ?? 0);
    
    return await this.createSingleCard(
      centerX,
      centerY,
      'Free plan',
      '$0',
      context
    );
  }

  /**
   * Helper method to create a single card
   */
  private async createSingleCard(
    centerX: number,
    centerY: number,
    title: string,
    price: string,
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Card dimensions
    const cardWidth = 320;
    const cardHeight = 380;
    const imagePlaceholderWidth = 280;
    const imagePlaceholderHeight = 120;
    const buttonWidth = 280;
    const buttonHeight = 48;

    // Calculate positions relative to card center
    const cardX = centerX - cardWidth / 2;
    const cardY = centerY - cardHeight / 2;

    // Colors
    const cardBgColor = '#FFFFFF'; // White card background
    const titleColor = '#6B7280'; // Gray title
    const priceColor = '#1A1A1A'; // Dark price text
    const descriptionColor = '#6B7280'; // Gray description
    const imagePlaceholderColor = '#E5E7EB'; // Light gray placeholder
    const buttonColor = '#1E293B'; // Dark navy button
    const buttonTextColor = '#FFFFFF'; // White button text

    // Create all shapes
    const now = Date.now();
    const shapesToCreate: CanvasShape[] = [];
    let currentZIndex = getNextZIndex(context.shapes);

    // 1. Card container/border
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      color: cardBgColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 2. Title text
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: cardX + 20,
      y: cardY + 25,
      text: title,
      fontSize: 16,
      color: titleColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 3. Price text (large)
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: cardX + 20,
      y: cardY + 55,
      text: price,
      fontSize: 48,
      color: priceColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 4. Image placeholder rectangle
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: cardX + 20,
      y: cardY + 130,
      width: imagePlaceholderWidth,
      height: imagePlaceholderHeight,
      color: imagePlaceholderColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 5. Description text
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: cardX + 20,
      y: cardY + 270,
      text: 'For early-stage startups looking to',
      fontSize: 14,
      color: descriptionColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 6. Description text line 2
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: cardX + 20,
      y: cardY + 290,
      text: 'get started with data.',
      fontSize: 14,
      color: descriptionColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 7. Action button
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: cardX + 20,
      y: cardY + 320,
      width: buttonWidth,
      height: buttonHeight,
      color: buttonColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // 8. Button text (centered in button)
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'text',
      x: cardX + 95,
      y: cardY + 336,
      text: 'Get started for free',
      fontSize: 15,
      color: buttonTextColor,
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // Create all shapes in Firestore
    const createdShapeIds: string[] = [];
    try {
      for (const shape of shapesToCreate) {
        await createShape(shape);
        context.shapes.push(shape);
        createdShapeIds.push(shape.id);
      }

      return {
        success: true,
        message: `Created card layout with ${createdShapeIds.length} elements at (${centerX}, ${centerY})`,
        data: { shapeIds: createdShapeIds, elementCount: createdShapeIds.length },
      };
    } catch (error) {
      console.error('[AI Executor] Error creating card layout:', error);
      return {
        success: false,
        message: `Failed to create card layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'CREATE_FAILED',
      };
    }
  }

  /**
   * Create a web dashboard with 4 stats cards in 2x2 grid
   * Cards: Total Users, Revenue, Active Sessions, Growth Rate
   */
  private async createDashboard(
    args: { x?: number; y?: number },
    context: ExecutionContext
  ): Promise<ToolExecutionResult> {
    // Use viewport center if no position specified OR if AI passes default (0,0)
    const useViewportCenter = (args.x === undefined && args.y === undefined) || 
                              (args.x === 0 && args.y === 0 && context.viewportCenter);
    
    const centerX = useViewportCenter ? (context.viewportCenter?.x ?? 0) : (args.x ?? 0);
    const centerY = useViewportCenter ? (context.viewportCenter?.y ?? 0) : (args.y ?? 0);

    // Dashboard configuration
    const dashboardWidth = 800;
    const dashboardHeight = 600;
    const cardWidth = 340;
    const cardHeight = 240;
    const gap = 40;
    const padding = 40;

    const now = Date.now();
    const shapesToCreate: CanvasShape[] = [];
    let currentZIndex = getNextZIndex(context.shapes);

    // 1. Dashboard background
    shapesToCreate.push({
      id: generateShapeId(),
      type: 'rectangle',
      x: centerX - dashboardWidth / 2,
      y: centerY - dashboardHeight / 2,
      width: dashboardWidth,
      height: dashboardHeight,
      color: '#F9FAFB', // Light gray background
      zIndex: currentZIndex++,
      createdBy: context.userId,
      createdAt: now,
      lastModifiedBy: context.userId,
      lastModifiedAt: now,
      lockedBy: null,
      lockedAt: null,
    });

    // Calculate card positions (2x2 grid)
    const startX = centerX - dashboardWidth / 2 + padding;
    const startY = centerY - dashboardHeight / 2 + padding;

    // Define 4 stats cards
    const cards = [
      { 
        title: 'Total Users', 
        value: '24.5K', 
        subtitle: '+12.5% from last month',
        color: '#3B82F6', // Blue
        x: startX, 
        y: startY 
      },
      { 
        title: 'Revenue', 
        value: '$128.4K', 
        subtitle: '+8.2% from last month',
        color: '#10B981', // Green
        x: startX + cardWidth + gap, 
        y: startY 
      },
      { 
        title: 'Active Sessions', 
        value: '1,842', 
        subtitle: '342 users online now',
        color: '#F59E0B', // Orange
        x: startX, 
        y: startY + cardHeight + gap 
      },
      { 
        title: 'Growth Rate', 
        value: '+23.8%', 
        subtitle: 'Trending upward',
        color: '#8B5CF6', // Purple
        x: startX + cardWidth + gap, 
        y: startY + cardHeight + gap 
      },
    ];

    // Create each stats card
    for (const card of cards) {
      // Card background
      shapesToCreate.push({
        id: generateShapeId(),
        type: 'rectangle',
        x: card.x,
        y: card.y,
        width: cardWidth,
        height: cardHeight,
        color: '#FFFFFF',
        zIndex: currentZIndex++,
        createdBy: context.userId,
        createdAt: now,
        lastModifiedBy: context.userId,
        lastModifiedAt: now,
        lockedBy: null,
        lockedAt: null,
      });

      // Color accent bar (left side)
      shapesToCreate.push({
        id: generateShapeId(),
        type: 'rectangle',
        x: card.x,
        y: card.y,
        width: 6,
        height: cardHeight,
        color: card.color,
        zIndex: currentZIndex++,
        createdBy: context.userId,
        createdAt: now,
        lastModifiedBy: context.userId,
        lastModifiedAt: now,
        lockedBy: null,
        lockedAt: null,
      });

      // Title
      shapesToCreate.push({
        id: generateShapeId(),
        type: 'text',
        x: card.x + 24,
        y: card.y + 24,
        text: card.title,
        fontSize: 16,
        color: '#6B7280',
        zIndex: currentZIndex++,
        createdBy: context.userId,
        createdAt: now,
        lastModifiedBy: context.userId,
        lastModifiedAt: now,
        lockedBy: null,
        lockedAt: null,
      });

      // Main value (large)
      shapesToCreate.push({
        id: generateShapeId(),
        type: 'text',
        x: card.x + 24,
        y: card.y + 80,
        text: card.value,
        fontSize: 48,
        color: '#1F2937',
        zIndex: currentZIndex++,
        createdBy: context.userId,
        createdAt: now,
        lastModifiedBy: context.userId,
        lastModifiedAt: now,
        lockedBy: null,
        lockedAt: null,
      });

      // Subtitle/trend
      shapesToCreate.push({
        id: generateShapeId(),
        type: 'text',
        x: card.x + 24,
        y: card.y + 180,
        text: card.subtitle,
        fontSize: 14,
        color: '#9CA3AF',
        zIndex: currentZIndex++,
        createdBy: context.userId,
        createdAt: now,
        lastModifiedBy: context.userId,
        lastModifiedAt: now,
        lockedBy: null,
        lockedAt: null,
      });
    }

    // Create all shapes in Firestore
    const createdShapeIds: string[] = [];
    try {
      for (const shape of shapesToCreate) {
        await createShape(shape);
        context.shapes.push(shape);
        createdShapeIds.push(shape.id);
      }

      return {
        success: true,
        message: `Created web dashboard with ${cards.length} stats cards (${createdShapeIds.length} total elements) at (${centerX}, ${centerY})`,
        data: { 
          shapeIds: createdShapeIds, 
          cardCount: cards.length,
          elementCount: createdShapeIds.length 
        },
      };
    } catch (error) {
      console.error('[AI Executor] Error creating dashboard:', error);
      return {
        success: false,
        message: `Failed to create dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'CREATE_FAILED',
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
    
    if (count === 0) {
      return {
        success: true,
        message: 'Canvas is already empty',
      };
    }

    // Batch delete all shapes in a single Firestore operation
    const shapeIds = context.shapes.map(s => s.id);
    await batchDeleteShapes(shapeIds);

    // Clear the context.shapes array to reflect the cleared canvas
    context.shapes.splice(0, context.shapes.length);

    return {
      success: true,
      message: `Cleared ${count} shapes from canvas`,
    };
  }

  private getDesignSystemTokens(args: { category?: string }): ToolExecutionResult {
    const category = args.category || 'all';

    const designSystem = {
      colors: {
        // Brand colors
        brand: colors.brand,
        
        // Shape palette (recommended for canvas shapes)
        shapes: colors.shapes,
        
        // Status colors
        status: colors.status,
        
        // Canvas-specific
        canvas: colors.canvas,
        
        // Text colors
        text: colors.text,
        
        // Background colors
        background: colors.background,
        
        // Border colors
        border: colors.border,
      },
      spacing: {
        values: spacing,
        pixels: spacingPx,
      },
      typography: {
        fontSize: typography.fontSize,
        fontWeight: typography.fontWeight,
        lineHeight: typography.lineHeight,
      },
      canvas: {
        width: canvasTokens.width,
        height: canvasTokens.height,
        defaultShapeColor: canvasTokens.defaultShapeColor,
        defaultTextSize: canvasTokens.defaultTextSize,
        defaultRectangleSize: canvasTokens.defaultRectangleSize,
        defaultCircleRadius: canvasTokens.defaultCircleRadius,
      },
    };

    let data: any;
    let message: string;

    switch (category) {
      case 'colors':
        data = designSystem.colors;
        message = `Design system colors: ${Object.keys(colors.shapes).length} shape colors (${Object.keys(colors.shapes).join(', ')}), brand colors, status colors. Use colors.shapes.* for shape colors.`;
        break;
      case 'spacing':
        data = designSystem.spacing;
        message = `Design system spacing: xs=${spacing.xs}, sm=${spacing.sm}, md=${spacing.md}, lg=${spacing.lg}, xl=${spacing.xl}. Pixel values also available.`;
        break;
      case 'typography':
        data = designSystem.typography;
        message = `Design system typography: Font sizes from xs (${typography.fontSize.xs}) to 5xl (${typography.fontSize['5xl']}). Default text size: ${canvasTokens.defaultTextSize}px.`;
        break;
      case 'canvas':
        data = designSystem.canvas;
        message = `Canvas tokens: ${canvasTokens.width}x${canvasTokens.height}px, default shape color: ${canvasTokens.defaultShapeColor}, default text size: ${canvasTokens.defaultTextSize}px.`;
        break;
      default:
        data = designSystem;
        message = `Full design system with ${Object.keys(colors.shapes).length} shape colors, spacing scale, typography, and canvas defaults. Use these tokens for consistent, professional designs.`;
    }

    return {
      success: true,
      message,
      data,
    };
  }
}

// Export singleton instance
export const aiExecutorService = new AIExecutorService();
export default aiExecutorService;
