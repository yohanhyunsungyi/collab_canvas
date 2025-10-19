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
  // Simplified schema - will need to copy from ai-tools.schema.ts
  // For now, return a basic set of tools
  return [
    {
      type: 'function',
      function: {
        name: 'createRectangle',
        description: 'Create a rectangle on the canvas',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
            color: { type: 'string' },
          },
          required: ['width', 'height'],
        },
      },
    },
    // Add more tools here...
  ];
}

