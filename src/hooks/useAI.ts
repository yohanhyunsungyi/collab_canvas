import { useState, useCallback } from 'react';
import type { CanvasShape } from '../types/canvas.types';
import type { AICommandRequest, AICommandResponse } from '../types/ai.types';
import { aiService } from '../services/ai.service';
import { aiExecutorService, type ExecutionContext, type ToolExecutionResult } from '../services/ai-executor.service';
import { aiToolsSchema } from '../services/ai-tools.schema';

/**
 * Command history entry
 */
export interface CommandHistoryEntry {
  id: string;
  prompt: string;
  timestamp: number;
  success: boolean;
  message: string;
  results?: ToolExecutionResult[];
}

/**
 * Hook return type
 */
interface UseAIReturn {
  loading: boolean;
  error: string | null;
  commandHistory: CommandHistoryEntry[];
  isAvailable: boolean;
  rateLimitStatus: {
    remaining: number;
    resetIn: number;
  };
  sendCommand: (prompt: string) => Promise<AICommandResponse>;
  clearError: () => void;
  clearHistory: () => void;
  rerunCommand: (commandId: string) => Promise<AICommandResponse>;
}

/**
 * Custom hook for AI state management
 * Manages AI command execution, loading states, errors, and command history
 */
export const useAI = (
  userId: string,
  shapes: CanvasShape[],
  canvasWidth?: number,
  canvasHeight?: number
): UseAIReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);

  // Check if AI service is available
  const isAvailable = aiService.isAvailable();

  // Get rate limit status
  const rateLimitStatus = aiService.getRateLimitStatus(userId);

  /**
   * Send a command to the AI
   */
  const sendCommand = useCallback(
    async (prompt: string): Promise<AICommandResponse> => {
      if (!isAvailable) {
        const response: AICommandResponse = {
          success: false,
          message: 'AI service is not available. Please check your API key configuration.',
          error: 'SERVICE_UNAVAILABLE',
        };
        setError(response.message);
        return response;
      }

      try {
        setLoading(true);
        setError(null);

        // Create command request
        const request: AICommandRequest = {
          prompt,
          userId,
        };

        // Send to AI service
        const aiResponse = await aiService.sendCommand(request, aiToolsSchema);

        if (!aiResponse.success) {
          setError(aiResponse.message);
          
          // Add to history
          addToHistory(prompt, aiResponse.success, aiResponse.message);
          
          return aiResponse;
        }

        // Execute tool calls if present
        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
          const context: ExecutionContext = {
            userId,
            shapes,
            canvasWidth,
            canvasHeight,
          };

          const executionResults = await aiExecutorService.executeTools(
            aiResponse.toolCalls,
            context
          );

          // Check if any executions failed
          const hasFailures = executionResults.some((r) => !r.success);
          const successCount = executionResults.filter((r) => r.success).length;
          
          const message = hasFailures
            ? `Completed ${successCount}/${executionResults.length} operations. Some failed.`
            : aiResponse.message;

          // Add to history with execution results
          addToHistory(prompt, !hasFailures, message, executionResults);

          return {
            success: !hasFailures,
            message,
            toolCalls: aiResponse.toolCalls,
          };
        }

        // No tool calls executed
        addToHistory(prompt, false, 'No actions taken');
        
        return {
          success: false,
          message: 'No actions taken',
          error: 'NO_TOOL_CALLS',
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process command';
        setError(errorMessage);
        
        addToHistory(prompt, false, errorMessage);
        
        return {
          success: false,
          message: errorMessage,
          error: 'EXECUTION_ERROR',
        };
      } finally {
        setLoading(false);
      }
    },
    [userId, shapes, canvasWidth, canvasHeight, isAvailable]
  );

  /**
   * Add command to history
   */
  const addToHistory = (
    prompt: string,
    success: boolean,
    message: string,
    results?: ToolExecutionResult[]
  ): void => {
    const entry: CommandHistoryEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      prompt,
      timestamp: Date.now(),
      success,
      message,
      results,
    };

    setCommandHistory((prev) => {
      // Keep last 50 commands
      const updated = [entry, ...prev];
      return updated.slice(0, 50);
    });
  };

  /**
   * Rerun a command from history
   */
  const rerunCommand = useCallback(
    async (commandId: string): Promise<AICommandResponse> => {
      const command = commandHistory.find((c) => c.id === commandId);
      
      if (!command) {
        const response: AICommandResponse = {
          success: false,
          message: 'Command not found in history',
          error: 'NOT_FOUND',
        };
        setError(response.message);
        return response;
      }

      return sendCommand(command.prompt);
    },
    [commandHistory, sendCommand]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /**
   * Clear command history
   */
  const clearHistory = useCallback((): void => {
    setCommandHistory([]);
  }, []);

  return {
    loading,
    error,
    commandHistory,
    isAvailable,
    rateLimitStatus,
    sendCommand,
    clearError,
    clearHistory,
    rerunCommand,
  };
};

