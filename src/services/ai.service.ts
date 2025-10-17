import OpenAI from 'openai';
import type {
  AIMessage,
  AIResponse,
  AICommandRequest,
  AICommandResponse,
  RateLimitInfo,
  OpenAIModelName,
} from '../types/ai.types';
import { AI_CONFIG, OPENAI_MODELS } from '../types/ai.types';
// Local fallback removed per requirement; rely solely on provider

class AIService {
  private client: OpenAI | null = null;
  private rateLimits: Map<string, RateLimitInfo> = new Map();

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize OpenAI client with API key from environment
   */
  private initializeClient(): void {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for client-side usage
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Select model for command
   * Always use gpt-4o-mini for reliability and consistency
   */
  private selectModelForCommand(prompt: string, shapeCount: number = 0): OpenAIModelName {
    console.log(`[AI Service] Using gpt-4o-mini for prompt: "${prompt.substring(0, 50)}..."`);
    return 'gpt-4o-mini';
  }

  /**
   * Check rate limit for user
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId);

    if (!userLimit) {
      this.rateLimits.set(userId, { requests: 1, lastRequestTime: now });
      return true;
    }

    const timeSinceLastRequest = now - userLimit.lastRequestTime;
    const oneMinute = 60 * 1000;

    // Reset counter if more than a minute has passed
    if (timeSinceLastRequest >= oneMinute) {
      this.rateLimits.set(userId, { requests: 1, lastRequestTime: now });
      return true;
    }

    // Check if under limit
    if (userLimit.requests >= AI_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    // Increment counter
    this.rateLimits.set(userId, {
      requests: userLimit.requests + 1,
      lastRequestTime: userLimit.lastRequestTime,
    });

    return true;
  }

  /**
   * Send a command to the AI with function calling support
   */
  async sendCommand(
    request: AICommandRequest & { shapeCount?: number },
    tools: OpenAI.Chat.ChatCompletionTool[]
  ): Promise<AICommandResponse> {
    if (!this.client) {
      return {
        success: false,
        message: 'AI service is not available',
        error: 'OpenAI client not initialized',
      };
    }

    // Check rate limit
    if (!this.checkRateLimit(request.userId)) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please wait a moment.',
        error: 'RATE_LIMIT_EXCEEDED',
      };
    }

    try {
      // Intelligently select model based on command complexity
      const selectedModel = this.selectModelForCommand(request.prompt, request.shapeCount || 0);
      const modelConfig = OPENAI_MODELS[selectedModel];
      
      console.log(`[AI Service] Using model: ${selectedModel} (max tokens: ${modelConfig.maxOutputTokens})`);

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a collaborative canvas application with a 5000x5000px canvas.

COORDINATE SYSTEM:
- Canvas uses a centered coordinate system where (0, 0) is at the CENTER
- X coordinates range from -2500 (left edge) to 2500 (right edge)
- Y coordinates range from -2500 (top edge) to 2500 (bottom edge)
- Center of canvas: (0, 0)
- Top-left corner: (-2500, -2500)
- Bottom-right corner: (2500, 2500)

Your job is to help users create, manipulate, and organize shapes on the canvas using the provided tools.

COMPLEX LAYOUT COMMANDS:
- For "create a login form", "make a login box", "build a sign in form" → Use createLoginForm() tool directly. This creates a modern Copy UI style login form with 18 elements including title, subtitle, email/password fields, sign in button, and 3 social login buttons with Google, Apple, Facebook logos.
- For "create a navigation bar", "build a nav bar", "make a navbar", "create a header" → Use createNavigationBar() tool directly. This creates a professional navbar with logo circle, menu items (Features, How it works, Use cases, Pricing, FAQ), dropdown arrows, and CTA button.
- For "create a card", "make a card layout", "build a pricing card", "create a feature card" → Use createCardLayout() tool directly. This creates a professional pricing/feature card with 8 elements including border, title, price, image placeholder, description, and action button.

CRITICAL RULES:
1. Prefer the smart manipulation tools (moveShapeByDescription, resizeShapeByDescription) whenever the user describes a shape by type or color. These tools automatically locate shapes and compute new sizes. Example: "Resize the circle to be twice as big" → resizeShapeByDescription(type="circle", scaleMultiplier=2).
2. Only fall back to findShapes* plus low-level tools (moveShape, resizeShape) when you already know the exact shapeId or the user explicitly asks for IDs. When you use low-level tools you MUST provide explicit numeric values (rectangles need width & height, circles need radius, text needs fontSize/text).
3. FOR GRID LAYOUTS: For ANY of these commands: "Create a grid of NxN", "Create NxN grid", "Create N blue squares arranged in NxN grid", "Create a clean NxN grid":
   - Step 1: Use clearCanvas(confirm=true) ONLY if user explicitly says "clear" or "clean"
   - Step 2: Use createMultipleShapes to create all N*N shapes. IMPORTANT: Use the SAME x,y position (like x=0, y=0) for ALL shapes - do NOT pre-calculate grid positions!
   - Step 3: Use arrangeGrid(shapeIds=[], columns=N, spacingX=120, spacingY=120) to arrange them
   - Example 1: "Create a grid of 3x3 squares" → 
     1) createMultipleShapes(shapes=[{type:"rectangle", x:0, y:0, width:100, height:100, color:"#4A90E2"}, ... repeat 9 times with SAME x:0, y:0])
     2) arrangeGrid(shapeIds=[], columns=3, spacingX=120, spacingY=120)
   - Example 2: "Clear the canvas and create a clean 3x3 grid" → 
     1) clearCanvas(confirm=true)
     2) createMultipleShapes(shapes=[{type:"rectangle", x:0, y:0, width:100, height:100, color:"#4A90E2"}, ... repeat 9 times with SAME x:0, y:0])
     3) arrangeGrid(shapeIds=[], columns=3, spacingX=120, spacingY=120)
   - CRITICAL: In createMultipleShapes, ALL shapes must have the SAME x and y coordinates (e.g., x:0, y:0). The arrangeGrid tool will handle the final positioning!
