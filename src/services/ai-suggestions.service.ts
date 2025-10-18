import OpenAI from 'openai';
import type { CanvasShape } from '../types/canvas.types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

let openaiClient: OpenAI | null = null;

if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

export interface DesignSuggestion {
  id: string;
  type: 'alignment' | 'spacing' | 'color' | 'grouping' | 'layout';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedShapeIds: string[];
  changes: SuggestionChange[];
}

export interface SuggestionChange {
  shapeId: string;
  property: 'x' | 'y' | 'color' | 'width' | 'height' | 'rotation';
  oldValue: string | number;
  newValue: string | number;
}

/**
 * Analyzes the current canvas state and generates design improvement suggestions
 */
export async function analyzeCanvasDesign(shapes: CanvasShape[]): Promise<DesignSuggestion[]> {
  if (!openaiClient) {
    throw new Error('OpenAI API not configured');
  }

  if (shapes.length === 0) {
    return [];
  }

  // Prepare canvas analysis data
  const canvasAnalysis = analyzeCanvasState(shapes);
  
  // Create AI prompt for design suggestions
  const systemPrompt = `You are a professional UI/UX designer analyzing a canvas design. 
Analyze the provided canvas state and suggest improvements for:
- Alignment issues (objects that are almost but not quite aligned)
- Spacing issues (inconsistent gaps between objects)
- Color harmony (clashing colors, too many colors, accessibility issues)
- Grouping opportunities (related objects that should be grouped)
- Layout improvements (better arrangement of elements)

Provide specific, actionable suggestions with exact position/color values.
Return suggestions as a JSON array with this schema:
{
  "suggestions": [
    {
      "type": "alignment" | "spacing" | "color" | "grouping" | "layout",
      "title": "Short title",
      "description": "Detailed explanation",
      "severity": "low" | "medium" | "high",
      "affectedShapeIds": ["id1", "id2"],
      "changes": [
        {
          "shapeId": "id1",
          "property": "x" | "y" | "color",
          "oldValue": current value,
          "newValue": suggested value
        }
      ]
    }
  ]
}

Only suggest improvements that would meaningfully improve the design. Limit to 5-8 suggestions.`;

  const userPrompt = `Analyze this canvas and suggest design improvements:

Canvas State:
${JSON.stringify(canvasAnalysis, null, 2)}

Provide actionable design suggestions.`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);
    const suggestions = result.suggestions || [];

    // Add unique IDs to suggestions
    return suggestions.map((suggestion: any, index: number) => ({
      ...suggestion,
      id: `suggestion-${Date.now()}-${index}`,
    }));
  } catch (error) {
    console.error('Error getting design suggestions:', error);
    throw error;
  }
}

/**
 * Analyzes canvas state to identify potential issues
 */
function analyzeCanvasState(shapes: CanvasShape[]) {
  const analysis: any = {
    totalShapes: shapes.length,
    shapeTypes: {} as Record<string, number>,
    colors: new Set<string>(),
    positions: [] as any[],
    bounds: {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    },
  };

  shapes.forEach((shape) => {
    // Count shape types
    analysis.shapeTypes[shape.type] = (analysis.shapeTypes[shape.type] || 0) + 1;

    // Collect colors
    analysis.colors.add(shape.color);

    // Collect positions
    const shapeData: any = {
      id: shape.id,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      color: shape.color,
    };

    if (shape.type === 'rectangle') {
      shapeData.width = shape.width;
      shapeData.height = shape.height;
      analysis.bounds.minX = Math.min(analysis.bounds.minX, shape.x);
      analysis.bounds.maxX = Math.max(analysis.bounds.maxX, shape.x + shape.width);
      analysis.bounds.minY = Math.min(analysis.bounds.minY, shape.y);
      analysis.bounds.maxY = Math.max(analysis.bounds.maxY, shape.y + shape.height);
    } else if (shape.type === 'circle') {
      shapeData.radius = shape.radius;
      analysis.bounds.minX = Math.min(analysis.bounds.minX, shape.x - shape.radius);
      analysis.bounds.maxX = Math.max(analysis.bounds.maxX, shape.x + shape.radius);
      analysis.bounds.minY = Math.min(analysis.bounds.minY, shape.y - shape.radius);
      analysis.bounds.maxY = Math.max(analysis.bounds.maxY, shape.y + shape.radius);
    } else if (shape.type === 'text') {
      shapeData.text = shape.text;
      shapeData.fontSize = shape.fontSize;
    }

    analysis.positions.push(shapeData);
  });

  analysis.colors = Array.from(analysis.colors);
  analysis.colorCount = analysis.colors.length;

  // Detect near-alignments (shapes that are almost aligned)
  const nearAlignments = detectNearAlignments(shapes);
  analysis.nearAlignments = nearAlignments;

  // Detect spacing inconsistencies
  const spacingIssues = detectSpacingIssues(shapes);
  analysis.spacingIssues = spacingIssues;

  return analysis;
}

/**
 * Detects shapes that are almost but not quite aligned
 */
function detectNearAlignments(shapes: CanvasShape[]): any[] {
  const alignments: any[] = [];
  const ALIGNMENT_THRESHOLD = 10; // pixels

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const shape1 = shapes[i];
      const shape2 = shapes[j];

      // Check horizontal near-alignment
      const xDiff = Math.abs(shape1.x - shape2.x);
      if (xDiff > 0 && xDiff < ALIGNMENT_THRESHOLD) {
        alignments.push({
          type: 'horizontal',
          shapes: [shape1.id, shape2.id],
          difference: xDiff,
        });
      }

      // Check vertical near-alignment
      const yDiff = Math.abs(shape1.y - shape2.y);
      if (yDiff > 0 && yDiff < ALIGNMENT_THRESHOLD) {
        alignments.push({
          type: 'vertical',
          shapes: [shape1.id, shape2.id],
          difference: yDiff,
        });
      }
    }
  }

  return alignments;
}

/**
 * Detects inconsistent spacing between shapes
 */
function detectSpacingIssues(shapes: CanvasShape[]): any[] {
  const issues: any[] = [];
  
  // Sort shapes by x position
  const sortedByX = [...shapes].sort((a, b) => a.x - b.x);
  
  // Calculate gaps between consecutive shapes
  const gaps: number[] = [];
  for (let i = 0; i < sortedByX.length - 1; i++) {
    const shape1 = sortedByX[i];
    const shape2 = sortedByX[i + 1];
    
    let rightEdge1 = shape1.x;
    if (shape1.type === 'rectangle') rightEdge1 += shape1.width;
    else if (shape1.type === 'circle') rightEdge1 += shape1.radius;
    
    const leftEdge2 = shape2.x;
    const gap = leftEdge2 - rightEdge1;
    
    if (gap > 0) {
      gaps.push(gap);
    }
  }
  
  // Check for inconsistent gaps (variance in spacing)
  if (gaps.length > 2) {
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    
    if (variance > 100) {
      issues.push({
        type: 'inconsistent_spacing',
        average: avgGap,
        variance: variance,
        gaps: gaps,
      });
    }
  }
  
  return issues;
}

/**
 * Check if AI suggestions service is available
 */
export function isAISuggestionsAvailable(): boolean {
  return openaiClient !== null;
}

