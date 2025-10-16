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
      description: 'Create a rectangle shape on the canvas',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X coordinate (pixels from left edge)',
          },
          y: {
            type: 'number',
            description: 'Y coordinate (pixels from top edge)',
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
            description: 'Color in hex format (e.g., "#FF0000" for red) or CSS color name',
          },
        },
        required: ['x', 'y', 'width', 'height', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCircle',
      description: 'Create a circle shape on the canvas',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X coordinate of circle center (pixels from left edge)',
          },
          y: {
            type: 'number',
            description: 'Y coordinate of circle center (pixels from top edge)',
          },
          radius: {
            type: 'number',
            description: 'Radius of the circle in pixels',
          },
          color: {
            type: 'string',
            description: 'Color in hex format (e.g., "#00FF00" for green) or CSS color name',
          },
        },
        required: ['x', 'y', 'radius', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createText',
      description: 'Create a text element on the canvas',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X coordinate (pixels from left edge)',
          },
          y: {
            type: 'number',
            description: 'Y coordinate (pixels from top edge)',
          },
          text: {
            type: 'string',
            description: 'The text content to display',
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (default: 24)',
          },
          color: {
            type: 'string',
            description: 'Text color in hex format or CSS color name (default: "#000000")',
          },
        },
        required: ['x', 'y', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createMultipleShapes',
      description: 'Create multiple shapes at once (for complex layouts)',
      parameters: {
        type: 'object',
        properties: {
          shapes: {
            type: 'array',
            description: 'Array of shape definitions to create',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['rectangle', 'circle', 'text'],
                  description: 'Type of shape to create',
                },
                x: { type: 'number', description: 'X coordinate' },
                y: { type: 'number', description: 'Y coordinate' },
                width: { type: 'number', description: 'Width (rectangle only)' },
                height: { type: 'number', description: 'Height (rectangle only)' },
                radius: { type: 'number', description: 'Radius (circle only)' },
                text: { type: 'string', description: 'Text content (text only)' },
                fontSize: { type: 'number', description: 'Font size (text only)' },
                color: { type: 'string', description: 'Color' },
              },
              required: ['type', 'x', 'y', 'color'],
            },
          },
        },
        required: ['shapes'],
      },
    },
  },

  // ==========================================
  // MANIPULATION TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move a shape to a new position',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to move',
          },
          x: {
            type: 'number',
            description: 'New X coordinate',
          },
          y: {
            type: 'number',
            description: 'New Y coordinate',
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
      description: 'Resize a shape (rectangle or circle)',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize',
          },
          width: {
            type: 'number',
            description: 'New width (rectangles only)',
          },
          height: {
            type: 'number',
            description: 'New height (rectangles only)',
          },
          radius: {
            type: 'number',
            description: 'New radius (circles only)',
          },
        },
        required: ['shapeId'],
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
  // LAYOUT TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'arrangeHorizontal',
      description: 'Arrange multiple shapes in a horizontal row with equal spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate for the first shape',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for all shapes (horizontal alignment)',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels (default: 20)',
          },
        },
        required: ['shapeIds', 'startX', 'y'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeVertical',
      description: 'Arrange multiple shapes in a vertical column with equal spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange',
          },
          x: {
            type: 'number',
            description: 'X coordinate for all shapes (vertical alignment)',
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate for the first shape',
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes in pixels (default: 20)',
          },
        },
        required: ['shapeIds', 'x', 'startY'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'arrangeGrid',
      description: 'Arrange shapes in a grid layout with rows and columns',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange in a grid',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate for the grid',
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate for the grid',
          },
          columns: {
            type: 'number',
            description: 'Number of columns in the grid',
          },
          spacingX: {
            type: 'number',
            description: 'Horizontal spacing between shapes (default: 20)',
          },
          spacingY: {
            type: 'number',
            description: 'Vertical spacing between shapes (default: 20)',
          },
        },
        required: ['shapeIds', 'startX', 'startY', 'columns'],
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
      description: 'Distribute shapes evenly across horizontal space',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to distribute',
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate',
          },
          endX: {
            type: 'number',
            description: 'Ending X coordinate',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for alignment',
          },
        },
        required: ['shapeIds', 'startX', 'endX', 'y'],
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
  return aiToolsSchema.find((tool) => tool.function.name === name);
};

/**
 * Get all tool names
 */
export const getAllToolNames = (): string[] => {
  return aiToolsSchema.map((tool) => tool.function.name);
};

/**
 * Tool categories for organization
 */
export const TOOL_CATEGORIES = {
  CREATION: ['createRectangle', 'createCircle', 'createText', 'createMultipleShapes'],
  MANIPULATION: ['moveShape', 'resizeShape', 'changeColor', 'updateText', 'deleteShape', 'deleteMultipleShapes'],
  QUERY: ['getCanvasState', 'findShapesByType', 'findShapesByColor', 'findShapesByText'],
  LAYOUT: ['arrangeHorizontal', 'arrangeVertical', 'arrangeGrid', 'centerShape', 'distributeHorizontally', 'distributeVertically'],
  UTILITY: ['getCanvasBounds', 'clearCanvas'],
} as const;

