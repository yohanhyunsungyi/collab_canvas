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

export const AI_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 10,
  REQUEST_TIMEOUT_MS: 10000, // 10 seconds
  MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-nano',
  REASONING_EFFORT: 'low' as const, // Fast responses for canvas operations
  TEXT_VERBOSITY: 'low' as const, // Concise responses
} as const;

