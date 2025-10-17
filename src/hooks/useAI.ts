import { useState, useCallback } from 'react';
import type { CanvasShape } from '../types/canvas.types';
import type { AICommandRequest, AICommandResponse } from '../types/ai.types';
import { aiService } from '../services/ai.service';
// Local parsing removed per requirement; rely solely on provider tool calls
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
  deleteCommand: (commandId: string) => void;
  rerunCommand: (commandId: string) => Promise<AICommandResponse>;
}

/**
 * Custom hook for AI state management
 * Manages AI command execution, loading states, errors, and command history
 */
export const useAI = (
  userId: string,
  shapes: CanvasShape[],
  selectedShapeIds: string[],
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
      // Even if remote AI is unavailable, we still call the service to allow local parsing fallback

      try {
        setLoading(true);
        setError(null);

        // Create command request with shape count for intelligent model selection
        const request: AICommandRequest & { shapeCount: number } = {
          prompt,
          userId,
          shapeCount: shapes.length,
        };

        // Send to AI service only
        const aiResponse = await aiService.sendCommand(request, aiToolsSchema);

        if (!aiResponse.success) {
          // Create friendly, specific error messages for toast
          const remaining = Math.max(0, rateLimitStatus.remaining);
          const resetInSec = Math.ceil((rateLimitStatus.resetIn || 0) / 1000);
          let friendly = aiResponse.message || 'Failed to process command';
          const raw = (aiResponse.error || '').toString().toLowerCase();
          const msg = (aiResponse.message || '').toLowerCase();

          if (raw.includes('openai client not initialized') || msg.includes('not available')) {
            friendly = 'AI is not configured. Set VITE_OPENAI_API_KEY and reload.';
          } else if (raw.includes('rate') || msg.includes('rate')) {
            friendly = `Rate limit exceeded. ${remaining} remaining. Resets in ~${resetInSec}s.`;
          } else if (raw.includes('timeout') || msg.includes('timeout')) {
            friendly = 'AI request timed out (10s). Please try again.';
          } else if (raw.includes('no_tool_calls') || msg.includes('no action')) {
            friendly = 'Could not understand the command. Try: "Create a red circle at 100, 200" or "Move the selected rectangle to center"';
          } else if (raw.includes('401') || raw.includes('unauthorized')) {
            friendly = 'Unauthorized: Check your API key permissions.';
          } else if (raw.includes('429')) {
            friendly = `Too many requests. Please wait ~${resetInSec}s.`;
          }

          setError(friendly);
          addToHistory(prompt, aiResponse.success, aiResponse.message);
          return aiResponse;
        }

        // Execute tool calls if present
        if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
          const context: ExecutionContext = {
            userId,
            shapes,
            selectedShapeIds,
            canvasWidth,
            canvasHeight,
          };

          const executionResults = await aiExecutorService.executeTools(
            aiResponse.toolCalls,
            context
          );

          // Check if any executions failed
          const hasFailures = executionResults.some((r) => !r.success);
          
          let message = aiResponse.message;
          if (hasFailures) {
            const firstFailure = executionResults.find((r) => !r.success);
            const failureMessage = firstFailure?.message || 'Command failed. Try again.';
            message = failureMessage;
            setError(failureMessage);
          }

          // Add to history with execution results
          addToHistory(prompt, !hasFailures, message, executionResults);

          return {
            success: !hasFailures,
            message,
            toolCalls: aiResponse.toolCalls,
          };
        }

        // No tool calls executed at all
        const friendly = 'Could not understand the command. Try a creation or manipulation command.';
        setError(friendly);
        addToHistory(prompt, false, 'No actions taken');
        
        return {
          success: false,
          message: 'No actions taken',
          error: 'NO_TOOL_CALLS',
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process command';
        let friendly = errorMessage;
        const lower = errorMessage.toLowerCase();
        if (lower.includes('timeout')) friendly = 'AI request timed out (10s). Please try again.';
        if (lower.includes('network')) friendly = 'Network error contacting AI. Check your connection.';
        if (lower.includes('unauthorized') || lower.includes('401')) friendly = 'Unauthorized: Check your API key.';
        setError(friendly);
        
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
    [userId, shapes, selectedShapeIds, canvasWidth, canvasHeight, isAvailable]
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

  /**
   * Delete a specific command from history
   */
  const deleteCommand = useCallback((commandId: string): void => {
    setCommandHistory((prev) => prev.filter((cmd) => cmd.id !== commandId));
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
    deleteCommand,
    rerunCommand,
  };
};
