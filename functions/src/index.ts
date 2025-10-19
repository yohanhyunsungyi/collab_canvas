import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize OpenAI client with API key from Functions config
const getOpenAIClient = (): OpenAI | null => {
  const apiKey = functions.config().openai?.key;
  if (!apiKey) {
    console.error('OpenAI API key not configured. Run: firebase functions:config:set openai.key="YOUR_API_KEY"');
    return null;
  }
  return new OpenAI({ apiKey });
};

/**
 * AI Command Processing Function
 * Processes natural language commands and returns tool calls for the client to execute
 */
export const processAICommand = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to use AI features'
    );
  }

  const { prompt } = data;

  if (!prompt || typeof prompt !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Prompt is required and must be a string'
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'AI service is not configured'
    );
  }

  try {
    // Import the tools schema (we'll need to copy this to functions)
    const tools = getAIToolsSchema();
    const relevantTools = filterRelevantTools(tools, prompt);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: relevantTools,
      tool_choice: 'auto',
      parallel_tool_calls: true,
    });

    const message = response.choices[0]?.message;
    
    if (!message) {
      throw new Error('No response from AI');
    }

    return {
      success: true,
      message: message.content || 'Command processed',
      toolCalls: message.tool_calls?.map((tc) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })) || [],
    };
  } catch (error) {
    console.error('Error processing AI command:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to process command: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * AI Design Suggestions Function
 * Analyzes canvas shapes and provides design improvement suggestions
 */
export const analyzeDesign = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to use AI features'
    );
  }

  const { shapes } = data;

  if (!shapes || !Array.isArray(shapes)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Shapes array is required'
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'AI service is not configured'
    );
  }

  try {
    const canvasAnalysis = analyzeCanvasState(shapes);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getDesignAnalysisSystemPrompt(),
        },
        {
          role: 'user',
          content: `Analyze this canvas design and provide professional improvement suggestions.\n\n**Canvas Analysis:**\n${JSON.stringify(canvasAnalysis, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);
    const suggestions = result.suggestions || [];

    return {
      success: true,
      suggestions: suggestions.map((suggestion: any, index: number) => ({
        ...suggestion,
        id: `suggestion-${Date.now()}-${index}`,
      })),
    };
  } catch (error) {
    console.error('Error analyzing design:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to analyze design: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Helper functions (these will be simplified versions - copy the essential logic)

function getSystemPrompt(): string {
  return `You are a canvas AI assistant. You help users create and manipulate shapes on a canvas.

Available tools:
- createRectangle, createCircle, createText, createMultipleShapes
- moveShape, resizeShape, rotateShape, changeColor, updateText
- arrangeHorizontal, arrangeVertical, arrangeGrid, centerShape
- deleteShape, deleteMultipleShapes
- Complex: createLoginForm, createNavigationBar, createCardLayout, createDashboard

Important:
1. Always use tool calls for actions
2. Use viewport center (x: 0, y: 0) when position not specified
3. Select appropriate colors and sizes
4. Return multiple tool calls for complex requests
5. Always complete commands with tool calls`;
}

function getDesignAnalysisSystemPrompt(): string {
  return `You are an expert UI/UX designer analyzing canvas designs. Provide 6-10 actionable improvement suggestions covering alignment, spacing, color, typography, layout, and completeness. Return valid JSON with this schema:
{
  "suggestions": [
    {
      "type": "alignment" | "spacing" | "color" | "grouping" | "layout" | "completeness",
      "title": "Brief title",
      "description": "Clear explanation with design principle",
      "severity": "low" | "medium" | "high",
      "affectedShapeIds": ["id1"],
      "changes": [{"shapeId": "id1", "property": "x", "oldValue": 100, "newValue": 120}],
      "newElements": []
    }
  ]
}`;
}

function analyzeCanvasState(shapes: any[]): any {
  return {
    totalShapes: shapes.length,
    types: shapes.reduce((acc: any, shape) => {
      acc[shape.type] = (acc[shape.type] || 0) + 1;
      return acc;
    }, {}),
    colors: [...new Set(shapes.map((s) => s.color))],
    bounds: shapes.reduce((acc, shape) => {
      const left = shape.x;
      const top = shape.y;
      return {
        minX: Math.min(acc.minX, left),
        maxX: Math.max(acc.maxX, left + (shape.width || 0)),
        minY: Math.min(acc.minY, top),
        maxY: Math.max(acc.maxY, top + (shape.height || 0)),
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }),
  };
}

function filterRelevantTools(tools: any[], prompt: string): any[] {
  // Simplified tool filtering - return all tools for now
  // In production, implement smart filtering based on prompt keywords
  return tools;
}

function getAIToolsSchema(): any[] {
  // Full AI tools schema copied from ai-tools.schema.ts
  return [
    // CREATION TOOLS
    {
      type: 'function',
      function: {
        name: 'createRectangle',
        description: 'Create a rectangle shape on the canvas.',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate (pixels from left edge). Default: 100' },
            y: { type: 'number', description: 'Y coordinate (pixels from top edge). Default: 100' },
            width: { type: 'number', description: 'Width of the rectangle in pixels' },
            height: { type: 'number', description: 'Height of the rectangle in pixels' },
            color: { type: 'string', description: 'Color in hex format or CSS color name. Default: "#0000FF"' },
          },
          required: ['width', 'height'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createCircle',
        description: 'Create a circle shape on the canvas.',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate of circle center. Default: 100' },
            y: { type: 'number', description: 'Y coordinate of circle center. Default: 200' },
            radius: { type: 'number', description: 'Radius of the circle in pixels. Default: 50' },
            color: { type: 'string', description: 'Color in hex format or CSS color name. Default: "#FF0000"' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createText',
        description: 'Create a text element on the canvas.',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate. Default: 150' },
            y: { type: 'number', description: 'Y coordinate. Default: 150' },
            text: { type: 'string', description: 'The text content to display' },
            fontSize: { type: 'number', description: 'Font size in pixels. Default: 24' },
            color: { type: 'string', description: 'Text color. Default: "#000000"' },
          },
          required: ['text'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createMultipleShapes',
        description: 'Create multiple identical shapes with INSTANT grid positioning.',
        parameters: {
          type: 'object',
          properties: {
            shapes: {
              type: 'array',
              description: 'Array with ONE shape definition that will be duplicated.',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['rectangle', 'circle', 'text'] },
                  x: { type: 'number' },
                  y: { type: 'number' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  radius: { type: 'number' },
                  text: { type: 'string' },
                  fontSize: { type: 'number' },
                  color: { type: 'string' },
                },
                required: ['type', 'x', 'y'],
              },
            },
            count: { type: 'number', description: 'Number of times to duplicate the shape' },
            spacingX: { type: 'number', description: 'Horizontal spacing in pixels' },
            spacingY: { type: 'number', description: 'Vertical spacing in pixels' },
          },
          required: ['shapes'],
        },
      },
    },
    // SMART MANIPULATION TOOLS
    {
      type: 'function',
      function: {
        name: 'moveShapeByDescription',
        description: 'Move a shape by describing it (color or type).',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['rectangle', 'circle', 'text'] },
            color: { type: 'string' },
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: ['x', 'y'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'resizeShapeByDescription',
        description: 'Resize a shape by describing it.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['rectangle', 'circle', 'text'] },
            color: { type: 'string' },
            scaleMultiplier: { type: 'number' },
            newWidth: { type: 'number' },
            newHeight: { type: 'number' },
            newRadius: { type: 'number' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'rotateShapeByDescription',
        description: 'Rotate a shape by describing it.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['rectangle', 'circle', 'text'] },
            color: { type: 'string' },
            rotation: { type: 'number', description: 'Rotation angle in degrees' },
          },
          required: ['type', 'rotation'],
        },
      },
    },
    // LOW-LEVEL MANIPULATION TOOLS
    {
      type: 'function',
      function: {
        name: 'moveShape',
        description: 'Move a shape to a new position using a known shapeId.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: { type: 'string' },
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: ['shapeId', 'x', 'y'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'resizeShape',
        description: 'Resize a shape when you have the exact shapeId.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
            radius: { type: 'number' },
          },
          required: ['shapeId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'rotateShape',
        description: 'Rotate a shape by a specified angle.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: { type: 'string' },
            rotation: { type: 'number' },
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
            shapeId: { type: 'string' },
            color: { type: 'string' },
          },
          required: ['shapeId', 'color'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'updateText',
        description: 'Update text content or font size',
        parameters: {
          type: 'object',
          properties: {
            shapeId: { type: 'string' },
            text: { type: 'string' },
            fontSize: { type: 'number' },
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
            shapeId: { type: 'string' },
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
            shapeIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['shapeIds'],
        },
      },
    },
    // QUERY TOOLS
    {
      type: 'function',
      function: {
        name: 'getCanvasState',
        description: 'Get all shapes currently on the canvas',
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
        description: 'Find all shapes of a specific type',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['rectangle', 'circle', 'text'] },
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
            color: { type: 'string' },
          },
          required: ['color'],
        },
      },
    },
    // ALIGNMENT TOOLS
    {
      type: 'function',
      function: {
        name: 'alignLeft',
        description: 'Align selected shapes to the left edge',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['shapeIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'alignCenter',
        description: 'Align selected shapes to their collective center',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['shapeIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'alignRight',
        description: 'Align selected shapes to the right edge',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['shapeIds'],
        },
      },
    },
    // DISTRIBUTION TOOLS
    {
      type: 'function',
      function: {
        name: 'arrangeHorizontal',
        description: 'Arrange shapes in a horizontal row',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' } },
            startX: { type: 'number' },
            y: { type: 'number' },
            spacing: { type: 'number' },
          },
          required: ['shapeIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'arrangeVertical',
        description: 'Arrange shapes in a vertical column',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' } },
            x: { type: 'number' },
            startY: { type: 'number' },
            spacing: { type: 'number' },
          },
          required: ['shapeIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'arrangeGrid',
        description: 'Rearrange EXISTING shapes into a grid layout',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' } },
            startX: { type: 'number' },
            startY: { type: 'number' },
            columns: { type: 'number' },
            spacingX: { type: 'number' },
            spacingY: { type: 'number' },
          },
          required: ['shapeIds', 'columns'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'centerShape',
        description: 'Center a shape on the canvas',
        parameters: {
          type: 'object',
          properties: {
            shapeId: { type: 'string' },
            canvasWidth: { type: 'number' },
            canvasHeight: { type: 'number' },
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
            shapeIds: { type: 'array', items: { type: 'string' } },
            startX: { type: 'number' },
            endX: { type: 'number' },
            y: { type: 'number' },
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
            shapeIds: { type: 'array', items: { type: 'string' } },
            x: { type: 'number' },
            startY: { type: 'number' },
            endY: { type: 'number' },
          },
          required: ['shapeIds', 'x', 'startY', 'endY'],
        },
      },
    },
    // COMPLEX LAYOUT TOOLS
    {
      type: 'function',
      function: {
        name: 'createLoginForm',
        description: 'Create a complete professional login form with modern UI',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createNavigationBar',
        description: 'Create a professional navigation bar',
        parameters: {
          type: 'object',
          properties: {
            y: { type: 'number' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createCardLayout',
        description: 'Create a professional pricing/feature card',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createDashboard',
        description: 'Create a complete dashboard with 4 cards',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: [],
        },
      },
    },
    // UTILITY TOOLS
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
            confirm: { type: 'boolean' },
          },
          required: ['confirm'],
        },
      },
    },
  ];
}

