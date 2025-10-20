import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
// Color utilities are available but not directly used in this file
// They're exported for use in executor functions
export { resolveColorQuery, normalizeHexColor, filterShapesByColor } from './utils/colorMatching';
export { resolveColorToHex } from './utils/colors';

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
    const systemPrompt = getDesignAnalysisSystemPrompt();
    
    // User prompt (EXACT MATCH from ai-suggestions.service.ts)
    const userPrompt = `Analyze this canvas design and provide professional improvement suggestions.

**Canvas Analysis:**
${JSON.stringify(canvasAnalysis, null, 2)}

**Your Task:**
1. Review the canvas analysis data above
2. Identify 6-10 of the most impactful design improvements (provide at least 6 suggestions)
3. For each improvement:
   - Specify which design principle it addresses
   - Provide exact values for changes (positions, colors, sizes)
   - Explain WHY the change improves the design
4. Cover multiple improvement types: alignment, spacing, color harmony, typography, layout, and UI pattern completeness
5. Prioritize high-impact changes first (accessibility, usability, then polish)
6. Return ONLY valid JSON in the specified format

Focus on actionable improvements that will make a measurable difference in design quality. Be thorough and provide multiple suggestions across different design aspects.`;
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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

// ==========================================
// TOOL FILTERING & PROMPTS (Matched from client)
// ==========================================

/**
 * Tool categories for smart selection (EXACT MATCH from ai.service.ts)
 */
const TOOL_CATEGORIES: Record<string, string[]> = {
  basic_creation: ['createRectangle', 'createCircle', 'createText', 'createMultipleShapes'],
  complex_creation: ['createLoginForm', 'createNavigationBar', 'createCardLayout', 'createDashboard'],
  manipulation: ['moveShapeByDescription', 'resizeShapeByDescription', 'rotateShapeByDescription', 'changeColor', 'updateText', 'moveShape', 'resizeShape'],
  deletion: ['deleteShape', 'deleteMultipleShapes', 'clearCanvas'],
  layout: ['arrangeHorizontal', 'arrangeVertical', 'arrangeGrid', 'centerShape', 'distributeHorizontally', 'distributeVertically', 'distributeEvenly'],
  query: ['getCanvasState', 'findShapesByType', 'findShapesByColor', 'findShapesByText', 'getCanvasBounds'],
};

/**
 * Detect which tool categories are needed based on prompt keywords (EXACT MATCH from ai.service.ts)
 */
function detectToolCategories(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const categories: Set<string> = new Set();

  // Basic creation keywords
  if (/(create|add|make|draw|new)\s+(a\s+)?(circle|rectangle|square|text|shape|oval|box)/i.test(lower)) {
    categories.add('basic_creation');
  }

  // Complex creation keywords
  if (/(login\s*form|sign\s*in\s*form|nav|navigation\s*bar|header|card|pricing\s*card|dashboard|form|menu|sidebar|footer)/i.test(lower)) {
    categories.add('complex_creation');
  }

  // Catch-all creation
  if (/(create|add|make|build|draw|new)/i.test(lower) && 
      !categories.has('basic_creation') && 
      !categories.has('complex_creation')) {
    categories.add('basic_creation');
  }

  // Manipulation keywords
  if (/(move|shift|position|resize|scale|bigger|smaller|change\s*color|rotate|turn)/i.test(lower)) {
    categories.add('manipulation');
  }

  // Deletion keywords
  if (/(delete|remove|clear|erase)/i.test(lower)) {
    categories.add('deletion');
  }

  // Layout keywords
  if (/(arrange|align|distribute|center|grid|row|column|horizontal|vertical|space|evenly)/i.test(lower)) {
    categories.add('layout');
  }

  // Query keywords
  if (/(find|get|show|list|what|which|how\s*many)/i.test(lower)) {
    categories.add('query');
  }

  // Default fallback
  if (categories.size === 0) {
    categories.add('basic_creation');
    categories.add('manipulation');
  }

  return Array.from(categories);
}

