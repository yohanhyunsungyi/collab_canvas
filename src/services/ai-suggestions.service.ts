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
  type: 'alignment' | 'spacing' | 'color' | 'grouping' | 'layout' | 'completeness';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedShapeIds: string[];
  changes: SuggestionChange[];
  newElements?: NewElementSuggestion[];
}

export interface SuggestionChange {
  shapeId: string;
  property: 'x' | 'y' | 'color' | 'width' | 'height' | 'rotation';
  oldValue: string | number;
  newValue: string | number;
}

export interface NewElementSuggestion {
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  text?: string;
  fontSize?: number;
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
  
  // Create AI prompt for design suggestions with advanced design principles
  const systemPrompt = `You are an expert UI/UX designer and design system architect analyzing a canvas design. Use professional design principles to provide actionable improvements.

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
   - **Login Forms** should have:
     * Username/email input field
     * Password input field
     * Submit/login button
     * Optional: "Forgot password" link, "Remember me" checkbox, social login options
   - **Navigation Bars** should have:
     * Logo/brand element
     * Navigation menu items (3-5 items)
     * CTA button (sign up, contact, etc.)
     * Optional: search bar, user profile icon
   - **Cards** should have:
     * Title/heading
     * Content/description
     * Action button or link
     * Optional: image, metadata (date, author)
   - **Forms** should have:
     * Clear labels for each input
     * Input fields with proper types
     * Submit button
     * Optional: validation messages, required field indicators
   - **Dashboards** should have:
     * Clear section headers
     * Data visualization or stats
     * Consistent card/widget layout
     * Optional: filters, date range selector
   
   If you detect a partial UI pattern (e.g., only username field without password), suggest adding the missing elements to complete the pattern.

**SEVERITY GUIDELINES:**
- **High**: Breaks usability or accessibility (poor contrast, overlapping elements, inconsistent spacing that breaks the design)
- **Medium**: Impacts visual quality (near-alignments, inconsistent colors, spacing variations)
- **Low**: Minor polish (small tweaks, optional improvements)

**RESPONSE FORMAT:**
Return ONLY valid JSON with this exact schema:
{
  "suggestions": [
    {
      "type": "alignment" | "spacing" | "color" | "grouping" | "layout" | "completeness",
      "title": "Brief, specific title (e.g., 'Align cards to 16px grid')",
      "description": "Clear explanation with design principle (e.g., 'These cards are 3px off grid. Aligning to 16px grid improves visual consistency and follows 8px spacing system.')",
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
          "width": number (for rectangle),
          "height": number (for rectangle),
          "radius": number (for circle),
          "color": "#hexcolor",
          "text": "Text content" (for text),
          "fontSize": number (for text, default 16)
        }
      ]
    }
  ]
}

Note: Use "newElements" array when suggesting to ADD missing components (e.g., password field for incomplete login form). Use "changes" array for modifying existing elements.

**IMPORTANT:**
- Provide 3-8 suggestions prioritized by impact
- Each suggestion must include specific changes with exact values
- Explain the design principle behind each suggestion
- Focus on high-impact improvements first
- **Detect incomplete UI patterns**: If you see a login form with only username/email, suggest adding password field. If you see only text without labels, suggest adding labels.
- Be specific and actionable
- When suggesting new elements, provide complete specifications (type, position, size, color, text content)`;

  const userPrompt = `Analyze this canvas design and provide professional improvement suggestions.

**Canvas Analysis:**
${JSON.stringify(canvasAnalysis, null, 2)}

**Your Task:**
1. Review the canvas analysis data above
2. Identify the top 3-8 most impactful design improvements
3. For each improvement:
   - Specify which design principle it addresses
   - Provide exact values for changes (positions, colors, sizes)
   - Explain WHY the change improves the design
4. Prioritize high-impact changes first (accessibility, usability, then polish)
5. Return ONLY valid JSON in the specified format

Focus on actionable improvements that will make a measurable difference in design quality.`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 3000,
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

  // Calculate canvas dimensions
  const canvasWidth = analysis.bounds.maxX - analysis.bounds.minX;
  const canvasHeight = analysis.bounds.maxY - analysis.bounds.minY;
  analysis.canvasDimensions = {
    width: canvasWidth,
    height: canvasHeight,
    aspectRatio: canvasWidth / canvasHeight,
  };

  // Detect near-alignments (shapes that are almost aligned)
  const nearAlignments = detectNearAlignments(shapes);
  analysis.nearAlignments = nearAlignments;

  // Detect spacing inconsistencies
  const spacingIssues = detectSpacingIssues(shapes);
  analysis.spacingIssues = spacingIssues;

  // Analyze grid adherence
  const gridAnalysis = analyzeGridAdherence(shapes);
  analysis.gridAdherence = gridAnalysis;

  // Analyze color palette
  const colorAnalysis = analyzeColorPalette(Array.from(analysis.colors));
  analysis.colorAnalysis = colorAnalysis;

