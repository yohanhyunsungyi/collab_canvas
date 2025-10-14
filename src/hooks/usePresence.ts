import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { setUserOnline, setUserOffline, subscribeToPresence } from '../services/presence.service';
import type { UserPresence } from '../types/presence.types';

/**
 * Custom hook for managing user presence (online/offline status)
 * Automatically sets user online on mount and offline on unmount
 * Subscribes to all users' presence status
 */
export const usePresence = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Set user online on mount and subscribe to presence updates
   * Set user offline on unmount
   */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('[usePresence] Setting user online:', user.displayName);

    // Mark user as online
    setUserOnline(user.id, user.displayName, user.color)
      .then(() => {
        console.log('[usePresence] User is now online');
      })
      .catch((error) => {
        console.error('[usePresence] Failed to set user online:', error);
      });

    // Subscribe to all users' presence
    const unsubscribe = subscribeToPresence((updatedUsers) => {
      setUsers(updatedUsers);
      setLoading(false);
    });

    // Cleanup on unmount: mark user as offline
    return () => {
      console.log('[usePresence] Cleaning up presence for user:', user.displayName);
      
      setUserOffline(user.id).catch((error) => {
        console.error('[usePresence] Failed to set user offline on unmount:', error);
      });
      
      unsubscribe();
    };
  }, [user]);

  // Helper to get only online users
  const onlineUsers = users.filter((u) => u.online);

  return {
    users,           // All users (online and offline)
    onlineUsers,     // Only online users
    loading,         // Loading state
  };
};

