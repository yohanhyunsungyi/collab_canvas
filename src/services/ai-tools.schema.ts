import type OpenAI from 'openai';

/**
 * AI Tools Schema for Canvas Manipulation
 * Defines all available functions the AI can call to interact with the canvas
 */

export const aiToolsSchema: OpenAI.Chat.ChatCompletionTool[] = [
  // ==========================================
  // CREATION TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'createRectangle',
      description: 'Create a rectangle shape on the canvas. Example: "Make a 200x300 rectangle" → width=200, height=300, color=black (default), x=100 (default), y=100 (default). If position not specified, use defaults.',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X coordinate (pixels from left edge). Default: 100',
          },
          y: {
            type: 'number',
            description: 'Y coordinate (pixels from top edge). Default: 100',
          },
          width: {
            type: 'number',
            description: 'Width of the rectangle in pixels',
          },
          height: {
            type: 'number',
            description: 'Height of the rectangle in pixels',
          },
          color: {
            type: 'string',
            description: 'Color in hex format (e.g., "#FF0000" for red) or CSS color name. Default: "#0000FF" (blue)',
          },
        },
        required: ['width', 'height'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCircle',
      description: 'Create a circle shape on the canvas. Example: "Create a red circle at position 100, 200" → x=100, y=200, radius=50 (default), color=red. If position not specified, use x=100, y=200 as defaults.',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X coordinate of circle center (pixels from left edge). Default: 100',
          },
          y: {
            type: 'number',
            description: 'Y coordinate of circle center (pixels from top edge). Default: 200',
          },
          radius: {
            type: 'number',
            description: 'Radius of the circle in pixels. Default: 50',
          },
          color: {
            type: 'string',
            description: 'Color in hex format (e.g., "#00FF00" for green) or CSS color name. Default: "#FF0000" (red)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createText',
      description: 'Create a text element on the canvas. Example: "Add a text layer that says \'Hello World\'" → text="Hello World", x=150 (default), y=150 (default).',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X coordinate (pixels from left edge). Default: 150',
          },
          y: {
            type: 'number',
            description: 'Y coordinate (pixels from top edge). Default: 150',
          },
          text: {
            type: 'string',
            description: 'The text content to display',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels. Default: 24',
          },
          color: {
            type: 'string',
            description: 'Text color in hex format or CSS color name. Default: "#000000"',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createMultipleShapes',
      description: 'Create multiple shapes at once. For grid layouts: Create all N*N shapes with the SAME x,y coordinates (like x:0, y:0), then call arrangeGrid to position them. Example: "Create a 3x3 grid" → createMultipleShapes with 9 shapes ALL at x:0, y:0, THEN arrangeGrid(shapeIds=[], columns=3). Do NOT pre-calculate grid positions - let arrangeGrid handle positioning!',
      parameters: {
        type: 'object',
        properties: {
          shapes: {
            type: 'array',
            description: 'Array of shape definitions to create. For grid layouts, use the SAME x,y for ALL shapes (e.g., x:0, y:0).',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['rectangle', 'circle', 'text'],
                  description: 'Type of shape to create',
                },
                x: { type: 'number', description: 'X coordinate. For grid layouts, use the SAME value for all shapes (e.g., 0).' },
                y: { type: 'number', description: 'Y coordinate. For grid layouts, use the SAME value for all shapes (e.g., 0).' },
                width: { type: 'number', description: 'Width (rectangle only)' },
                height: { type: 'number', description: 'Height (rectangle only)' },
                radius: { type: 'number', description: 'Radius (circle only)' },
                text: { type: 'string', description: 'Text content (text only)' },
                fontSize: { type: 'number', description: 'Font size (text only)' },
                color: { type: 'string', description: 'Color' },
              },
              required: ['type', 'x', 'y'],
            },
          },
        },
        required: ['shapes'],
      },
    },
  },

  // ==========================================
  // SMART MANIPULATION TOOLS (Recommended - handle lookup automatically)
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'moveShapeByDescription',
      description: 'Move a shape by describing it (color or type). Use THIS instead of moveShape when user says "move the blue rectangle" or "move the circle". Example: "Move the blue rectangle to center" → moveShapeByDescription(color="blue", type="rectangle", x=0, y=0). This tool finds the shape automatically. Remember: canvas center is at (0, 0).',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Type of shape to find and move',
          },
          color: {
            type: 'string',
            description: 'Color of the shape to find (optional, use if user mentions color like "blue rectangle")',
          },
          x: {
            type: 'number',
            description: 'New X coordinate (-2500 to 2500). Canvas center is 0.',
          },
          y: {
            type: 'number',
            description: 'New Y coordinate (-2500 to 2500). Canvas center is 0.',
          },
        },
        required: ['x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShapeByDescription',
      description: 'Resize a shape by describing it. Use THIS for commands like "Resize the circle to be twice as big" or "Make the rectangle bigger". Example: "Resize the circle to be twice as big" → resizeShapeByDescription(type="circle", scaleMultiplier=2). This tool finds the shape and calculates new size automatically.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Type of shape to find and resize',
          },
          color: {
            type: 'string',
            description: 'Color of the shape (optional)',
          },
          scaleMultiplier: {
            type: 'number',
            description: 'Multiply current size by this number. For "twice as big" use 2, for "half size" use 0.5, for "three times bigger" use 3.',
          },
          newWidth: {
            type: 'number',
            description: 'Explicit new width (rectangles only, alternative to scaleMultiplier)',
          },
          newHeight: {
            type: 'number',
            description: 'Explicit new height (rectangles only, alternative to scaleMultiplier)',
          },
          newRadius: {
            type: 'number',
            description: 'Explicit new radius (circles only, alternative to scaleMultiplier)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShapeByDescription',
      description: 'Rotate a shape by describing it. Use THIS for commands like "Rotate the text 45 degrees". Example: "Rotate the text 45 degrees" → rotateShapeByDescription(type="text", rotation=45). This tool finds the shape automatically.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Type of shape to find and rotate',
          },
          color: {
            type: 'string',
            description: 'Color of the shape (optional)',
          },
          rotation: {
            type: 'number',
            description: 'Rotation angle in degrees (0-360)',
          },
        },
        required: ['rotation'],
      },
    },
  },

  // ==========================================
  // LOW-LEVEL MANIPULATION TOOLS (Use only when shapeId is already known)
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move a shape to a new position using a known shapeId. Prefer moveShapeByDescription when the user describes the shape. Use this only when you already have the exact shapeId and destination coordinates.',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to move. Get this from findShapesByColor, findShapesByType, or getCanvasState first.',
          },
          x: {
            type: 'number',
            description: 'New X coordinate (-2500 to 2500 for canvas). Canvas center is 0.',
          },
          y: {
            type: 'number',
            description: 'New Y coordinate (-2500 to 2500 for canvas). Canvas center is 0, 0.',
          },
        },
        required: ['shapeId', 'x', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize a shape when you already have the exact shapeId and the precise numeric dimensions. Circles require radius, rectangles require width & height. Prefer resizeShapeByDescription when the user describes the target shape.',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize. MUST be obtained from findShapesByType or findShapesByColor first.',
          },
          width: {
            type: 'number',
            description: 'New width in pixels (rectangles only)',
          },
          height: {
            type: 'number',
            description: 'New height in pixels (rectangles only)',
          },
          radius: {
            type: 'number',
            description: 'New radius in pixels (circles only)',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate a shape by a specified angle in degrees. IMPORTANT: To rotate "the text" or "the rectangle", you MUST first call findShapesByType to get the shapeId, THEN call rotateShape. Example: User says "Rotate the text 45 degrees" → Step 1: Call findShapesByType(type="text") → Step 2: Call rotateShape with the returned shapeId and rotation=45.',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to rotate. Get this from findShapesByType, findShapesByColor, or getCanvasState first.',
          },
          rotation: {
            type: 'number',
            description: 'Rotation angle in degrees (0-360)',
          },
        },
        required: ['shapeId', 'rotation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeColor',
      description: 'Change the color of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to change color',
          },
          color: {
            type: 'string',
            description: 'New color in hex format or CSS color name',
          },
        },
        required: ['shapeId', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateText',
      description: 'Update the text content or font size of a text shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the text shape to update',
          },
          text: {
            type: 'string',
            description: 'New text content',
          },
          fontSize: {
            type: 'number',
            description: 'New font size in pixels',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'changeFontSize',
      description: 'Change font size of selected text shapes. Use empty array [] for shapeIds to change font size of ALL selected text shapes. Example: "Make the text bigger" → changeFontSize(shapeIds=[], fontSize=32). This uses the same logic as the toolbar font size selector.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of text shape IDs to update. Use empty array [] to update all selected text shapes.',
          },
          fontSize: {
            type: 'number',
            description: 'New font size in pixels (e.g., 12, 16, 24, 32, 48, 64)',
          },
        },
        required: ['shapeIds', 'fontSize'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rotateShapes',
      description: 'Rotate shapes by a specified angle. Use empty array [] for shapeIds to rotate ALL shapes on canvas. Example: "Rotate the text 45 degrees" → rotateShapes(shapeIds=[], rotation=45). Works for all shape types (circles, rectangles, text).',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to rotate. Use empty array [] to rotate all shapes on canvas.',
          },
          rotation: {
            type: 'number',
            description: 'Rotation angle in degrees (0-360)',
          },
        },
        required: ['shapeIds', 'rotation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to delete',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteMultipleShapes',
      description: 'Delete multiple shapes at once',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to delete',
          },
        },
        required: ['shapeIds'],
      },
    },
  },

  // ==========================================
  // BATCH MANIPULATION TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'moveMultipleShapes',
      description: 'Move multiple shapes at once. Use for commands like "move all shapes to the right" or "move 500 objects". Can apply relative or absolute movements.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to move. If empty, moves all shapes on canvas.',
          },
          deltaX: {
            type: 'number',
            description: 'Relative X movement (pixels). Use for "move right 100px" → deltaX=100. Mutually exclusive with x.',
          },
          deltaY: {
            type: 'number',
            description: 'Relative Y movement (pixels). Use for "move down 50px" → deltaY=50. Mutually exclusive with y.',
          },
          x: {
            type: 'number',
            description: 'Absolute X position (pixels). Use for "move all to x=500". Mutually exclusive with deltaX.',
          },
          y: {
            type: 'number',
            description: 'Absolute Y position (pixels). Use for "move all to y=300". Mutually exclusive with deltaY.',
          },
        },
        required: ['shapeIds'],
      },
    },
  },

  // ==========================================
  // QUERY TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get all shapes currently on the canvas with their properties',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'findShapesByType',
      description: 'Find all shapes of a specific type (rectangle, circle, or text)',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Type of shapes to find',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'findShapesByColor',
      description: 'Find all shapes with a specific color',
      parameters: {
        type: 'object',
        properties: {
          color: {
            type: 'string',
            description: 'Color to search for (hex format or CSS color name)',
          },
        },
        required: ['color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'findShapesByText',
      description: 'Find text shapes containing specific text',
      parameters: {
        type: 'object',
        properties: {
          searchText: {
            type: 'string',
            description: 'Text to search for (case-insensitive partial match)',
          },
        },
        required: ['searchText'],
      },
    },
  },

  // ==========================================
  // ALIGNMENT TOOLS (from toolbar)
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'alignLeft',
      description: 'Align selected shapes to the left edge. Use empty array [] for shapeIds to align ALL selected shapes. Example: "Align these shapes to the left" → alignLeft(shapeIds=[]).',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align. Use empty array [] to align all selected shapes.',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignCenter',
      description: 'Align selected shapes to their collective center. Use empty array [] for shapeIds to align ALL selected shapes. Example: "Align these shapes to center" → alignCenter(shapeIds=[]).',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align. Use empty array [] to align all selected shapes.',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'alignRight',
      description: 'Align selected shapes to the right edge. Use empty array [] for shapeIds to align ALL selected shapes. Example: "Align these shapes to the right" → alignRight(shapeIds=[]).',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align. Use empty array [] to align all selected shapes.',
          },
        },
        required: ['shapeIds'],
      },
    },
  },

  // ==========================================
  // DISTRIBUTION TOOLS (from toolbar)
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'arrangeHorizontal',
      description: 'Arrange shapes in a horizontal row. IMPORTANT: Pass empty array [] for shapeIds to arrange ALL shapes on canvas automatically - you do NOT need to call getCanvasState first. Example: User says "Arrange these shapes in a horizontal row" → DIRECTLY call arrangeHorizontal with shapeIds=[], startX=50, y=200. The tool will find all shapes automatically.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange. IMPORTANT: Use empty array [] to automatically arrange ALL shapes on canvas without needing to query them first.',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate for the first shape. Default: 50',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for all shapes (horizontal alignment). Default: 200',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels. Default: 20',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeVertical',
      description: 'Arrange shapes in a vertical column/line. IMPORTANT: Pass empty array [] for shapeIds to arrange ALL shapes on canvas automatically - you do NOT need to call getCanvasState first. Example: User says "Create 5 circles in a vertical line" → FIRST call createMultipleShapes with 5 circles at x:0, y:0, THEN IMMEDIATELY call arrangeVertical with shapeIds=[], x=100, startY=100. The tool will find all shapes automatically.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange. IMPORTANT: Use empty array [] to automatically arrange ALL shapes on canvas without needing to query them first.',
          },
          x: {
            type: 'number',
            description: 'X coordinate for all shapes (vertical alignment). Default: 100',
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate for the first shape. Default: 100',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels. Default: 120',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeGrid',
      description: 'Arrange shapes in a grid layout with rows and columns. MUST be called AFTER createMultipleShapes to arrange the created shapes. Use shapeIds=[] (empty array) to arrange ALL shapes on canvas. The grid will be automatically centered. This tool repositions shapes, so do NOT pre-calculate grid positions in createMultipleShapes.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange in a grid. MUST use [] (empty array) to arrange all shapes on canvas after createMultipleShapes.',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate for the grid (optional, defaults to auto-centered based on grid size)',
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate for the grid (optional, defaults to auto-centered based on grid size)',
          },
          columns: {
            type: 'number',
            description: 'Number of columns in the grid. For a 3x3 grid, use columns=3.',
          },
          spacingX: {
            type: 'number',
            description: 'Horizontal spacing between shapes in pixels (default: 20, recommended: 120 for typical shapes)',
          },
          spacingY: {
            type: 'number',
            description: 'Vertical spacing between shapes in pixels (default: 20, recommended: 120 for typical shapes)',
          },
        },
        required: ['shapeIds', 'columns'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'centerShape',
      description: 'Center a shape on the canvas or at a specific point',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to center',
          },
          canvasWidth: {
            type: 'number',
            description: 'Canvas width for centering (default: 1200)',
          },
          canvasHeight: {
            type: 'number',
            description: 'Canvas height for centering (default: 800)',
          },
        },
        required: ['shapeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'distributeHorizontally',
      description: 'Distribute shapes evenly across horizontal space. IMPORTANT: Pass empty array [] for shapeIds to distribute ALL shapes automatically - you do NOT need to call getCanvasState first. Example: "Space these elements evenly" → DIRECTLY call distributeHorizontally with shapeIds=[], startX=50, endX=700, y=200. The tool will find all shapes automatically.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to distribute. IMPORTANT: Use empty array [] to automatically distribute ALL shapes on canvas without needing to query them first.',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate. Default: 50',
          },
          endX: {
            type: 'number',
            description: 'Ending X coordinate. Default: 700',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for alignment. Default: 200',
          },
        },
        required: ['shapeIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'distributeVertically',
      description: 'Distribute shapes evenly across vertical space',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to distribute',
          },
          x: {
            type: 'number',
            description: 'X coordinate for alignment',
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate',
          },
          endY: {
            type: 'number',
            description: 'Ending Y coordinate',
          },
        },
        required: ['shapeIds', 'x', 'startY', 'endY'],
      },
    },
  },

  // ==========================================
  // UTILITY TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getCanvasBounds',
      description: 'Get the current canvas dimensions',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clearCanvas',
      description: 'Delete all shapes from the canvas',
      parameters: {
        type: 'object',
        properties: {
          confirm: {
            type: 'boolean',
            description: 'Must be true to confirm deletion of all shapes',
          },
        },
        required: ['confirm'],
      },
    },
  },
];

