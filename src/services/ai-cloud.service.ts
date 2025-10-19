import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';
import type {
  AICommandRequest,
  AICommandResponse,
  RateLimitInfo,
} from '../types/ai.types';
import { AI_CONFIG } from '../types/ai.types';

// Response cache for deduplication
class ResponseCache {
  private cache = new Map<string, { response: AICommandResponse; timestamp: number }>();
  private readonly TTL = AI_CONFIG.RESPONSE_CACHE_TTL_MS;
  private readonly MAX_SIZE = AI_CONFIG.RESPONSE_CACHE_MAX_SIZE;

  get(prompt: string, userId: string): AICommandResponse | null {
    const key = `${userId}:${prompt}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('[Cache] Hit for:', prompt.substring(0, 50));
    return cached.response;
  }

  set(prompt: string, userId: string, response: AICommandResponse): void {
    const key = `${userId}:${prompt}`;
    
    // Enforce max size (LRU-style: delete oldest)
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * AI Service using Firebase Cloud Functions
 * Secure implementation that calls backend functions instead of OpenAI directly
 */
class AICloudService {
  private rateLimits = new Map<string, RateLimitInfo>();
  private responseCache = new ResponseCache();
  private functions = getFunctions(app);

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return true; // Cloud Functions are always available if Firebase is configured
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
   * Send command to Cloud Function for processing
   */
  async sendCommand(
    request: AICommandRequest & { shapeCount?: number },
    options?: {
      onStreamStart?: () => void;
      onStreamProgress?: (toolName: string) => void;
      onStreamEnd?: () => void;
    }
  ): Promise<AICommandResponse> {
    // Check cache first
    const cached = this.responseCache.get(request.prompt, request.userId);
    if (cached) {
      return cached;
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
      options?.onStreamStart?.();

      const processAICommand = httpsCallable(this.functions, 'processAICommand');
      
      const result = await processAICommand({
        prompt: request.prompt,
        shapeCount: request.shapeCount || 0,
      });

      const response = result.data as AICommandResponse;

      options?.onStreamEnd?.();

      // Simulate progress callbacks for tool calls
      if (response.toolCalls && response.toolCalls.length > 0 && options?.onStreamProgress) {
        for (const toolCall of response.toolCalls) {
          options.onStreamProgress(toolCall.function.name);
        }
      }

      // Cache successful responses
      if (response.success) {
        this.responseCache.set(request.prompt, request.userId, response);
      }

      return response;
    } catch (error: any) {
      options?.onStreamEnd?.();
      
      console.error('Cloud Function error:', error);
      
      let errorMessage = 'Failed to process command';
      
      if (error.code === 'unauthenticated') {
        errorMessage = 'Please sign in to use AI features';
      } else if (error.code === 'failed-precondition') {
        errorMessage = 'AI service is not configured. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.code || 'CLOUD_FUNCTION_ERROR',
      };
    }
  }

  /**
   * Get rate limit status for user
   */
  getRateLimitStatus(userId: string): { remaining: number; resetIn: number } {
    const userLimit = this.rateLimits.get(userId);

    if (!userLimit) {
      return {
        remaining: AI_CONFIG.MAX_REQUESTS_PER_MINUTE,
        resetIn: 0,
      };
    }

    const timeSinceLastRequest = Date.now() - userLimit.lastRequestTime;
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
   * Clear rate limit for user (for testing)
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
export const aiCloudService = new AICloudService();

