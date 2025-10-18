import { useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import type { CanvasShape, Viewport } from '../../types/canvas.types';
import { useAI } from '../../hooks/useAI';
import { Toast } from '../UI/Toast';
import { AIInput } from './AIInput';
import { AICommandHistory } from './AICommandHistory';
import './AIPanel.css';

interface AIPanelProps {
  userId: string;
  shapes: CanvasShape[];
  selectedShapeIds: string[];
  canvasWidth?: number;
  canvasHeight?: number;
  viewport: Viewport;
  containerSize: { width: number; height: number };
  defaultCollapsed?: boolean;
  className?: string;
  onShapesHighlight?: (shapeIds: string[]) => void;
  onSuggestImprovements?: () => void;
}

export interface AIPanelHandle {
  focusInput: () => void;
}

export const AIPanel = forwardRef<AIPanelHandle, AIPanelProps>(({ 
  userId,
  shapes,
  selectedShapeIds,
  canvasWidth,
  canvasHeight,
  viewport,
  containerSize,
  defaultCollapsed = true,
  className = '',
  onShapesHighlight,
  onSuggestImprovements,
}: AIPanelProps, ref) => {
  const { loading, error, commandHistory, sendCommand, clearError, clearHistory, rerunCommand, deleteCommand, isAvailable, rateLimitStatus, streamingStatus } = useAI(
    userId,
    shapes,
    selectedShapeIds,
    canvasWidth,
    canvasHeight,
    viewport,
    containerSize
  );

  const [prompt, setPrompt] = useState('');
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = useMemo(() => !isAvailable || loading || rateLimitStatus.remaining <= 0, [isAvailable, loading, rateLimitStatus.remaining]);

  // Auto-expand history when AI starts thinking
  useEffect(() => {
    if (loading) {
      setCollapsed(false);
    }
  }, [loading]);

  const handleSend = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    
    // Capture current time before sending command
    const commandStartTime = Date.now();
    
    const response = await sendCommand(trimmed);
    setPrompt('');
    
    // Highlight shapes if command was successful
    if (response.success && onShapesHighlight) {
      // Wait a brief moment for Firestore real-time updates to propagate
      setTimeout(() => {
        // Find all shapes that were created or modified within the last 2 seconds
        // (AI commands complete quickly, so this captures AI-modified shapes)
        const recentlyModifiedShapes = shapes.filter(shape => 
          shape.lastModifiedAt >= commandStartTime - 500
        );
        
        const affectedShapeIds = recentlyModifiedShapes.map(shape => shape.id);
        
        if (affectedShapeIds.length > 0) {
          onShapesHighlight(affectedShapeIds);
        }
      }, 200); // Small delay to ensure real-time updates have propagated
    }
  }, [prompt, sendCommand, shapes, onShapesHighlight]);

  const handleSelectPreset = useCallback((command: string) => {
    setPrompt(command);
    // Auto-focus input after selecting preset
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      setCollapsed(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  }));

  return (
    <div className={["ai-panel", className].filter(Boolean).join(' ')}>
      {error && (
        <div className="ai-toast-above-dock">
          <Toast message={error} variant="error" onDismiss={clearError} placement="inline" />
        </div>
      )}
      <div className={`ai-history-wrapper ${collapsed ? 'is-collapsed' : 'is-expanded'}`}>
        <div className={collapsed ? 'ai-history-collapsed' : 'ai-history-expanded'} aria-live="polite">
          <AICommandHistory
            entries={commandHistory}
            loading={loading}
            error={null}
            onDismissError={() => {}}
            onRerun={rerunCommand}
            onDelete={deleteCommand}
            onClearHistory={clearHistory}
            onSelectPreset={handleSelectPreset}
          />
        </div>
        <button
          type="button"
          className="ai-collapse-toggle-overlay"
          aria-label={collapsed ? 'Expand AI history' : 'Collapse AI history'}
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Show history' : 'Hide history'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      <div className="ai-dock">
        <div className="ai-input-container">
          {onSuggestImprovements && (
            <button
              className="ai-suggestions-button-dock"
              onClick={onSuggestImprovements}
              title="Get AI Design Suggestions"
              aria-label="Get AI design suggestions"
              disabled={shapes.length === 0}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/>
                <path d="M19 4L19.5 6L21.5 6.5L19.5 7L19 9L18.5 7L16.5 6.5L18.5 6Z"/>
              </svg>
            </button>
          )}
          <AIInput
            value={prompt}
            onChange={setPrompt}
            onSend={handleSend}
            disabled={disabled}
            ref={inputRef}
          />
        </div>

        <div className="ai-aux">
          {streamingStatus && (
            <div className="ai-streaming-status">
              <span className="ai-streaming-spinner">●</span>
              <span className="ai-streaming-text">{streamingStatus}</span>
            </div>
          )}
          <button
            className="ai-send-button"
            onClick={handleSend}
            disabled={disabled}
            title={!isAvailable ? 'AI unavailable' : rateLimitStatus.remaining <= 0 ? 'Rate limit reached' : 'Send'}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
});

export default AIPanel;