/**
 * Filter tools based on prompt (EXACT MATCH from ai.service.ts)
 */
function filterRelevantTools(allTools: any[], prompt: string): any[] {
  const categories = detectToolCategories(prompt);
  
  const relevantToolNames = new Set<string>();
  categories.forEach(cat => {
    TOOL_CATEGORIES[cat]?.forEach(tool => {
      relevantToolNames.add(tool);
    });
  });

  const filtered = allTools.filter(tool => 
    tool.function && relevantToolNames.has(tool.function.name)
  );

  const reduction = Math.round((1 - filtered.length / allTools.length) * 100);
  console.log(`[Tool Filter] Categories: ${categories.join(', ')} | Tools: ${filtered.length}/${allTools.length} (${reduction}% reduction)`);
  
  return filtered;
}

/**
 * Optimized system prompt (EXACT MATCH from ai.service.ts)
 */
function getSystemPrompt(): string {
  return `You are an AI assistant for a 5000x5000px canvas with centered coordinates (0,0 at center).

COORDINATES: X: -2500 to 2500, Y: -2500 to 2500

SMART MANIPULATION TOOLS (ALWAYS USE THESE):
• Move: Use moveShapeByDescription(color, type, deltaX/deltaY) for "move the blue rectangle"
• Resize: Use resizeShapeByDescription(color, type, width/height) for "resize the circle"
• Rotate: Use rotateShapeByDescription(color, type, rotation) for "rotate the text 45 degrees"
• Delete: Use deleteShapeByDescription(color, type) for "delete the red square"
• These tools AUTOMATICALLY find shapes - no need to call findShapesByType first!

DIRECTIONAL MOVEMENTS (CRITICAL):
• Canvas is 5000x5000px - use LARGE delta values (800px) for clearly visible movements!
• For GENERIC commands ("move left", "move right"): Use moveMultipleShapes(shapeIds:[], deltaX/deltaY) - moves selected shapes
• For SPECIFIC commands ("move the blue rectangle left"): Use moveShapeByDescription(color="blue", type="rectangle", deltaX:-800)
• Delta values: left = deltaX:-800, right = deltaX:800, up = deltaY:-800, down = deltaY:800
• Examples:
  - "move left" → moveMultipleShapes(shapeIds:[], deltaX:-800)
  - "move the circle right" → moveShapeByDescription(type:"circle", deltaX:800)
  - "move the blue rectangle left" → moveShapeByDescription(color:"blue", type:"rectangle", deltaX:-800)
• IMPORTANT: shapeIds:[] means "use selected shapes", not "use all shapes"

COMPLEX LAYOUTS (use these tools directly):
• "login form" → createLoginForm (18 elements: title, fields, social buttons)
• "nav bar"/"header" → createNavigationBar (10+ elements: logo, menu, CTA)
• "card"/"pricing card" → createCardLayout (8 elements: border, title, image, description)
• "dashboard" → createDashboard (21 elements: 4 stat cards with metrics)

GRID LAYOUTS (OPTIMIZED - single step):
• createMultipleShapes automatically arranges shapes in a grid when they have the SAME x,y
• Spacing is AUTO-CALCULATED (shape size + 20px gap) if not specified
• For custom spacing, use spacingX/spacingY parameters explicitly
• Example: "Create 3x3 squares" → createMultipleShapes(shapes=[{x:0,y:0,width:100,height:100}], count:9) - auto 120px spacing
• Example: "Create 500 squares with 2px spacing" → createMultipleShapes(shapes=[{x:0,y:0,width:20,height:20}], count:500, spacingX:22, spacingY:22)
• Grid is calculated instantly during creation - NO need for arrangeGrid afterward!

KEY RULES:
1. Use LARGE delta values (800px) for clearly visible movements on 5000x5000px canvas
2. For generic commands ("move left"), use moveMultipleShapes(shapeIds:[], deltaX:±800) to move selected shapes
3. For specific commands ("move the blue rectangle left"), use moveShapeByDescription(color, type, deltaX:±800)
4. shapeIds:[] means "use currently selected shapes" - NEVER use it to mean "all shapes"
5. For grids: use createMultipleShapes with spacingX/spacingY (ONE step, instant arrangement)
6. For rotation: rotateShapes(shapeIds:[], rotation=degrees) for selected shapes
7. Be precise with coordinates; default to sensible values
8. Always complete commands with tool calls`;
}

