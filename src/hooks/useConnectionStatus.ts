import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../services/firebase';

/**
 * Custom hook to monitor Firebase Realtime Database connection status
 * Returns true when connected, false when disconnected
 */
export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Firebase Realtime Database has a special location at .info/connected
    // which is updated every time the client's connection state changes
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    const unsubscribe = onValue(
      connectedRef, 
      (snapshot) => {
        const connected = snapshot.val() === true;
        console.log('[useConnectionStatus] Connection status:', connected ? 'online' : 'offline');
        setIsConnected(connected);
        setIsChecking(false);
      },
      (error) => {
        console.error('[useConnectionStatus] Error monitoring connection:', error);
        setIsConnected(false);
        setIsChecking(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return {
    isConnected,
    isChecking,
  };
};