  // Analyze typography
  const typographyAnalysis = analyzeTypography(shapes);
  analysis.typography = typographyAnalysis;

  // Analyze visual balance
  const balanceAnalysis = analyzeVisualBalance(shapes);
  analysis.visualBalance = balanceAnalysis;

  // Analyze whitespace
  const whitespaceAnalysis = analyzeWhitespace(shapes, canvasWidth, canvasHeight);
  analysis.whitespace = whitespaceAnalysis;

  // Detect UI patterns
  const patternAnalysis = detectUIPatterns(shapes);
  analysis.uiPatterns = patternAnalysis;

  return analysis;
}

/**
 * Detects common UI patterns and identifies missing elements
 */
function detectUIPatterns(shapes: CanvasShape[]): any {
  const textShapes = shapes.filter(s => s.type === 'text');
  const rectangles = shapes.filter(s => s.type === 'rectangle');
  
  const patterns: any = {
    detectedPatterns: [],
    missingElements: [],
  };

  // Detect login form pattern
  const hasUsernameField = textShapes.some(t => 
    t.text?.toLowerCase().includes('username') || 
    t.text?.toLowerCase().includes('email') ||
    t.text?.toLowerCase().includes('user')
  );
  const hasPasswordField = textShapes.some(t => 
    t.text?.toLowerCase().includes('password') ||
    t.text?.toLowerCase().includes('pass')
  );
  const hasLoginButton = textShapes.some(t => 
    t.text?.toLowerCase().includes('login') || 
    t.text?.toLowerCase().includes('sign in') ||
    t.text?.toLowerCase().includes('submit')
  );

  if (hasUsernameField || hasPasswordField || hasLoginButton) {
    patterns.detectedPatterns.push({
      type: 'login_form',
      completeness: {
        hasUsernameField,
        hasPasswordField,
        hasLoginButton,
      },
    });

    if (hasUsernameField && !hasPasswordField) {
      patterns.missingElements.push({
        pattern: 'login_form',
        missing: 'password_field',
        severity: 'high',
        suggestion: 'Add a password input field to complete the login form',
      });
    }
    if ((hasUsernameField || hasPasswordField) && !hasLoginButton) {
      patterns.missingElements.push({
        pattern: 'login_form',
        missing: 'submit_button',
        severity: 'high',
        suggestion: 'Add a submit/login button to complete the login form',
      });
    }
    if (!hasUsernameField && (hasPasswordField || hasLoginButton)) {
      patterns.missingElements.push({
        pattern: 'login_form',
        missing: 'username_field',
        severity: 'high',
        suggestion: 'Add a username/email input field to complete the login form',
      });
    }
  }

  // Detect navigation bar pattern
  const hasNavItems = textShapes.filter(t => 
    t.text && t.text.length < 20 && t.y < 100 // Short text near top
  ).length >= 3;
  const hasLogo = shapes.some(s => 
    (s.type === 'circle' || s.type === 'rectangle') && s.y < 100
  );
  const hasCTA = textShapes.some(t => 
    t.text?.toLowerCase().includes('sign up') ||
    t.text?.toLowerCase().includes('get started') ||
    t.text?.toLowerCase().includes('contact')
  );

  if (hasNavItems || hasLogo) {
    patterns.detectedPatterns.push({
      type: 'navigation_bar',
      completeness: {
        hasNavItems,
        hasLogo,
        hasCTA,
      },
    });

    if (hasNavItems && !hasLogo) {
      patterns.missingElements.push({
        pattern: 'navigation_bar',
        missing: 'logo',
        severity: 'medium',
        suggestion: 'Add a logo or brand element to the navigation bar',
      });
    }
    if (hasNavItems && !hasCTA) {
      patterns.missingElements.push({
        pattern: 'navigation_bar',
        missing: 'cta_button',
        severity: 'low',
        suggestion: 'Consider adding a CTA button (e.g., "Sign Up") to the navigation',
      });
    }
  }

  // Detect card pattern
  const groupedShapes = groupShapesByProximity(shapes, 100);
  groupedShapes.forEach((group, idx) => {
    const groupTexts = group.filter(s => s.type === 'text');
    const groupRects = group.filter(s => s.type === 'rectangle');
    
    const hasTitle = groupTexts.some(t => (t as any).fontSize >= 18);
    const hasDescription = groupTexts.some(t => (t as any).fontSize < 18);
    const hasButton = groupTexts.some(t => 
      t.text?.toLowerCase().includes('learn more') ||
      t.text?.toLowerCase().includes('read more') ||
      t.text?.toLowerCase().includes('buy') ||
      t.text?.toLowerCase().includes('view')
    );
    const hasContainer = groupRects.length > 0;

    if ((hasTitle || hasDescription) && hasContainer && group.length >= 3) {
      patterns.detectedPatterns.push({
        type: 'card',
        groupIndex: idx,
        completeness: {
          hasTitle,
          hasDescription,
          hasButton,
          hasContainer,
        },
      });

      if (!hasTitle && hasDescription) {
        patterns.missingElements.push({
          pattern: 'card',
          missing: 'title',
          groupIndex: idx,
          severity: 'medium',
          suggestion: 'Add a title/heading to this card for better hierarchy',
        });
      }
      if (hasTitle && !hasButton) {
        patterns.missingElements.push({
          pattern: 'card',
          missing: 'action_button',
          groupIndex: idx,
          severity: 'low',
          suggestion: 'Consider adding an action button or link to this card',
        });
      }
    }
  });

  return patterns;
}