/**
 * Design analysis system prompt (EXACT MATCH from ai-suggestions.service.ts)
 */
function getDesignAnalysisSystemPrompt(): string {
  return `You are an expert UI/UX designer and design system architect analyzing a canvas design. Use professional design principles to provide actionable improvements.

**DESIGN PRINCIPLES TO APPLY:**

1. **Alignment & Grid Systems**
   - Elements should align to a consistent grid (8px, 12px, or 16px grid recommended)
   - Near-alignments (within 5-10px) should be corrected - they look unintentional
   - Use edge alignment (left, right, center) for visual harmony
   - Center-align headings, left-align body content

2. **Spacing & Rhythm**
   - Use consistent spacing multiples (8px system: 8, 16, 24, 32, 48, 64)
   - Maintain even spacing between similar elements (buttons, cards, list items)
   - Increase spacing to create visual hierarchy and breathing room
   - Group related items closer, separate unrelated items with more space
   - Apply the proximity principle: related elements should be visually grouped

3. **Color Theory & Accessibility**
   - Limit palette to 2-3 primary colors + neutrals
   - Use 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
   - Check WCAG AA contrast (4.5:1 for text, 3:1 for UI elements)
   - Similar colors that are too close create visual confusion - differentiate or unify them
   - Use color to create hierarchy: bold for primary actions, muted for secondary

4. **Visual Hierarchy**
   - Larger elements draw more attention - use size to indicate importance
   - Apply the rule of thirds for focal points
   - Create clear visual flow (F-pattern or Z-pattern)
   - Use whitespace to separate sections and guide the eye

5. **Typography**
   - Use consistent font sizes (scale: 12, 14, 16, 18, 24, 32, 48, 64)
   - Maintain proper line height (1.4-1.6 for body text)
   - Limit to 2-3 font sizes per design
   - Ensure proper contrast for readability

6. **Balance & Composition**
   - Distribute visual weight evenly across the canvas
   - Use symmetry for formality, asymmetry for dynamism
   - Apply the golden ratio (1:1.618) for pleasing proportions
   - Leave adequate margins around the canvas edges (at least 24-32px)

7. **UI Pattern Recognition & Completeness**
   - Detect incomplete UI patterns and suggest missing elements
   - **Login Forms** should have: Username/email input, Password input, Submit button, Optional social login
   - **Navigation Bars** should have: Logo/brand, Menu items (3-5), CTA button, Optional search/profile
   - **Cards** should have: Title, Content/description, Action button, Optional image/metadata
   - **Forms** should have: Labels for inputs, Input fields, Submit button, Optional validation
   - **Dashboards** should have: Section headers, Data visualization, Consistent layout, Optional filters
   
   If you detect a partial UI pattern, suggest adding the missing elements to complete it.

**SEVERITY GUIDELINES:**
- **High**: Breaks usability or accessibility (poor contrast, overlapping elements, inconsistent spacing)
- **Medium**: Impacts visual quality (near-alignments, inconsistent colors, spacing variations)
- **Low**: Minor polish (small tweaks, optional improvements)

**RESPONSE FORMAT:**
Return ONLY valid JSON with this exact schema:
{
  "suggestions": [
    {
      "type": "alignment" | "spacing" | "color" | "grouping" | "layout" | "completeness",
      "title": "Brief, specific title",
      "description": "Clear explanation with design principle",
      "severity": "low" | "medium" | "high",
      "affectedShapeIds": ["id1", "id2"],
      "changes": [
        {
          "shapeId": "id1",
          "property": "x" | "y" | "color" | "width" | "height",
          "oldValue": current_value,
          "newValue": suggested_value
        }
      ],
      "newElements": [
        {
          "type": "rectangle" | "circle" | "text",
          "x": number,
          "y": number,
          "width": number,
          "height": number,
          "radius": number,
          "color": "#hexcolor",
          "text": "Text content",
          "fontSize": number
        }
      ]
    }
  ]
}

Note: Use "newElements" when suggesting to ADD missing components. Use "changes" for modifying existing elements.

**IMPORTANT:**
- Provide 5-10 suggestions prioritized by impact (aim for at least 6-8 suggestions when possible)
- Each suggestion must include specific changes with exact values
- Explain the design principle behind each suggestion
- Focus on high-impact improvements first
- Detect incomplete UI patterns and suggest completion
- Be specific and actionable
- Look for multiple types: alignment, spacing, color, typography, layout, completeness`;
}

