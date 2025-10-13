import type { ToolType } from '../../types/canvas.types';
import { ColorPicker } from '../UI/ColorPicker';
import './CanvasToolbar.css';

interface CanvasToolbarProps {
  currentTool: ToolType;
  currentColor: string;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
}

export const CanvasToolbar = ({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
}: CanvasToolbarProps) => {
  const tools: { type: ToolType; label: string; icon: string }[] = [
    { type: 'select', label: 'Select', icon: '⬆️' },
    { type: 'rectangle', label: 'Rectangle', icon: '⬜' },
    { type: 'circle', label: 'Circle', icon: '⭕' },
    { type: 'text', label: 'Text', icon: '📝' },
  ];

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Tools</span>
        <div className="tool-buttons">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className={`tool-button ${currentTool === tool.type ? 'active' : ''}`}
              onClick={() => onToolChange(tool.type)}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Style</span>
        <ColorPicker selectedColor={currentColor} onColorChange={onColorChange} />
      </div>
    </div>
  );
};

