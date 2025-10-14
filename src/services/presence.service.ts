import {
  ref,
  set,
  onValue,
  update,
  onDisconnect,
  type Unsubscribe,
} from 'firebase/database';
import { realtimeDb } from './firebase';
import type { UserPresence } from '../types/presence.types';

// Realtime Database path for user presence
const PRESENCE_PATH = 'presence';

/**
 * Mark user as online in Realtime Database
 * Sets up automatic offline status on disconnect
 */
export const setUserOnline = async (
  userId: string,
  userName: string,
  color: string
): Promise<void> => {
  try {
    const userPresenceRef = ref(realtimeDb, `${PRESENCE_PATH}/${userId}`);
    
    // Set up auto-cleanup on disconnect - mark user as offline
    await onDisconnect(userPresenceRef).update({
      online: false,
      lastSeen: Date.now(),
    });
    
    // Mark user as online
    await set(userPresenceRef, {
      userId,
      userName,
      color,
      online: true,
      lastSeen: Date.now(),
    });
    
    console.log(`[Presence Service] User ${userName} is now online`);
  } catch (error) {
    console.error('[Presence Service] Error setting user online:', error);
    throw error;
  }
};

/**
 * Mark user as offline in Realtime Database
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    const userPresenceRef = ref(realtimeDb, `${PRESENCE_PATH}/${userId}`);
    
    await update(userPresenceRef, {
      online: false,
      lastSeen: Date.now(),
    });
    
    console.log(`[Presence Service] User ${userId} is now offline`);
  } catch (error) {
    console.error('[Presence Service] Error setting user offline:', error);
    throw error;
  }
};

/**
 * Subscribe to all user presence updates
 * Returns unsubscribe function for cleanup
 */
export const subscribeToPresence = (
  callback: (users: UserPresence[]) => void
): Unsubscribe => {
  const presenceRef = ref(realtimeDb, PRESENCE_PATH);
  
  console.log('[Presence Service] Subscribing to presence updates');
  
  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const users: UserPresence[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convert object to array of UserPresence
        Object.values(data).forEach((userData: any) => {
          users.push({
            userId: userData.userId,
            userName: userData.userName,
            color: userData.color,
            online: userData.online,
            lastSeen: userData.lastSeen,
          });
        });
      }
      
      console.log(`[Presence Service] Received ${users.length} user(s), ${users.filter(u => u.online).length} online`);
      callback(users);
    },
    (error) => {
      console.error('[Presence Service] Error subscribing to presence:', error);
    }
  );
  
  return unsubscribe;
};