/**
 * Analyze canvas state (EXACT MATCH from ai-suggestions.service.ts with all helpers)
 */
function analyzeCanvasState(shapes: any[]): any {
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
    analysis.shapeTypes[shape.type] = (analysis.shapeTypes[shape.type] || 0) + 1;
    analysis.colors.add(shape.color);

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

  const canvasWidth = analysis.bounds.maxX - analysis.bounds.minX;
  const canvasHeight = analysis.bounds.maxY - analysis.bounds.minY;
  analysis.canvasDimensions = {
    width: canvasWidth,
    height: canvasHeight,
    aspectRatio: canvasWidth / canvasHeight,
  };

  // Add all analysis functions
  analysis.nearAlignments = detectNearAlignments(shapes);
  analysis.spacingIssues = detectSpacingIssues(shapes);
  analysis.gridAdherence = analyzeGridAdherence(shapes);
  analysis.colorAnalysis = analyzeColorPalette(Array.from(analysis.colors));
  analysis.typography = analyzeTypography(shapes);
  analysis.visualBalance = analyzeVisualBalance(shapes);
  analysis.whitespace = analyzeWhitespace(shapes, canvasWidth, canvasHeight);
  analysis.uiPatterns = detectUIPatterns(shapes);

  return analysis;
}

// Helper analysis functions (from ai-suggestions.service.ts)
function detectNearAlignments(shapes: any[]): any[] {
  const alignments: any[] = [];
  const THRESHOLD = 10;

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const xDiff = Math.abs(shapes[i].x - shapes[j].x);
      const yDiff = Math.abs(shapes[i].y - shapes[j].y);
      
      if (xDiff > 0 && xDiff < THRESHOLD) {
        alignments.push({ type: 'horizontal', shapes: [shapes[i].id, shapes[j].id], difference: xDiff });
      }
      if (yDiff > 0 && yDiff < THRESHOLD) {
        alignments.push({ type: 'vertical', shapes: [shapes[i].id, shapes[j].id], difference: yDiff });
      }
    }
  }

  return alignments;
}

function detectSpacingIssues(shapes: any[]): any[] {
  const issues: any[] = [];
  const sortedByX = [...shapes].sort((a, b) => a.x - b.x);
  const gaps: number[] = [];

  for (let i = 0; i < sortedByX.length - 1; i++) {
    const s1 = sortedByX[i];
    const s2 = sortedByX[i + 1];
    let rightEdge = s1.x;
    if (s1.type === 'rectangle') rightEdge += s1.width;
    else if (s1.type === 'circle') rightEdge += s1.radius;
    const gap = s2.x - rightEdge;
    if (gap > 0) gaps.push(gap);
  }

  if (gaps.length > 2) {
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avg, 2), 0) / gaps.length;
    if (variance > 100) {
      issues.push({ type: 'inconsistent_spacing', average: avg, variance, gaps });
    }
  }

  return issues;
}

