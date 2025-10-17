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

// ==========================================
// PHASE 3: Smart Tool Selection
// ==========================================

/**
 * Tool categories for smart selection
 * Split creation into basic (simple shapes) and complex (pre-built UI components)
 * for better optimization of simple commands like "create a square"
 */
const TOOL_CATEGORIES = {
  basic_creation: ['createRectangle', 'createCircle', 'createText', 'createMultipleShapes'],
  complex_creation: ['createLoginForm', 'createNavigationBar', 'createCardLayout', 'createDashboard'],
  manipulation: ['moveShapeByDescription', 'resizeShapeByDescription', 'rotateShapeByDescription', 'changeColor', 'updateText', 'moveShape', 'resizeShape'],
  deletion: ['deleteShape', 'deleteMultipleShapes', 'clearCanvas'],
  layout: ['arrangeHorizontal', 'arrangeVertical', 'arrangeGrid', 'centerShape', 'distributeHorizontally', 'distributeVertically', 'distributeEvenly'],
  query: ['getCanvasState', 'findShapesByType', 'findShapesByColor', 'findShapesByText', 'getCanvasBounds'],
};

/**
 * Detect which tool categories are needed based on prompt keywords
 * Optimized to differentiate between basic shapes and complex UI components
 */
function detectToolCategories(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const categories: Set<string> = new Set();

  // Basic creation keywords (simple shapes: circle, rectangle, square, text)
  if (/(create|add|make|draw|new)\s+(a\s+)?(circle|rectangle|square|text|shape|oval|box)/i.test(lower)) {
    categories.add('basic_creation');
  }

  // Complex creation keywords (pre-built UI components)
  if (/(login\s*form|sign\s*in\s*form|nav|navigation\s*bar|header|card|pricing\s*card|dashboard|form|menu|sidebar|footer)/i.test(lower)) {
    categories.add('complex_creation');
  }

  // Catch-all creation (if "create/add/make" mentioned but not specific)
  if (/(create|add|make|build|draw|new)/i.test(lower) && 
      !categories.has('basic_creation') && 
      !categories.has('complex_creation')) {
    // Default to basic creation for generic create commands
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

  // If no specific category detected, include basic_creation and manipulation as defaults
  if (categories.size === 0) {
    categories.add('basic_creation');
    categories.add('manipulation');
  }

  return Array.from(categories);
}

// ==========================================
// PHASE 2B: Response Caching
// ==========================================

interface CacheEntry {
  response: AICommandResponse;
  timestamp: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  private getCacheKey(prompt: string, userId: string): string {
    return `${userId}:${prompt.trim().toLowerCase()}`;
  }

  get(prompt: string, userId: string): AICommandResponse | null {
    const key = this.getCacheKey(prompt, userId);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > AI_CONFIG.RESPONSE_CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache HIT] "${prompt}" (age: ${Math.round(age / 1000)}s)`);
    return entry.response;
  }

  set(prompt: string, userId: string, response: AICommandResponse): void {
    const key = this.getCacheKey(prompt, userId);
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Evict oldest entries if cache is too large
    if (this.cache.size > AI_CONFIG.RESPONSE_CACHE_MAX_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// ==========================================
// PHASE 3B: Optimized System Prompt
// ==========================================

const OPTIMIZED_SYSTEM_PROMPT = `You are an AI assistant for a 5000x5000px canvas with centered coordinates (0,0 at center).

COORDINATES: X: -2500 to 2500, Y: -2500 to 2500

COMPLEX LAYOUTS (use these tools directly):
• "login form" → createLoginForm (18 elements: title, fields, social buttons)
• "nav bar"/"header" → createNavigationBar (10+ elements: logo, menu, CTA)
• "card"/"pricing card" → createCardLayout (8 elements: border, title, image, description)
• "dashboard" → createDashboard (21 elements: 4 stat cards with metrics)

GRID LAYOUTS (2-step process):
1. createMultipleShapes with ALL shapes at SAME x,y (e.g., x:0, y:0)
2. arrangeGrid(shapeIds=[], columns=N) - handles positioning

KEY RULES:
1. Use smart tools (moveShapeByDescription, resizeShapeByDescription) when describing shapes by type/color
2. For grids: createMultipleShapes at x:0,y:0, then arrangeGrid
3. For rotation: rotateShapes(shapeIds=[], rotation=degrees)
4. Be precise with coordinates; default to sensible values
5. Always complete commands with tool calls`;

// ==========================================
// Main AI Service Class
// ==========================================

class AIService {
  private client: OpenAI | null = null;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private responseCache = new ResponseCache();

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
  private selectModelForCommand(prompt: string): OpenAIModelName {
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
   * PHASE 3: Filter tools based on prompt
   */
  private filterRelevantTools(
    allTools: OpenAI.Chat.ChatCompletionTool[],
    prompt: string
  ): OpenAI.Chat.ChatCompletionTool[] {
    const categories = detectToolCategories(prompt);
    
    // Get relevant tool names
    const relevantToolNames = new Set<string>();
    categories.forEach(cat => {
      TOOL_CATEGORIES[cat as keyof typeof TOOL_CATEGORIES]?.forEach(tool => {
        relevantToolNames.add(tool);
      });
    });

    // Filter tools
    const filtered = allTools.filter(tool => 
      tool.function && relevantToolNames.has(tool.function.name)
    );

    const reduction = Math.round((1 - filtered.length / allTools.length) * 100);
    console.log(`[Tool Filter] Categories: ${categories.join(', ')} | Tools: ${filtered.length}/${allTools.length} (${reduction}% reduction)`);
    
    return filtered;
  }

  /**
   * PHASE 2A: Send command with streaming support
   */
  async sendCommand(
    request: AICommandRequest & { shapeCount?: number },
    tools: OpenAI.Chat.ChatCompletionTool[],
    options?: {
      onStreamStart?: () => void;
      onStreamProgress?: (toolName: string) => void;
      onStreamEnd?: () => void;
    }
  ): Promise<AICommandResponse> {
    if (!this.client) {
      return {
        success: false,
        message: 'AI service is not available',
        error: 'OpenAI client not initialized',
      };
    }

    // PHASE 2B: Check cache first
    const cachedResponse = this.responseCache.get(request.prompt, request.userId);
    if (cachedResponse) {
      return cachedResponse;
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
      const selectedModel = this.selectModelForCommand(request.prompt);
      
      console.log(`[AI Service] Using model: ${selectedModel}`);

      // PHASE 3: Filter tools based on prompt
      const relevantTools = this.filterRelevantTools(tools, request.prompt);

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: OPTIMIZED_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: request.prompt,
        },
      ];

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout (10s)')),
          AI_CONFIG.REQUEST_TIMEOUT_MS
        )
      );

      // PHASE 1 & 2A: Make API call with streaming, parallel tool calls, and timeout
      const startTime = Date.now();
      
      const stream = await Promise.race([
        this.client.chat.completions.create({
          model: selectedModel,
          messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
          tools: relevantTools,
          tool_choice: 'auto',
          parallel_tool_calls: true, // PHASE 1: Enable parallel execution
          stream: true, // PHASE 2A: Enable streaming
        }),
        timeoutPromise,
      ]);

      // PHASE 2A: Process stream with callbacks
      options?.onStreamStart?.();
      
      let fullResponse = '';
      const toolCalls: Map<number, { id: string; name: string; args: string }> = new Map();
      
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        // Collect content
        if (delta?.content) {
          fullResponse += delta.content;
        }
        
        // Collect tool calls
        if (delta?.tool_calls) {
          delta.tool_calls.forEach(tc => {
            if (tc.index !== undefined) {
              const existing = toolCalls.get(tc.index) || { id: '', name: '', args: '' };
              
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) {
                existing.name = tc.function.name;
                options?.onStreamProgress?.(tc.function.name);
              }
              if (tc.function?.arguments) existing.args += tc.function.arguments;
              
              toolCalls.set(tc.index, existing);
            }
          });
        }
      }

      options?.onStreamEnd?.();
      
      const elapsed = Date.now() - startTime;
      console.log(`[AI Service] Response time: ${elapsed}ms`);

      // Convert tool calls map to array
      const toolCallsArray = Array.from(toolCalls.values())
        .filter(tc => tc.id && tc.name)
        .map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.args,
          },
        }));

      const response: AICommandResponse = {
        success: toolCallsArray.length > 0,
        message: fullResponse || 'Command executed successfully',
        toolCalls: toolCallsArray.length > 0 ? toolCallsArray : undefined,
      };

      if (toolCallsArray.length === 0) {
        response.error = 'NO_TOOL_CALLS';
        response.message = fullResponse || 'No action taken';
      }

      // PHASE 2B: Cache successful responses
      if (response.success) {
        this.responseCache.set(request.prompt, request.userId, response);
      }

      return response;
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
   * (Kept for backward compatibility, but streaming is now preferred)
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

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
    console.log('[Cache] Cleared all cached responses');
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
