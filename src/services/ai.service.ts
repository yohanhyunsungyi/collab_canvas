import OpenAI from 'openai';
import type {
  AIMessage,
  AIResponse,
  AICommandRequest,
  AICommandResponse,
  RateLimitInfo,
} from '../types/ai.types';
import { AI_CONFIG } from '../types/ai.types';

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
    request: AICommandRequest,
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
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a collaborative canvas application. 
Your role is to help users create, manipulate, and organize shapes on a canvas.
Be precise with coordinates and dimensions. The canvas has a coordinate system where (0,0) is the top-left corner.
Always use the provided tools to execute user commands.`,
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

      // Make API call with timeout
      const completion = await Promise.race([
        this.client.chat.completions.create({
          model: AI_CONFIG.MODEL,
          messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
          tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000,
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