/**
 * Groups shapes by proximity
 */
function groupShapesByProximity(shapes: CanvasShape[], maxDistance: number): CanvasShape[][] {
  const groups: CanvasShape[][] = [];
  const assigned = new Set<string>();

  shapes.forEach(shape => {
    if (assigned.has(shape.id)) return;

    const group: CanvasShape[] = [shape];
    assigned.add(shape.id);

    shapes.forEach(otherShape => {
      if (assigned.has(otherShape.id)) return;

      const distance = Math.sqrt(
        Math.pow(shape.x - otherShape.x, 2) + 
        Math.pow(shape.y - otherShape.y, 2)
      );

      if (distance < maxDistance) {
        group.push(otherShape);
        assigned.add(otherShape.id);
      }
    });

    if (group.length >= 2) {
      groups.push(group);
    }
  });

  return groups;
}

/**
 * Analyzes how well shapes adhere to a grid system
 */
function analyzeGridAdherence(shapes: CanvasShape[]): any {
  const gridSizes = [4, 8, 12, 16];
  const adherence: any = {};

  gridSizes.forEach(gridSize => {
    let alignedCount = 0;
    let offGridShapes: any[] = [];

    shapes.forEach(shape => {
      const xMod = Math.abs(Math.round(shape.x) % gridSize);
      const yMod = Math.abs(Math.round(shape.y) % gridSize);
      const xAligned = xMod === 0 || xMod === gridSize;
      const yAligned = yMod === 0 || yMod === gridSize;

      if (xAligned && yAligned) {
        alignedCount++;
      } else {
        offGridShapes.push({
          id: shape.id,
          xOffset: xMod,
          yOffset: yMod,
        });
      }
    });

    adherence[`${gridSize}px`] = {
      alignedPercent: (alignedCount / shapes.length) * 100,
      offGridCount: offGridShapes.length,
      offGridShapes: offGridShapes.slice(0, 5), // Limit to 5 examples
    };
  });

  return adherence;
}

/**
 * Analyzes color palette for harmony and accessibility
 */
function analyzeColorPalette(colors: string[]): any {
  return {
    totalColors: colors.length,
    palette: colors,
    hasTooManyColors: colors.length > 5,
    suggestions: colors.length > 5 
      ? 'Consider reducing to 2-3 primary colors + neutrals for better harmony'
      : colors.length <= 2
      ? 'Color palette is minimal - consider adding an accent color for hierarchy'
      : 'Color count is appropriate',
  };
}

/**
 * Analyzes typography consistency
 */
function analyzeTypography(shapes: CanvasShape[]): any {
  const textShapes = shapes.filter(s => s.type === 'text');
  const fontSizes = new Set(textShapes.map(s => s.fontSize));
  const fontSizeArray = Array.from(fontSizes).sort((a, b) => a - b);

  return {
    totalTextElements: textShapes.length,
    uniqueFontSizes: fontSizeArray.length,
    fontSizes: fontSizeArray,
    isConsistent: fontSizeArray.length <= 3,
    suggestion: fontSizeArray.length > 3
      ? 'Too many font sizes - limit to 2-3 for visual consistency'
      : 'Font size usage is consistent',
  };
}

/**
 * Analyzes visual balance and weight distribution
 */
function analyzeVisualBalance(shapes: CanvasShape[]): any {
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
    suggestion: 'Visual weight distribution affects balance',
  };
}

/**
 * Analyzes whitespace and density
 */
function analyzeWhitespace(shapes: CanvasShape[], canvasWidth: number, canvasHeight: number): any {
  let occupiedArea = 0;

  shapes.forEach(shape => {
    if (shape.type === 'rectangle') {
      occupiedArea += shape.width * shape.height;
    } else if (shape.type === 'circle') {
      occupiedArea += Math.PI * shape.radius * shape.radius;
    }
  });

  const totalCanvasArea = canvasWidth * canvasHeight;
  const densityPercent = (occupiedArea / totalCanvasArea) * 100;

  return {
    densityPercent: Math.round(densityPercent),
    hasEnoughWhitespace: densityPercent < 70,
    suggestion: densityPercent > 70
      ? 'Design is dense - add more whitespace for breathing room'
      : densityPercent < 20
      ? 'Design is sparse - consider adding more content or reducing canvas size'
      : 'Whitespace balance is good',
  };
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

