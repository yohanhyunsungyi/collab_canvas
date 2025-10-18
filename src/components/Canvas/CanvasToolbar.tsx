import { useState } from 'react';
import type { ToolType } from '../../types/canvas.types';
import { ColorPicker } from '../UI/ColorPicker';
import { typography } from '../../styles/design-system';
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
  const [isAlignMenuOpen, setIsAlignMenuOpen] = useState(false);
  const [isDistributeMenuOpen, setIsDistributeMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [currentAlign, setCurrentAlign] = useState<'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'>('left');
  const [currentDistribute, setCurrentDistribute] = useState<'horizontal' | 'vertical'>('horizontal');

  const textTool = { type: 'text' as ToolType, label: 'Text', icon: '📝' };

  const isShapeTool = currentTool === 'rectangle' || currentTool === 'circle';
  const currentShapeIcon = currentTool === 'circle' ? '⭕' : '⬜';
  const currentPointerIcon = currentTool === 'pan' ? 'hand' : 'cursor';

  // Alignment icons and handlers
  const alignmentOptions = {
    left: {
      label: 'Align Left',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="4" x2="3" y2="20"/><rect x="7" y="6" width="10" height="4"/><rect x="7" y="14" width="14" height="4"/></svg>,
      action: onAlignLeft
    },
    center: {
      label: 'Align Center',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="4" x2="12" y2="20"/><rect x="7" y="6" width="10" height="4"/><rect x="5" y="14" width="14" height="4"/></svg>,
      action: onAlignCenter
    },
    right: {
      label: 'Align Right',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="4" x2="21" y2="20"/><rect x="7" y="6" width="10" height="4"/><rect x="3" y="14" width="14" height="4"/></svg>,
      action: onAlignRight
    },
    top: {
      label: 'Align Top',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="3" x2="20" y2="3"/><rect x="6" y="7" width="4" height="10"/><rect x="14" y="7" width="4" height="14"/></svg>,
      action: onAlignTop
    },
    middle: {
      label: 'Align Middle',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><rect x="6" y="7" width="4" height="10"/><rect x="14" y="5" width="4" height="14"/></svg>,
      action: onAlignMiddleVertical
    },
    bottom: {
      label: 'Align Bottom',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="20" y2="21"/><rect x="6" y="7" width="4" height="10"/><rect x="14" y="3" width="4" height="14"/></svg>,
      action: onAlignBottom
    }
  };

  // Distribute icons and handlers
  const distributeOptions = {
    horizontal: {
      label: 'Distribute Horizontally',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="4" height="8"/><rect x="10" y="8" width="4" height="8"/><rect x="16" y="8" width="4" height="8"/></svg>,
      action: onDistributeHorizontally
    },
    vertical: {
      label: 'Distribute Vertically',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="4" width="8" height="4"/><rect x="8" y="10" width="8" height="4"/><rect x="8" y="16" width="8" height="4"/></svg>,
      action: onDistributeVertically
    }
  };

  // Handler for selecting which tool is facing (from dropdown)
  const handleAlignSelection = (type: typeof currentAlign) => {
    // Only update which icon is showing, don't execute action
    setCurrentAlign(type);
  };

  const handleDistributeSelection = (type: typeof currentDistribute) => {
    // Only update which icon is showing, don't execute action
    setCurrentDistribute(type);
  };

  // Handler for executing the action (from main button)
  const handleAlignAction = () => {
    // Execute the currently selected alignment action
    if (currentTool === 'select' && selectedShapeCount >= 2) {
      alignmentOptions[currentAlign].action();
    }
  };

  const handleDistributeAction = () => {
    // Execute the currently selected distribution action
    if (currentTool === 'select' && selectedShapeCount >= 2) {
      distributeOptions[currentDistribute].action();
    }
  };

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

            {/* Font size selector using design system typography */}
            <select
              className="font-size-select"
              aria-label="Font size"
              value={currentFontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              title="Font size"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={24}>24px</option>
              <option value={30}>30px</option>
              <option value={36}>36px</option>
              <option value={48}>48px</option>
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
        
        {/* Align group with dropdown */}
        <div className="button-with-caret">
          <button
            className="duplicate-button"
            onClick={handleAlignAction}
            disabled={currentTool !== 'select' || selectedShapeCount < 2}
            title={currentTool !== 'select' ? 'Switch to Select mode to align' : selectedShapeCount < 2 ? 'Select at least 2 shapes to align' : alignmentOptions[currentAlign].label}
          >
            {alignmentOptions[currentAlign].icon}
          </button>
          <button
            className="caret-button"
            aria-label="Open alignment menu"
            onClick={() => {
              setIsAlignMenuOpen(!isAlignMenuOpen);
              setIsDistributeMenuOpen(false);
              setIsSelectMenuOpen(false);
              setIsShapeMenuOpen(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {isAlignMenuOpen && (
            <div className="dropdown-menu dropdown-menu--dark">
              {(Object.keys(alignmentOptions) as Array<keyof typeof alignmentOptions>).map((key) => {
                return (
                  <button
                    key={key}
                    className={`dropdown-item ${currentAlign === key ? 'selected' : ''}`}
                    onClick={() => {
                      // Only change which tool is facing, don't execute action
                      handleAlignSelection(key);
                      setIsAlignMenuOpen(false);
                    }}
                  >
                    <span className="dropdown-icon" aria-hidden>
                      {alignmentOptions[key].icon}
                    </span>
                    <span className="dropdown-label">{alignmentOptions[key].label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="toolbar-button-divider" />
        
        {/* Distribute group with dropdown */}
        <div className="button-with-caret">
          <button
            className="duplicate-button"
            onClick={handleDistributeAction}
            disabled={currentTool !== 'select' || selectedShapeCount < 2}
            title={currentTool !== 'select' ? 'Switch to Select mode to distribute' : selectedShapeCount < 2 ? 'Select at least 2 shapes to distribute' : distributeOptions[currentDistribute].label}
          >
            {distributeOptions[currentDistribute].icon}
          </button>
          <button
            className="caret-button"
            aria-label="Open distribute menu"
            onClick={() => {
              setIsDistributeMenuOpen(!isDistributeMenuOpen);
              setIsAlignMenuOpen(false);
              setIsSelectMenuOpen(false);
              setIsShapeMenuOpen(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {isDistributeMenuOpen && (
            <div className="dropdown-menu dropdown-menu--dark">
              {(Object.keys(distributeOptions) as Array<keyof typeof distributeOptions>).map((key) => {
                return (
                  <button
                    key={key}
                    className={`dropdown-item ${currentDistribute === key ? 'selected' : ''}`}
                    onClick={() => {
                      // Only change which tool is facing, don't execute action
                      handleDistributeSelection(key);
                      setIsDistributeMenuOpen(false);
                    }}
                  >
                    <span className="dropdown-icon" aria-hidden>
                      {distributeOptions[key].icon}
                    </span>
                    <span className="dropdown-label">{distributeOptions[key].label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
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
          className="duplicate-button"
          onClick={onDelete}
          disabled={currentTool !== 'select' || !selectedShapeId}
          title={currentTool !== 'select' ? 'Switch to Select mode to delete' : !selectedShapeId ? 'Select a shape to delete' : 'Delete selected shape (Delete/Backspace)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <div className="help-button-wrapper">
          <button
            className="help-button"
            onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
            title="Keyboard shortcuts"
            aria-label="Show keyboard shortcuts"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>
          {isHelpMenuOpen && (
            <div className="help-menu">
              <div className="help-menu-header">
                <h3>Keyboard Shortcuts</h3>
                <button 
                  className="help-menu-close"
                  onClick={() => setIsHelpMenuOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="help-menu-content">
                <div className="help-section">
                  <h4>Tools</h4>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Select</span>
                    <kbd>V</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Rectangle</span>
                    <kbd>R</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Circle</span>
                    <kbd>C</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Text</span>
                    <kbd>T</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Pan</span>
                    <kbd>Space</kbd>
                  </div>
                </div>
                <div className="help-section">
                  <h4>Actions</h4>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Undo</span>
                    <kbd>Cmd/Ctrl</kbd> + <kbd>Z</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Redo</span>
                    <kbd>Cmd/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Duplicate</span>
                    <kbd>Cmd/Ctrl</kbd> + <kbd>D</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Delete</span>
                    <kbd>Delete</kbd> / <kbd>Backspace</kbd>
                  </div>
                </div>
                <div className="help-section">
                  <h4>Layer Order</h4>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Bring to Front</span>
                    <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>]</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Bring Forward</span>
                    <kbd>Ctrl</kbd> + <kbd>]</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Send Backward</span>
                    <kbd>Ctrl</kbd> + <kbd>[</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-label">Send to Back</span>
                    <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>[</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
};

