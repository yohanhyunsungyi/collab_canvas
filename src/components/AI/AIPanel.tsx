import { useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { CanvasShape } from '../../types/canvas.types';
import { useAI } from '../../hooks/useAI';
import { Button } from '../UI/Button';
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
  defaultCollapsed?: boolean;
  className?: string;
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
  defaultCollapsed = true,
  className = '',
}: AIPanelProps, ref) => {
  const { loading, error, commandHistory, sendCommand, clearError, rerunCommand, deleteCommand, isAvailable, rateLimitStatus } = useAI(
    userId,
    shapes,
    selectedShapeIds,
    canvasWidth,
    canvasHeight
  );

  const [prompt, setPrompt] = useState('');
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = useMemo(() => !isAvailable || loading || rateLimitStatus.remaining <= 0, [isAvailable, loading, rateLimitStatus.remaining]);

  const handleSend = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    await sendCommand(trimmed);
    setPrompt('');
  }, [prompt, sendCommand]);

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
        <AIInput
          value={prompt}
          onChange={setPrompt}
          onSend={handleSend}
          disabled={disabled}
          ref={inputRef}
        />

        <div className="ai-aux">
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={disabled}
            title={!isAvailable ? 'AI unavailable' : rateLimitStatus.remaining <= 0 ? 'Rate limit reached' : 'Send'}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
});

export default AIPanel;

