import { forwardRef, useCallback } from 'react';
import './AIPanel.css';

interface AIInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const AIInput = forwardRef<HTMLInputElement, AIInputProps>(
({ value, onChange, onSend, disabled = false }: AIInputProps, ref) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled) onSend();
      }
    },
    [onSend, disabled]
  );

  return (
    <div className="ai-input">
      <input
        type="text"
        className="ai-input-field"
        placeholder="Ask AI to create or edit..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="AI command input"
        ref={ref}
      />
    </div>
  );
});

export default AIInput;


