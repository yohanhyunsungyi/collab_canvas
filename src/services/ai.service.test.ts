import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AICommandRequest } from '../types/ai.types';

// Create a mock for the OpenAI client
const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_OPENAI_API_KEY: 'test-api-key',
    VITE_OPENAI_MODEL: 'gpt-5-nano',
  },
});

describe('AI Service', () => {
  let aiService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    
    // Re-import to get fresh instance
    const module = await import('./ai.service');
    aiService = module.aiService;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Service Initialization', () => {
    it('should initialize with API key', () => {
      expect(aiService.isAvailable()).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      const request: AICommandRequest = {
        prompt: 'Create a red circle',
        userId: 'user-test-1',
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Creating a red circle',
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'createCircle',
                    arguments: JSON.stringify({ x: 100, y: 100, radius: 50, color: '#FF0000' }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      });

      const result = await aiService.sendCommand(request, []);
      expect(result.success).toBe(true);
    });

    it('should enforce rate limit (10 requests per minute)', async () => {
      const userId = 'user-rate-limit-test';
      const request: AICommandRequest = {
        prompt: 'Test command',
        userId,
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Success',
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: { name: 'getCanvasState', arguments: '{}' },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      });

      // Send 10 requests (should succeed)
      for (let i = 0; i < 10; i++) {
        const result = await aiService.sendCommand(request, []);
        expect(result.success).toBe(true);
      }

      // 11th request should be rate limited
      const rateLimitedResult = await aiService.sendCommand(request, []);
      expect(rateLimitedResult.success).toBe(false);
      expect(rateLimitedResult.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return rate limit status', () => {
      const userId = 'user-status-test';
      const status = aiService.getRateLimitStatus(userId);

      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetIn');
      expect(status.remaining).toBe(10); // Max for new user
    });

    it('should allow clearing rate limit', () => {
      const userId = 'user-clear-test';
      
      // Use up the rate limit
      aiService['rateLimits'].set(userId, {
        requests: 10,
        lastRequestTime: Date.now(),
      });

      let status = aiService.getRateLimitStatus(userId);
      expect(status.remaining).toBe(0);

      // Clear rate limit
      aiService.clearRateLimit(userId);

      status = aiService.getRateLimitStatus(userId);
      expect(status.remaining).toBe(10);
    });
  });

  describe('Command Execution', () => {
    it('should successfully send a command and return tool calls', async () => {
      const request: AICommandRequest = {
        prompt: 'Create a blue rectangle at position 50, 50',
        userId: 'user-command-test',
      };

      const mockToolCall = {
        id: 'call-123',
        type: 'function' as const,
        function: {
          name: 'createRectangle',
          arguments: JSON.stringify({
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            color: '#0000FF',
          }),
        },
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Creating a blue rectangle',
              tool_calls: [mockToolCall],
            },
            finish_reason: 'tool_calls',
          },
        ],
      });

      const result = await aiService.sendCommand(request, []);

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls![0].function.name).toBe('createRectangle');
    });

    it('should handle commands with no tool calls', async () => {
      const request: AICommandRequest = {
        prompt: 'Tell me about the canvas',
        userId: 'user-no-tools',
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'The canvas is a collaborative drawing space.',
              tool_calls: undefined,
            },
            finish_reason: 'stop',
          },
        ],
      });

      const result = await aiService.sendCommand(request, []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_TOOL_CALLS');
    });

    it('should handle API errors gracefully', async () => {
      const request: AICommandRequest = {
        prompt: 'Create a shape',
        userId: 'user-error-test',
      };

      mockCreate.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const result = await aiService.sendCommand(request, []);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle timeout errors', async () => {
      const request: AICommandRequest = {
        prompt: 'Create a complex layout',
        userId: 'user-timeout-test',
      };

      // Mock a delayed response that exceeds timeout (10 seconds)
      mockCreate.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 11000); // 11 seconds (exceeds 10 second timeout)
          })
      );

      const result = await aiService.sendCommand(request, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }, 15000); // Set test timeout to 15 seconds
  });

  describe('Response Parsing', () => {
    it('should correctly parse tool calls from AI response', async () => {
      const request: AICommandRequest = {
        prompt: 'Create three shapes',
        userId: 'user-parse-test',
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'createRectangle',
                    arguments: JSON.stringify({ x: 0, y: 0, width: 50, height: 50, color: '#FF0000' }),
                  },
                },
                {
                  id: 'call-2',
                  type: 'function',
                  function: {
                    name: 'createCircle',
                    arguments: JSON.stringify({ x: 100, y: 100, radius: 25, color: '#00FF00' }),
                  },
                },
                {
                  id: 'call-3',
                  type: 'function',
                  function: {
                    name: 'createText',
                    arguments: JSON.stringify({ x: 200, y: 200, text: 'Hello', color: '#0000FF' }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      });

      const result = await aiService.sendCommand(request, []);

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(3);
      expect(result.toolCalls![0].function.name).toBe('createRectangle');
      expect(result.toolCalls![1].function.name).toBe('createCircle');
      expect(result.toolCalls![2].function.name).toBe('createText');
    });
  });

  describe('Service Availability', () => {
    it('should report service availability', () => {
      expect(aiService.isAvailable()).toBe(true);
    });
  });
});

