import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { updateCursorPosition, subscribeToCursors, removeCursor } from '../services/cursor.service';
import type { CursorPosition } from '../types/presence.types';

/**
 * Custom hook for managing multiplayer cursor positions
 * Handles own cursor updates and subscribes to other users' cursors
 */
export const useCursors = () => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const [error, setError] = useState<string | null>(null);
  const lastUpdateTime = useRef<number>(0);
  
  // Throttle interval: 16ms = 60fps
  const THROTTLE_INTERVAL = 16;

  /**
   * Update own cursor position (throttled to 60fps)
   */
  const updateOwnCursor = useCallback(
    (x: number, y: number) => {
      if (!user) return;

      const now = Date.now();
      
      // Throttle updates to 60fps
      if (now - lastUpdateTime.current < THROTTLE_INTERVAL) {
        return;
      }
      
      lastUpdateTime.current = now;

      updateCursorPosition(user.id, {
        x,
        y,
        userName: user.displayName,
        color: user.color,
      }).catch((err) => {
        console.error('[useCursors] Failed to update cursor:', err);
        setError('Failed to sync cursor position');
      });
    },
    [user]
  );

  /**
   * Subscribe to other users' cursors
   */
  useEffect(() => {
    if (!user) return;

    console.log('[useCursors] Setting up cursor subscription for user:', user.id);

    const unsubscribe = subscribeToCursors(user.id, (newCursors) => {
      setCursors(newCursors);
    });

    // Cleanup on unmount
    return () => {
      console.log('[useCursors] Cleaning up cursor subscription');
      unsubscribe();
      
      // Remove own cursor from database
      removeCursor(user.id).catch((error) => {
        console.error('[useCursors] Failed to remove cursor on unmount:', error);
      });
    };
  }, [user]);

  return {
    cursors,
    updateOwnCursor,
    error,
  };
};

