import {
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  type Unsubscribe,
} from 'firebase/database';
import { realtimeDb } from './firebase';
import type { CursorPosition } from '../types/presence.types';

// Realtime Database path for cursor positions
const CURSOR_PATH = 'cursorPositions';

/**
 * Update current user's cursor position in Realtime Database
 * This will be throttled by the calling component to 60fps
 */
export const updateCursorPosition = async (
  userId: string,
  position: { x: number; y: number; userName: string; color: string }
): Promise<void> => {
  try {
    const cursorRef = ref(realtimeDb, `${CURSOR_PATH}/${userId}`);
    
    // Set up auto-cleanup on disconnect
    onDisconnect(cursorRef).remove();
    
    // Write cursor position to Realtime DB
    await set(cursorRef, {
      x: position.x,
      y: position.y,
      userId,
      userName: position.userName,
      color: position.color,
      lastUpdated: Date.now(),
    });
    
    console.log(`[Cursor Service] Updated cursor for ${position.userName}:`, { x: position.x, y: position.y });
  } catch (error) {
    console.error('[Cursor Service] Error updating cursor position:', error);
    throw error;
  }
};

/**
 * Subscribe to all cursor positions except current user
 * Returns unsubscribe function for cleanup
 */
export const subscribeToCursors = (
  currentUserId: string,
  callback: (cursors: Record<string, CursorPosition>) => void
): Unsubscribe => {
  const cursorsRef = ref(realtimeDb, CURSOR_PATH);
  
  console.log('[Cursor Service] Subscribing to cursor updates');
  
  const unsubscribe = onValue(
    cursorsRef,
    (snapshot) => {
      const cursors: Record<string, CursorPosition> = {};
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Filter out current user's cursor
        Object.entries(data).forEach(([userId, cursorData]: [string, any]) => {
          if (userId !== currentUserId) {
            cursors[userId] = {
              userId,
              x: cursorData.x,
              y: cursorData.y,
              userName: cursorData.userName,
              color: cursorData.color,
              lastUpdated: cursorData.lastUpdated,
            };
          }
        });
      }
      
      console.log(`[Cursor Service] Received ${Object.keys(cursors).length} cursor(s)`);
      callback(cursors);
    },
    (error) => {
      console.error('[Cursor Service] Error subscribing to cursors:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Remove cursor on disconnect or logout
 */
export const removeCursor = async (userId: string): Promise<void> => {
  try {
    const cursorRef = ref(realtimeDb, `${CURSOR_PATH}/${userId}`);
    await remove(cursorRef);
    console.log(`[Cursor Service] Removed cursor for user: ${userId}`);
  } catch (error) {
    console.error('[Cursor Service] Error removing cursor:', error);
    throw error;
  }
};

