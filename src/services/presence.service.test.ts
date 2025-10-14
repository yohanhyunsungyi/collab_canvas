import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setUserOnline, setUserOffline, subscribeToPresence } from './presence.service';
import * as firebaseDatabase from 'firebase/database';

vi.mock('firebase/database');

describe('Presence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setUserOnline', () => {
    it('should write user online status to Realtime DB', async () => {
      const mockRef = {};
      const mockOnDisconnect = {
        update: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.onDisconnect).mockReturnValue(mockOnDisconnect as any);
      vi.mocked(firebaseDatabase.set).mockResolvedValue(undefined);

      await setUserOnline('user123', 'Test User', '#4ECDC4');

      expect(firebaseDatabase.ref).toHaveBeenCalled();
      expect(firebaseDatabase.onDisconnect).toHaveBeenCalledWith(mockRef);
      expect(mockOnDisconnect.update).toHaveBeenCalledWith({
        online: false,
        lastSeen: expect.any(Number),
      });
      expect(firebaseDatabase.set).toHaveBeenCalledWith(mockRef, {
        userId: 'user123',
        userName: 'Test User',
        color: '#4ECDC4',
        online: true,
        lastSeen: expect.any(Number),
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(firebaseDatabase.ref).mockReturnValue({} as any);
      vi.mocked(firebaseDatabase.onDisconnect).mockReturnValue({ update: vi.fn() } as any);
      vi.mocked(firebaseDatabase.set).mockRejectedValue(new Error('Network error'));

      await expect(setUserOnline('user123', 'Test', '#fff')).rejects.toThrow('Network error');
    });
  });

  describe('setUserOffline', () => {
    it('should mark user as offline in Realtime DB', async () => {
      const mockRef = {};
      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.update).mockResolvedValue(undefined);

      await setUserOffline('user123');

      expect(firebaseDatabase.ref).toHaveBeenCalled();
      expect(firebaseDatabase.update).toHaveBeenCalledWith(mockRef, {
        online: false,
        lastSeen: expect.any(Number),
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(firebaseDatabase.ref).mockReturnValue({} as any);
      vi.mocked(firebaseDatabase.update).mockRejectedValue(new Error('Permission denied'));

      await expect(setUserOffline('user123')).rejects.toThrow('Permission denied');
    });
  });

  describe('subscribeToPresence', () => {
    it('should subscribe to presence updates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      const mockRef = {};

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        // Simulate snapshot with user data
        const snapshot = {
          exists: () => true,
          val: () => ({
            user1: {
              userId: 'user1',
              userName: 'Alice',
              color: '#FF6B6B',
              online: true,
              lastSeen: Date.now(),
            },
            user2: {
              userId: 'user2',
              userName: 'Bob',
              color: '#4ECDC4',
              online: false,
              lastSeen: Date.now() - 60000,
            },
          }),
        };

        callback(snapshot as any);
        return mockUnsubscribe;
      });

      const unsubscribe = subscribeToPresence(mockCallback);

      expect(firebaseDatabase.ref).toHaveBeenCalled();
      expect(firebaseDatabase.onValue).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'user1',
          userName: 'Alice',
          online: true,
        }),
        expect.objectContaining({
          userId: 'user2',
          userName: 'Bob',
          online: false,
        }),
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle empty presence data', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firebaseDatabase.ref).mockReturnValue({} as any);
      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        const snapshot = {
          exists: () => false,
          val: () => null,
        };

        callback(snapshot as any);
        return mockUnsubscribe;
      });

      subscribeToPresence(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle errors in subscription', () => {
      const mockCallback = vi.fn();

      vi.mocked(firebaseDatabase.ref).mockReturnValue({} as any);
      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback, errorCallback) => {
        errorCallback(new Error('Connection failed') as any);
        return vi.fn();
      });

      subscribeToPresence(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});

