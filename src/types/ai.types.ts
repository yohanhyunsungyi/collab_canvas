export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIFunctionCall {
  name: string;
  arguments: string;
}

export interface AIToolCall {
  id: string;
  type: 'function';
  function: AIFunctionCall;
}

export interface AIResponse {
  content: string | null;
  toolCalls: AIToolCall[];
  finishReason: string;
}

export interface AICommandRequest {
  prompt: string;
  userId: string;
}

export interface AICommandResponse {
  success: boolean;
  message: string;
  toolCalls?: AIToolCall[];
  error?: string;
}

export interface RateLimitInfo {
  requests: number;
  lastRequestTime: number;
}

// Model configurations with token limits and use cases
export const OPENAI_MODELS = {
  'gpt-4o': {
    name: 'gpt-4o',
    maxOutputTokens: 16384,
    description: 'Most powerful, best for complex multi-step operations',
    costTier: 3,
  },
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    maxOutputTokens: 16384,
    description: 'Fast and efficient, good for medium complexity',
    costTier: 2,
  },
  'gpt-4-turbo': {
    name: 'gpt-4-turbo',
    maxOutputTokens: 4096,
    description: 'Balanced performance',
    costTier: 2,
  },
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    maxOutputTokens: 4096,
    description: 'Fast, best for simple operations',
    costTier: 1,
  },
} as const;

export type OpenAIModelName = keyof typeof OPENAI_MODELS;

export const AI_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 10,
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds for large operations
  DEFAULT_MODEL: (import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini') as OpenAIModelName,
  REASONING_EFFORT: 'low' as const, // Fast responses for canvas operations
  TEXT_VERBOSITY: 'low' as const, // Concise responses
} as const;