/**
 * Get a specific tool by name
 */
export const getToolByName = (
  name: string
): OpenAI.Chat.ChatCompletionTool | undefined => {
  const isFunctionTool = (
    tool: OpenAI.Chat.ChatCompletionTool
  ): tool is OpenAI.Chat.ChatCompletionTool & { function: { name: string } } => {
    return (tool as any).function !== undefined;
  };

  return aiToolsSchema.find((tool) => isFunctionTool(tool) && tool.function.name === name);
};

/**
 * Get all tool names
 */
export const getAllToolNames = (): string[] => {
  const isFunctionTool = (
    tool: OpenAI.Chat.ChatCompletionTool
  ): tool is OpenAI.Chat.ChatCompletionTool & { function: { name: string } } => {
    return (tool as any).function !== undefined;
  };

  return aiToolsSchema.filter(isFunctionTool).map((tool) => tool.function.name);
};

/**
 * Tool categories for organization
 */
export const TOOL_CATEGORIES = {
  CREATION: ['createRectangle', 'createCircle', 'createText', 'createMultipleShapes'],
  SMART_MANIPULATION: ['moveShapeByDescription', 'resizeShapeByDescription', 'rotateShapeByDescription'],
  MANIPULATION: ['moveShape', 'resizeShape', 'rotateShape', 'rotateShapes', 'changeColor', 'updateText', 'changeFontSize', 'deleteShape', 'deleteMultipleShapes'],
  BATCH_MANIPULATION: ['moveMultipleShapes'],
  QUERY: ['getCanvasState', 'findShapesByType', 'findShapesByColor', 'findShapesByText'],
  ALIGNMENT: ['alignLeft', 'alignCenter', 'alignRight'], // From toolbar
  DISTRIBUTION: ['arrangeHorizontal', 'distributeHorizontally', 'distributeVertically'], // From toolbar
  LEGACY_LAYOUT: ['arrangeVertical', 'arrangeGrid', 'centerShape'], // Legacy - not in toolbar
  UTILITY: ['getCanvasBounds', 'clearCanvas'],
} as const;