function analyzeGridAdherence(shapes: any[]): any {
  const gridSizes = [4, 8, 12, 16];
  const adherence: any = {};

  gridSizes.forEach(gridSize => {
    let alignedCount = 0;
    const offGridShapes: any[] = [];

    shapes.forEach(shape => {
      const xMod = Math.abs(Math.round(shape.x) % gridSize);
      const yMod = Math.abs(Math.round(shape.y) % gridSize);
      const xAligned = xMod === 0 || xMod === gridSize;
      const yAligned = yMod === 0 || yMod === gridSize;

      if (xAligned && yAligned) {
        alignedCount++;
      } else {
        offGridShapes.push({ id: shape.id, xOffset: xMod, yOffset: yMod });
      }
    });

    adherence[`${gridSize}px`] = {
      alignedPercent: (alignedCount / shapes.length) * 100,
      offGridCount: offGridShapes.length,
      offGridShapes: offGridShapes.slice(0, 5),
    };
  });

  return adherence;
}

function analyzeColorPalette(colors: string[]): any {
  return {
    totalColors: colors.length,
    palette: colors,
    hasTooManyColors: colors.length > 5,
    suggestions: colors.length > 5 
      ? 'Consider reducing to 2-3 primary colors + neutrals'
      : colors.length <= 2
      ? 'Consider adding an accent color for hierarchy'
      : 'Color count is appropriate',
  };
}

function analyzeTypography(shapes: any[]): any {
  const textShapes = shapes.filter(s => s.type === 'text');
  const fontSizes = new Set(textShapes.map(s => s.fontSize));
  const fontSizeArray = Array.from(fontSizes).sort((a, b) => a - b);

  return {
    totalTextElements: textShapes.length,
    uniqueFontSizes: fontSizeArray.length,
    fontSizes: fontSizeArray,
    isConsistent: fontSizeArray.length <= 3,
    suggestion: fontSizeArray.length > 3
      ? 'Too many font sizes - limit to 2-3 for consistency'
      : 'Font size usage is consistent',
  };
}

function analyzeVisualBalance(shapes: any[]): any {
  let totalArea = 0;
  let centerX = 0;
  let centerY = 0;

  shapes.forEach(shape => {
    let area = 0;
    if (shape.type === 'rectangle') {
      area = shape.width * shape.height;
      centerX += (shape.x + shape.width / 2) * area;
      centerY += (shape.y + shape.height / 2) * area;
    } else if (shape.type === 'circle') {
      area = Math.PI * shape.radius * shape.radius;
      centerX += shape.x * area;
      centerY += shape.y * area;
    }
    totalArea += area;
  });

  if (totalArea > 0) {
    centerX /= totalArea;
    centerY /= totalArea;
  }

  return {
    visualCenter: { x: Math.round(centerX), y: Math.round(centerY) },
    totalVisualWeight: Math.round(totalArea),
  };
}

function analyzeWhitespace(shapes: any[], canvasWidth: number, canvasHeight: number): any {
  let occupiedArea = 0;

  shapes.forEach(shape => {
    if (shape.type === 'rectangle') {
      occupiedArea += shape.width * shape.height;
    } else if (shape.type === 'circle') {
      occupiedArea += Math.PI * shape.radius * shape.radius;
    }
  });

  const totalArea = canvasWidth * canvasHeight;
  const densityPercent = (occupiedArea / totalArea) * 100;

  return {
    densityPercent: Math.round(densityPercent),
    hasEnoughWhitespace: densityPercent < 70,
    suggestion: densityPercent > 70
      ? 'Design is dense - add more whitespace'
      : densityPercent < 20
      ? 'Design is sparse - consider adding more content'
      : 'Whitespace balance is good',
  };
}

