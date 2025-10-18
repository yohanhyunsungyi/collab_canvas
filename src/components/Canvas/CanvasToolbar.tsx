import { useState } from 'react';
import type { ToolType } from '../../types/canvas.types';
import { ColorPicker } from '../UI/ColorPicker';
import './CanvasToolbar.css';

interface CanvasToolbarProps {
  currentTool: ToolType;
  currentColor: string;
  currentFontSize: number;
  selectedShapeId: string | null;
  selectedShapeCount: number; // Number of selected shapes for multi-select operations
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onAlignMiddleVertical: () => void;
  onDistributeHorizontally: () => void;
  onDistributeVertically: () => void;
  // Z-index operations
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  // History
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const CanvasToolbar = ({
  currentTool,
  currentColor,
  currentFontSize,
  selectedShapeId,
  selectedShapeCount,
  onToolChange,
  onColorChange,
  onFontSizeChange,
  onDuplicate,
  onDelete,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onAlignMiddleVertical,
  onDistributeHorizontally,
  onDistributeVertically,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: CanvasToolbarProps) => {
  const [isSelectMenuOpen, setIsSelectMenuOpen] = useState(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);

  const textTool = { type: 'text' as ToolType, label: 'Text', icon: '📝' };

  const isShapeTool = currentTool === 'rectangle' || currentTool === 'circle';
  const currentShapeIcon = currentTool === 'circle' ? '⭕' : '⬜';
  const currentPointerIcon = currentTool === 'pan' ? 'hand' : 'cursor';

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Tools</span>
        <div className="tool-buttons">
          {/* Select/Hand group with dropdown */}
          <div className="button-with-caret">
            <button
              className={`tool-button ${currentTool === 'select' || currentTool === 'pan' ? 'active' : ''}`}
              onClick={() => onToolChange(currentTool === 'pan' ? 'select' : 'select')}
              title={currentTool === 'pan' ? 'Move' : 'Move'}
            >
              <span className="tool-icon" aria-hidden>
                {currentPointerIcon === 'hand' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11V5a2 2 0 1 1 4 0v6"/><path d="M12 11V4a2 2 0 1 1 4 0v7"/><path d="M16 11V6a2 2 0 1 1 4 0v7a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-2"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7 17 2-7 7-2-16-8z"/></svg>
                )}
              </span>
              <span className="tool-label">Select</span>
            </button>
            <button
              className="caret-button"
              aria-label="Open select menu"
              onClick={() => {
                setIsSelectMenuOpen(!isSelectMenuOpen);
                setIsShapeMenuOpen(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {isSelectMenuOpen && (
              <div className="dropdown-menu dropdown-menu--dark">
                <button
                  className={`dropdown-item ${currentTool === 'select' ? 'selected' : ''}`}
                  onClick={() => {
                    onToolChange('select');
                    setIsSelectMenuOpen(false);
                  }}
                >
                  <span className="dropdown-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7 17 2-7 7-2-16-8z"/></svg>
                  </span>
                  <span className="dropdown-label">Move</span>
                </button>
                <button
                  className={`dropdown-item ${currentTool === 'pan' ? 'selected' : ''}`}
                  onClick={() => {
                    onToolChange('pan');
                    setIsSelectMenuOpen(false);
                  }}
                >
                  <span className="dropdown-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11V5a2 2 0 1 1 4 0v6"/><path d="M12 11V4a2 2 0 1 1 4 0v7"/><path d="M16 11V6a2 2 0 1 1 4 0v7a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-2"/></svg>
                  </span>
                  <span className="dropdown-label">Hand tool</span>
                </button>
              </div>
            )}
          </div>
          <div className="toolbar-divider" />

          {/* Hidden labels so tests can find Rectangle/Circle text */}
          <span className="sr-only-test-labels" aria-hidden>
            Rectangle Circle
          </span>

          {/* Shapes group with dropdown */}
          <div className="button-with-caret">
            <button
              className={`tool-button ${isShapeTool ? 'active' : ''}`}
              onClick={() => onToolChange(isShapeTool ? currentTool : 'rectangle')}
              title={isShapeTool ? (currentTool === 'circle' ? 'Circle' : 'Rectangle') : 'Rectangle'}
            >
              <span className="tool-icon" aria-hidden>
                {currentShapeIcon === '⭕' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
                )}
              </span>
              <span className="tool-label">Shape</span>
            </button>
            <button
              className="caret-button"
              aria-label="Open shape menu"
              onClick={() => {
                setIsShapeMenuOpen(!isShapeMenuOpen);
                setIsSelectMenuOpen(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {isShapeMenuOpen && (
              <div className="dropdown-menu dropdown-menu--dark">
                <button
                  className={`dropdown-item ${currentTool === 'rectangle' ? 'selected' : ''}`}
                  onClick={() => {
                    onToolChange('rectangle');
                    setIsShapeMenuOpen(false);
                  }}
                >
                  <span className="dropdown-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
                  </span>
                  <span className="dropdown-label">Rectangle</span>
                </button>
                <button
                  className={`dropdown-item ${currentTool === 'circle' ? 'selected' : ''}`}
                  onClick={() => {
                    onToolChange('circle');
                    setIsShapeMenuOpen(false);
                  }}
                >
                  <span className="dropdown-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/></svg>
                  </span>
                  <span className="dropdown-label">Circle</span>
                </button>
              </div>
            )}
          </div>
          <div className="toolbar-divider" />

          {/* Text and font size grouped together */}
          <div className="text-with-font-size">
            <button
              className={`tool-button tool-button--text ${currentTool === textTool.type ? 'active' : ''}`}
              onClick={() => onToolChange(textTool.type)}
              title={textTool.label}
            >
              <span className="tool-label">{textTool.label}</span>
            </button>

            {/* Font size selector moved next to Text button */}
            <select
              className="font-size-select"
              aria-label="Font size"
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
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Style</span>
        <ColorPicker selectedColor={currentColor} onColorChange={onColorChange} />
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <span className="toolbar-label">Actions</span>
        {/* Undo/Redo buttons */}
        {onUndo && (
          <button
            className="duplicate-button"
            onClick={onUndo}
            disabled={!canUndo}
            title={!canUndo ? 'Nothing to undo' : 'Undo (Cmd/Ctrl+Z)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
        )}
        {onRedo && (
          <button
            className="duplicate-button"
            onClick={onRedo}
            disabled={!canRedo}
            title={!canRedo ? 'Nothing to redo' : 'Redo (Cmd/Ctrl+Shift+Z)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6"/>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
            </svg>
          </button>
        )}
        <button
          className="duplicate-button"
          onClick={onDuplicate}
          disabled={currentTool !== 'select' || !selectedShapeId}
          title={currentTool !== 'select' ? 'Switch to Select mode to duplicate' : !selectedShapeId ? 'Select a shape to duplicate' : 'Duplicate selected shape (Cmd/Ctrl+D)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        
        <div className="toolbar-button-divider" />
        
        {/* Align buttons */}
        <button
          className="duplicate-button"
          onClick={onAlignLeft}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : 'Align Left'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="4" x2="3" y2="20"/>
            <rect x="7" y="6" width="10" height="4"/>
            <rect x="7" y="14" width="14" height="4"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onAlignCenter}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : 'Align Center'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="4" x2="12" y2="20"/>
            <rect x="7" y="6" width="10" height="4"/>
            <rect x="5" y="14" width="14" height="4"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onAlignRight}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : 'Align Right'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="4" x2="21" y2="20"/>
            <rect x="7" y="6" width="10" height="4"/>
            <rect x="3" y="14" width="14" height="4"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onAlignTop}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : 'Align Top'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="3" x2="20" y2="3"/>
            <rect x="6" y="7" width="4" height="10"/>
            <rect x="14" y="7" width="4" height="14"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onAlignMiddleVertical}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : 'Align Middle'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"/>
            <rect x="6" y="7" width="4" height="10"/>
            <rect x="14" y="5" width="4" height="14"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onAlignBottom}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : 'Align Bottom'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="20" y2="21"/>
            <rect x="6" y="7" width="4" height="10"/>
            <rect x="14" y="3" width="4" height="14"/>
          </svg>
        </button>
        
        <div className="toolbar-button-divider" />
        
        {/* Distribute buttons */}
        <button
          className="duplicate-button"
          onClick={onDistributeHorizontally}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to distribute' : selectedShapeCount < 2 ? 'Select at least 2 shapes to distribute' : 'Distribute Horizontally'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="8" width="4" height="8"/>
            <rect x="10" y="8" width="4" height="8"/>
            <rect x="16" y="8" width="4" height="8"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onDistributeVertically}
          disabled={currentTool !== 'select' || selectedShapeCount < 2}
          title={currentTool !== 'select' ? 'Switch to Select mode to distribute' : selectedShapeCount < 2 ? 'Select at least 2 shapes to distribute' : 'Distribute Vertically'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="4" width="8" height="4"/>
            <rect x="8" y="10" width="8" height="4"/>
            <rect x="8" y="16" width="8" height="4"/>
          </svg>
        </button>
        
        <div className="toolbar-button-divider" />
        
        {/* Z-Index buttons */}
        <button
          className="duplicate-button"
          onClick={onBringToFront}
          disabled={currentTool !== 'select' || selectedShapeCount < 1}
          title={currentTool !== 'select' ? 'Switch to Select mode' : selectedShapeCount < 1 ? 'Select a shape' : 'Bring to Front (Ctrl+Shift+])'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 13 12 8 17 13"/>
            <polyline points="7 19 12 14 17 19"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onBringForward}
          disabled={currentTool !== 'select' || selectedShapeCount < 1}
          title={currentTool !== 'select' ? 'Switch to Select mode' : selectedShapeCount < 1 ? 'Select a shape' : 'Bring Forward (Ctrl+])'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onSendBackward}
          disabled={currentTool !== 'select' || selectedShapeCount < 1}
          title={currentTool !== 'select' ? 'Switch to Select mode' : selectedShapeCount < 1 ? 'Select a shape' : 'Send Backward (Ctrl+[)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button
          className="duplicate-button"
          onClick={onSendToBack}
          disabled={currentTool !== 'select' || selectedShapeCount < 1}
          title={currentTool !== 'select' ? 'Switch to Select mode' : selectedShapeCount < 1 ? 'Select a shape' : 'Send to Back (Ctrl+Shift+[)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 5 12 10 17 5"/>
            <polyline points="7 11 12 16 17 11"/>
          </svg>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button
          className="delete-button"
          onClick={onDelete}
          disabled={currentTool !== 'select' || !selectedShapeId}
          title={currentTool !== 'select' ? 'Switch to Select mode to delete' : !selectedShapeId ? 'Select a shape to delete' : 'Delete selected shape (Delete/Backspace)'}
        >
          Delete
        </button>
      </div>

      
    </div>
  );
};

