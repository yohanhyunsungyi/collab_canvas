import type { ToolType } from '../../types/canvas.types';
import { ColorPicker } from '../UI/ColorPicker';
import './CanvasToolbar.css';

interface CanvasToolbarProps {
  currentTool: ToolType;
  currentColor: string;
  currentFontSize: number;
  selectedShapeId: string | null;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onDelete: () => void;
}

export const CanvasToolbar = ({
  currentTool,
  currentColor,
  currentFontSize,
  selectedShapeId,
  onToolChange,
  onColorChange,
  onFontSizeChange,
  onDelete,
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
        <span className="toolbar-label">Actions</span>
        <button
          className="delete-button"
          onClick={onDelete}
          disabled={currentTool !== 'select' || !selectedShapeId}
          title={currentTool !== 'select' ? 'Switch to Select mode to delete' : !selectedShapeId ? 'Select a shape to delete' : 'Delete selected shape (Delete/Backspace)'}
        >
          🗑️ Delete
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Style</span>
        <ColorPicker selectedColor={currentColor} onColorChange={onColorChange} />
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Font Size</span>
        <select
          className="font-size-select"
          value={currentFontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
        >
          <option value={12}>12px</option>
          <option value={16}>16px</option>
          <option value={20}>20px</option>
          <option value={24}>24px</option>
          <option value={32}>32px</option>
          <option value={48}>48px</option>
          <option value={64}>64px</option>
          <option value={72}>72px</option>
          <option value={96}>96px</option>
          <option value={128}>128px</option>
        </select>
      </div>
    </div>
  );
};

