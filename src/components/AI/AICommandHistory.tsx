import type { CommandHistoryEntry } from '../../hooks/useAI';
import './AIPanel.css';

interface AICommandHistoryProps {
  entries: CommandHistoryEntry[];
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
  onRerun: (commandId: string) => void;
  onDelete: (commandId: string) => void;
  onClearHistory?: () => void;
  onSelectPreset?: (command: string) => void;
}

const PRESET_COMMANDS = [
  "Create a red circle at position 100, 200",
  "Add a text layer that says 'Hello World'",
  "Make a 200x300 rectangle",
  "Move the blue rectangle to the center",
  "Resize the circle to be twice as big",
  "Rotate the text 45 degrees",
  "Arrange these shapes in a horizontal row",
  "Create a grid of 3x3 squares",
  "Create a grid of 500 squares with 2-pixel spacing",
  "Space these elements evenly",
  "Create a login form with username and password fields",
  "Build a navigation bar with 4 menu items",
  "Make a card layout with title, image, and description",
  "Create a dashboard with 4 cards"
];

export const AICommandHistory = ({ entries, loading, error, onDismissError, onRerun, onDelete, onClearHistory, onSelectPreset }: AICommandHistoryProps) => {
  return (
    <div className="ai-history">
      {/* Error banner */}
      {error && (
        <div className="ai-history-error" role="alert">
          <span>{error}</span>
          <button className="ai-error-dismiss" onClick={onDismissError} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {/* Loading row */}
      {loading && (
        <div className="ai-history-loading">
          <div className="ai-spinner" aria-hidden />
          <span>Thinking…</span>
        </div>
      )}

      {/* Clear history button (only show when there are entries) */}
      {entries.length > 0 && (
        <div className="ai-history-header">
          <button 
            className="ai-clear-history-button" 
            onClick={onClearHistory}
            title="Clear all history"
          >
            🗑️ Clear History
          </button>
        </div>
      )}

      {/* History items or preset commands */}
      <div className="ai-history-scroll">
        {entries.length === 0 && !loading && !error && (
          <div className="ai-preset-commands">
            <div className="ai-preset-header">Try these commands:</div>
            <div className="ai-preset-grid">
              {PRESET_COMMANDS.map((command, index) => (
                <button
                  key={index}
                  className="ai-preset-button"
                  onClick={() => onSelectPreset?.(command)}
                  title={command}
                >
                  {command}
                </button>
              ))}
            </div>
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className={`ai-history-item ${entry.success ? 'success' : 'failure'}`}>
            <div className="ai-history-item-top">
              <div className="ai-history-prompt">{entry.prompt}</div>
              <div className="ai-history-actions">
                <button className="ai-history-rerun" onClick={() => onRerun(entry.id)} title="Rerun this command">↻</button>
                <button className="ai-history-delete" onClick={() => onDelete(entry.id)} title="Delete this command">✕</button>
              </div>
            </div>
            <div className="ai-history-message">{entry.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AICommandHistory;


