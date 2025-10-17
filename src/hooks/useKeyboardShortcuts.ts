import { useEffect, useCallback, useRef } from 'react';
import type { CanvasShape } from '../types/canvas.types';

interface KeyboardShortcutsHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  onArrowMove?: (dx: number, dy: number) => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
}

interface UseKeyboardShortcutsProps {
  enabled?: boolean;
  handlers: KeyboardShortcutsHandlers;
  selectedShapeIds?: string[];
  shapes?: CanvasShape[];
}

/**
 * Detects if the user is on a Mac
 */
const isMac = () => {
  return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Hook for managing keyboard shortcuts
 * Handles Cmd (Mac) vs Ctrl (Windows/Linux) differences
 */
export const useKeyboardShortcuts = ({
  enabled = true,
  handlers,
  selectedShapeIds = [],
  shapes = [],
}: UseKeyboardShortcutsProps) => {
  // Track pressed keys to prevent repeated firing
  const pressedKeys = useRef<Set<string>>(new Set());

  /**
   * Check if the modifier key (Ctrl) is pressed
   * Changed to use Ctrl on all platforms (Mac and Windows)
   */
  const isModifierKey = useCallback((event: KeyboardEvent) => {
    return event.ctrlKey; // Use Ctrl on both Mac and Windows
  }, []);

  /**
   * Handle keydown events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const keyCode = `${event.ctrlKey ? 'ctrl+' : ''}${event.metaKey ? 'meta+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${key}`;

      // Debug: Log bracket keys
      if (key.includes('[') || key.includes(']') || key.includes('{') || key.includes('}')) {
        console.log('[useKeyboardShortcuts] Key pressed:', {
          key: event.key,
          keyLower: key,
          code: event.code,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey
        });
      }

      // Prevent repeated firing of the same key
      if (pressedKeys.current.has(keyCode)) {
        return;
      }
      pressedKeys.current.add(keyCode);

      // Undo: Cmd/Ctrl+Z (without Shift)
      if (isModifierKey(event) && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Undo triggered');
        handlers.onUndo?.();
        return;
      }

      // Redo: Cmd/Ctrl+Shift+Z OR Cmd/Ctrl+Y
      if (
        (isModifierKey(event) && key === 'z' && event.shiftKey) ||
        (isModifierKey(event) && key === 'y')
      ) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Redo triggered');
        handlers.onRedo?.();
        return;
      }

      // Copy: Cmd/Ctrl+C
      if (isModifierKey(event) && key === 'c' && selectedShapeIds.length > 0) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Copy triggered for', selectedShapeIds.length, 'shapes');
        handlers.onCopy?.();
        return;
      }

      // Paste: Cmd/Ctrl+V
      if (isModifierKey(event) && key === 'v') {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Paste triggered');
        handlers.onPaste?.();
        return;
      }

      // Duplicate: Cmd/Ctrl+D
      if (isModifierKey(event) && key === 'd' && selectedShapeIds.length > 0) {
        event.preventDefault();
        handlers.onDuplicate?.();
        return;
      }

      // Bring Forward: Cmd/Ctrl+] (without Shift)
      // Use event.code for reliable detection across Mac/Windows
      if (isModifierKey(event) && event.code === 'BracketRight' && !event.shiftKey && selectedShapeIds.length > 0) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Bring forward triggered');
        handlers.onBringForward?.();
        return;
      }

      // Bring to Front: Cmd/Ctrl+Shift+] (with Shift)
      // Use event.code for reliable detection (BracketRight = ] key, regardless of Shift)
      if (isModifierKey(event) && event.code === 'BracketRight' && event.shiftKey && selectedShapeIds.length > 0) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Bring to front triggered');
        handlers.onBringToFront?.();
        return;
      }

      // Send Backward: Cmd/Ctrl+[ (without Shift)
      // Use event.code for reliable detection across Mac/Windows
      if (isModifierKey(event) && event.code === 'BracketLeft' && !event.shiftKey && selectedShapeIds.length > 0) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Send backward triggered');
        handlers.onSendBackward?.();
        return;
      }

      // Send to Back: Cmd/Ctrl+Shift+[ (with Shift)
      // Use event.code for reliable detection (BracketLeft = [ key, regardless of Shift)
      if (isModifierKey(event) && event.code === 'BracketLeft' && event.shiftKey && selectedShapeIds.length > 0) {
        event.preventDefault();
        console.log('[useKeyboardShortcuts] Send to back triggered');
        handlers.onSendToBack?.();
        return;
      }

      // Select All: Cmd/Ctrl+A
      if (isModifierKey(event) && key === 'a' && shapes.length > 0) {
        event.preventDefault();
        handlers.onSelectAll?.();
        return;
      }

      // Delete: Delete or Backspace
      if ((key === 'delete' || key === 'backspace') && selectedShapeIds.length > 0) {
        event.preventDefault();
        handlers.onDelete?.();
        return;
      }

      // Escape: Clear selection
      if (key === 'escape') {
        event.preventDefault();
        handlers.onEscape?.();
        return;
      }

      // Arrow Keys: Move selected shapes
      if (selectedShapeIds.length > 0 && handlers.onArrowMove) {
        const moveDistance = event.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;

        switch (key) {
          case 'arrowleft':
            dx = -moveDistance;
            break;
          case 'arrowright':
            dx = moveDistance;
            break;
          case 'arrowup':
            dy = -moveDistance;
            break;
          case 'arrowdown':
            dy = moveDistance;
            break;
          default:
            return;
        }

        if (dx !== 0 || dy !== 0) {
          event.preventDefault();
          handlers.onArrowMove(dx, dy);
        }
      }
    },
    [enabled, handlers, isModifierKey, selectedShapeIds, shapes]
  );

  /**
   * Handle keyup events
   */
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const keyCode = `${event.ctrlKey ? 'ctrl+' : ''}${event.metaKey ? 'meta+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${key}`;
    pressedKeys.current.delete(keyCode);
  }, []);

  /**
   * Clear pressed keys when window loses focus
   */
  const handleBlur = useCallback(() => {
    pressedKeys.current.clear();
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, handleKeyDown, handleKeyUp, handleBlur]);

  return {
    isMac: isMac(),
  };
};

