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
   * Intelligently select the best model based on command complexity
   * Uses heuristics to avoid hitting token limits
   */
  private selectModelForCommand(prompt: string, shapeCount: number = 0): OpenAIModelName {
    // Heuristic factors:
    // 1. Number of shapes involved (from keywords or shape count)
    // 2. Complexity of operation (multi-step vs single-step)
    // 3. Grid/batch operations
    
    const promptLower = prompt.toLowerCase();
    
    // Extract numbers from the prompt (e.g., "move 500 objects", "create a 20x20 grid")
    const numbers = prompt.match(/\d+/g)?.map(Number) || [];
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    
    // Calculate complexity score
    let complexityScore = 0;
    
    // Large numbers in prompt (e.g., "move 500", "create 100")
    if (maxNumber >= 500) complexityScore += 100;
    else if (maxNumber >= 100) complexityScore += 50;
    else if (maxNumber >= 50) complexityScore += 30;
    else if (maxNumber >= 20) complexityScore += 20;
    else if (maxNumber >= 10) complexityScore += 10;
    
    // Grid operations (NxN multiplies complexity)
    if (promptLower.includes('grid')) {
      if (numbers.length >= 2) {
        const gridSize = numbers[0] * numbers[1];
        complexityScore += gridSize * 2; // Each cell requires a tool call
      } else {
        complexityScore += 20;
      }
    }
    
    // Batch operations
    if (promptLower.match(/\b(all|every|multiple|batch)\b/)) complexityScore += 30;
    
    // Multi-step operations
    if (promptLower.match(/\b(and then|after|arrange|organize|distribute)\b/)) complexityScore += 15;
    
    // Shape count on canvas
    complexityScore += Math.min(shapeCount / 10, 50); // Up to 50 points for shape count
    
    // Select model based on complexity score
    console.log(`[AI Service] Complexity score: ${complexityScore} for prompt: "${prompt.substring(0, 50)}..."`);
    
    if (complexityScore >= 80) {
      console.log(`[AI Service] Selected gpt-4o for high complexity operation`);
      return 'gpt-4o'; // Highest capacity for very complex operations
    } else if (complexityScore >= 40) {
      console.log(`[AI Service] Selected gpt-4o-mini for medium complexity operation`);
      return 'gpt-4o-mini'; // Good balance for medium operations
    } else if (complexityScore >= 20) {
      console.log(`[AI Service] Selected gpt-4-turbo for moderate complexity operation`);
      return 'gpt-4-turbo'; // Balanced for moderate operations
    } else {
      console.log(`[AI Service] Selected gpt-3.5-turbo for simple operation`);
      return 'gpt-3.5-turbo'; // Fast for simple operations
    }
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
          content: `You are a helpful AI assistant for a collaborative canvas application (5000x5000px canvas, center is 2500,2500).
Your job is to help users create, manipulate, and organize shapes on the canvas using the provided tools.

CRITICAL RULES:
1. Prefer the smart manipulation tools (moveShapeByDescription, resizeShapeByDescription) whenever the user describes a shape by type or color. These tools automatically locate shapes and compute new sizes. Example: "Resize the circle to be twice as big" → resizeShapeByDescription(type="circle", scaleMultiplier=2).
2. Only fall back to findShapes* plus low-level tools (moveShape, resizeShape) when you already know the exact shapeId or the user explicitly asks for IDs. When you use low-level tools you MUST provide explicit numeric values (rectangles need width & height, circles need radius, text needs fontSize/text).
3. For "Create a grid of NxN", break into individual createRectangle calls (one per square).
4. For batch operations on many objects (e.g., "move 500 objects"), use the smart manipulation or batch tools to avoid long call lists.
5. Be precise with coordinates and dimensions; default to sensible values when the user omits them.
6. Always respond with the required tool calls to execute the user's request; do not leave commands partially complete.
7. IMPORTANT FOR LAYOUT COMMANDS: For "Arrange these shapes" or "Space these elements", DIRECTLY call arrangeHorizontal/arrangeVertical/distributeHorizontally with shapeIds=[] to arrange ALL shapes. DO NOT call getCanvasState first - the layout tools handle this automatically! Example: "Arrange these shapes in a horizontal row" → arrangeHorizontal(shapeIds=[], startX=50, y=200, spacing=20).
8. FOR ROTATION: ALWAYS use rotateShapes with shapeIds=[] to rotate shapes. Example: "Rotate the text 45 degrees" → rotateShapes(shapeIds=[], rotation=45). Do NOT use rotateShapeByDescription. This works for all shape types and follows toolbar logic.`,
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