4. FOR VERTICAL LINE: "Create N shapes in a vertical line" → TWO SEQUENTIAL CALLS REQUIRED:
   - Step 1: Use createMultipleShapes to create N shapes ALL at x:0, y:0 (SAME coordinates)
   - Step 2: Use arrangeVertical(shapeIds=[], x=100, startY=100) to arrange them vertically
   - Example: "Create 5 circles in a vertical line" →
     1) createMultipleShapes(shapes=[{type:"circle", x:0, y:0}, ... repeat 5 times with SAME x:0, y:0])
     2) arrangeVertical(shapeIds=[], x=100, startY=100)
5. FOR HORIZONTAL ARRANGEMENT: "Arrange these shapes in a horizontal row" → arrangeHorizontal(shapeIds=[], startX=-400, y=0, spacing=150). Use shapeIds=[] to arrange ALL existing shapes.
6. FOR EVEN SPACING: "Space these elements evenly" → distributeEvenly(shapeIds=[], direction="horizontal" or "vertical" based on context). Use shapeIds=[] to distribute ALL existing shapes.
7. For batch operations on many objects (e.g., "move 500 objects"), use the smart manipulation or batch tools to avoid long call lists.
8. Be precise with coordinates and dimensions; default to sensible values when the user omits them. Remember the coordinate system is centered at (0,0).
9. Always respond with the required tool calls to execute the user's request; do not leave commands partially complete.
10. FOR ROTATION: ALWAYS use rotateShapes with shapeIds=[] to rotate shapes. Example: "Rotate the text 45 degrees" → rotateShapes(shapeIds=[], rotation=45). Do NOT use rotateShapeByDescription. This works for all shape types and follows toolbar logic.`,
        },
        {
          role: 'user',
          content: request.prompt,
        },
      ];

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          AI_CONFIG.REQUEST_TIMEOUT_MS
        )
      );

      // Make API call with timeout and dynamic model selection
      const completion = await Promise.race([
        this.client.chat.completions.create({
          model: selectedModel,
          messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
          tools,
          tool_choice: 'auto',
          max_completion_tokens: Math.min(modelConfig.maxOutputTokens, 16000),  // Use model's max capacity
        }),
        timeoutPromise,
      ]);

      const response = this.parseResponse(completion);

      if (response.toolCalls.length > 0) {
        return {
          success: true,
          message: response.content || 'Command executed successfully',
          toolCalls: response.toolCalls,
        };
      }

      return {
        success: false,
        message: response.content || 'No action taken',
        error: 'NO_TOOL_CALLS',
      };
    } catch (error) {
      console.error('AI service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to process command',
        error: errorMessage,
      };
    }
  }

  /**
   * Parse OpenAI response into structured format
   */
  private parseResponse(completion: OpenAI.Chat.ChatCompletion): AIResponse {
    const choice = completion.choices[0];
    const message = choice.message;

    return {
      content: message.content,
      toolCalls: message.tool_calls
        ? message.tool_calls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }))
        : [],
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Get rate limit status for user
   */
  getRateLimitStatus(userId: string): {
    remaining: number;
    resetIn: number;
  } {
    const userLimit = this.rateLimits.get(userId);
    
    if (!userLimit) {
      return {
        remaining: AI_CONFIG.MAX_REQUESTS_PER_MINUTE,
        resetIn: 0,
      };
    }

    const now = Date.now();
    const timeSinceLastRequest = now - userLimit.lastRequestTime;
    const oneMinute = 60 * 1000;

    if (timeSinceLastRequest >= oneMinute) {
      return {
        remaining: AI_CONFIG.MAX_REQUESTS_PER_MINUTE,
        resetIn: 0,
      };
    }

    return {
      remaining: Math.max(0, AI_CONFIG.MAX_REQUESTS_PER_MINUTE - userLimit.requests),
      resetIn: oneMinute - timeSinceLastRequest,
    };
  }

  /**
   * Clear rate limit for user (for testing or admin purposes)
   */
  clearRateLimit(userId: string): void {
    this.rateLimits.delete(userId);
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