/**
 * List of all keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Editing',
    shortcuts: [
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Shift+Z', description: 'Redo' },
      { key: 'Ctrl+Y', description: 'Redo (alternate)' },
      { key: 'Ctrl+C', description: 'Copy' },
      { key: 'Ctrl+V', description: 'Paste' },
      { key: 'Ctrl+D', description: 'Duplicate' },
      { key: 'Delete / Backspace', description: 'Delete selected' },
      { key: 'Ctrl+]', description: 'Bring forward' },
      { key: 'Ctrl+Shift+]', description: 'Bring to front' },
      { key: 'Ctrl+[', description: 'Send backward' },
      { key: 'Ctrl+Shift+[', description: 'Send to back' },
    ],
  },
  {
    category: 'Selection',
    shortcuts: [
      { key: 'Ctrl+A', description: 'Select all' },
      { key: 'Escape', description: 'Clear selection' },
    ],
  },
  {
    category: 'Movement',
    shortcuts: [
      { key: '← ↑ → ↓', description: 'Move 1px' },
      { key: 'Shift + ← ↑ → ↓', description: 'Move 10px' },
    ],
  },
  {
    category: 'Canvas',
    shortcuts: [
      { key: 'Space + Drag', description: 'Pan canvas' },
      { key: 'Mouse Wheel', description: 'Zoom' },
    ],
  },
  {
    category: 'AI',
    shortcuts: [
      { key: 'Ctrl+K', description: 'Focus AI input' },
    ],
  },
  {
    category: 'Help',
    shortcuts: [
      { key: '?', description: 'Show keyboard shortcuts' },
    ],
  },
];

