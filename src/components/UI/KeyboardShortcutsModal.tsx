import { useEffect, useCallback } from 'react';
import { KEYBOARD_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import './KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="keyboard-shortcuts-modal-overlay" onClick={onClose}>
      <div className="keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button 
            className="keyboard-shortcuts-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="keyboard-shortcuts-content">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.category} className="keyboard-shortcuts-category">
              <h3>{category.category}</h3>
              <div className="keyboard-shortcuts-list">
                {category.shortcuts.map((shortcut, index) => (
                  <div key={index} className="keyboard-shortcut-item">
                    <kbd className="keyboard-shortcut-key">{shortcut.key}</kbd>
                    <span className="keyboard-shortcut-description">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="keyboard-shortcuts-footer">
          <p>Press <kbd>?</kbd> to toggle this panel</p>
        </div>
      </div>
    </div>
  );
};