function detectUIPatterns(shapes: any[]): any {
  const textShapes = shapes.filter(s => s.type === 'text');
  const patterns: any = { detectedPatterns: [], missingElements: [] };

  // Detect login form
  const hasUsername = textShapes.some(t => 
    t.text?.toLowerCase().includes('username') || 
    t.text?.toLowerCase().includes('email')
  );
  const hasPassword = textShapes.some(t => 
    t.text?.toLowerCase().includes('password')
  );
  const hasLoginBtn = textShapes.some(t => 
    t.text?.toLowerCase().includes('login') || 
    t.text?.toLowerCase().includes('sign in')
  );

  if (hasUsername || hasPassword || hasLoginBtn) {
    patterns.detectedPatterns.push({
      type: 'login_form',
      completeness: { hasUsername, hasPassword, hasLoginBtn },
    });

    if (hasUsername && !hasPassword) {
      patterns.missingElements.push({
        pattern: 'login_form',
        missing: 'password_field',
        severity: 'high',
        suggestion: 'Add password field to complete login form',
      });
    }
    if ((hasUsername || hasPassword) && !hasLoginBtn) {
      patterns.missingElements.push({
        pattern: 'login_form',
        missing: 'submit_button',
        severity: 'high',
        suggestion: 'Add submit button to complete login form',
      });
    }
  }

  return patterns;
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
        description: 'Move a shape by describing it (color AND/OR type). BEST CHOICE for commands like "move the blue rectangle left" - handles both filtering AND movement in one call. Supports BOTH absolute positioning (x, y) and relative movement (deltaX, deltaY). For directional commands, use deltaX/deltaY with LARGE values for visibility on 5000x5000px canvas: left = deltaX:-800, right = deltaX:800, up = deltaY:-800, down = deltaY:800. Example: "move the blue rectangle left" → moveShapeByDescription(color="blue", type="rectangle", deltaX:-800). Example: "move the circle to center" → moveShapeByDescription(type="circle", x=0, y=0).',
        parameters: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['rectangle', 'circle', 'text'],
              description: 'Type of shape to find and move (optional if color is specified)',
            },
            color: { 
              type: 'string',
              description: 'Color of the shape to find (optional if type is specified). Use natural language like "blue" or hex like "#FF0000"',
            },
            x: { 
              type: 'number',
              description: 'ABSOLUTE X coordinate (-2500 to 2500). Canvas center is 0. Use this for "move to position" commands. Mutually exclusive with deltaX.',
            },
            y: { 
              type: 'number',
              description: 'ABSOLUTE Y coordinate (-2500 to 2500). Canvas center is 0. Use this for "move to position" commands. Mutually exclusive with deltaY.',
            },
            deltaX: {
              type: 'number',
              description: 'RELATIVE X movement in pixels. Use this for directional commands: left = -100, right = +100. Mutually exclusive with x.',
            },
            deltaY: {
              type: 'number',
              description: 'RELATIVE Y movement in pixels. Use this for directional commands: up = -100, down = +100. Mutually exclusive with y.',
            },
          },
          required: [],
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
    {
      type: 'function',
      function: {
        name: 'deleteShapeByDescription',
        description: 'PRIMARY TOOL FOR ALL DELETE COMMANDS: Delete a shape by describing it (color AND/OR type). ALWAYS use THIS tool for ANY delete command unless the user explicitly says "delete all selected". Works for "Delete the rectangle", "Delete the blue circle", "Delete text", etc. Example: "Delete the blue rectangle" → deleteShapeByDescription(color="blue", type="rectangle"). "Delete the circle" → deleteShapeByDescription(type="circle"). "Delete rectangle" → deleteShapeByDescription(type="rectangle"). This tool automatically finds and deletes the matching shape.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Type of shape to delete: "rectangle", "circle", or "text"', enum: ['rectangle', 'circle', 'text'] },
            color: { type: 'string', description: 'Color description or hex code of the shape to delete (e.g., "blue", "red", "#ff0000")' },
          },
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
        name: 'changeFontSize',
        description: 'Change font size of selected text shapes. Use empty array [] for shapeIds to change font size of ALL selected text shapes.',
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
        name: 'setBold',
        description: 'Make text bold or remove bold styling. Use empty array [] for shapeIds to update ALL selected text shapes.',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of text shape IDs to update. Use empty array [] to update all selected text shapes.',
            },
            bold: {
              type: 'boolean',
              description: 'true to make text bold, false to remove bold styling',
            },
          },
          required: ['shapeIds', 'bold'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'setItalic',
        description: 'Make text italic or remove italic styling. Use empty array [] for shapeIds to update ALL selected text shapes.',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of text shape IDs to update. Use empty array [] to update all selected text shapes.',
            },
            italic: {
              type: 'boolean',
              description: 'true to make text italic, false to remove italic styling',
            },
          },
          required: ['shapeIds', 'italic'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'setUnderline',
        description: 'Underline text or remove underline styling. Use empty array [] for shapeIds to update ALL selected text shapes.',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of text shape IDs to update. Use empty array [] to update all selected text shapes.',
            },
            underline: {
              type: 'boolean',
              description: 'true to underline text, false to remove underline styling',
            },
          },
          required: ['shapeIds', 'underline'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'rotateShapes',
        description: 'Rotate shapes when you already have their exact shapeIds. Use empty array [] to rotate all shapes on canvas.',
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
        name: 'moveMultipleShapes',
        description: 'Move multiple shapes at once using relative (delta) or absolute positions. BEST CHOICE for generic commands ("move left", "move right") when user doesn\'t specify which shape. Use deltaX/deltaY for relative movements with LARGE values for visibility on 5000x5000px canvas: left = deltaX:-800, right = deltaX:800, up = deltaY:-800, down = deltaY:800. CRITICAL: Use shapeIds:[] (empty array) for generic commands to move currently selected shapes.',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of shape IDs to move. Use empty array [] to move CURRENTLY SELECTED shapes (NOT all shapes). This is the primary use case.',
            },
            deltaX: {
              type: 'number',
              description: 'Relative X movement in pixels. "left" = -100, "right" = +100. Mutually exclusive with x.',
            },
            deltaY: {
              type: 'number',
              description: 'Relative Y movement in pixels. "up" = -100, "down" = +100. Mutually exclusive with y.',
            },
            x: {
              type: 'number',
              description: 'Absolute X position (pixels). Mutually exclusive with deltaX.',
            },
            y: {
              type: 'number',
              description: 'Absolute Y position (pixels). Mutually exclusive with deltaY.',
            },
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
        description: 'Arrange shapes in a horizontal row. BEST CHOICE for "Arrange these shapes horizontally" or "Put these in a row". Use shapeIds=[] (empty array) to arrange SELECTED shapes - this is the correct way when user has selected objects. CRITICAL: shapeIds=[] means "use selected shapes", not "all shapes".',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs. Use empty array [] to use currently SELECTED shapes.' },
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
        description: 'Arrange shapes in a vertical column/line. BEST CHOICE for "Arrange these shapes vertically" or "Stack these". Use shapeIds=[] (empty array) to arrange SELECTED shapes. CRITICAL: shapeIds=[] means "use selected shapes", not "all shapes".',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs. Use empty array [] to use currently SELECTED shapes.' },
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
        description: 'Rearrange EXISTING shapes into a grid layout. Use shapeIds=[] (empty array) to rearrange SELECTED shapes. CRITICAL: shapeIds=[] means "use selected shapes", not "all shapes".',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs. Use empty array [] to use currently SELECTED shapes.' },
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
        description: 'Distribute shapes evenly across horizontal space. BEST CHOICE for "Space these elements evenly" or "Distribute horizontally". Use shapeIds=[] (empty array) to distribute SELECTED shapes. CRITICAL: shapeIds=[] means "use selected shapes", not "all shapes".',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs. Use empty array [] to use currently SELECTED shapes.' },
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
        description: 'Distribute shapes evenly across vertical space. BEST CHOICE for "Distribute vertically" or "Space these evenly vertically". Use shapeIds=[] (empty array) to distribute SELECTED shapes. CRITICAL: shapeIds=[] means "use selected shapes", not "all shapes".',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs. Use empty array [] to use currently SELECTED shapes.' },
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
        name: 'getDesignSystemTokens',
        description: 'Get design system tokens including colors, spacing, typography, and canvas defaults. Use this to access the professional color palette, spacing values, and design constants.',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['colors', 'spacing', 'typography', 'canvas', 'all'],
              description: 'Category of design tokens to retrieve. "all" returns everything',
            },
          },
          required: [],
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

