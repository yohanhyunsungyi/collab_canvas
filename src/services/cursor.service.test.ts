import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateCursorPosition, subscribeToCursors, removeCursor } from './cursor.service';
import * as firebaseDatabase from 'firebase/database';

// Mock Firebase Realtime Database
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(),
  remove: vi.fn(),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn(),
  })),
}));

vi.mock('./firebase', () => ({
  realtimeDb: {},
}));

describe('Cursor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateCursorPosition', () => {
    it('should write cursor position to Realtime DB', async () => {
      const mockRef = vi.fn();
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockOnDisconnect = vi.fn(() => ({
        remove: vi.fn(),
      }));

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.set).mockImplementation(mockSet);
      vi.mocked(firebaseDatabase.onDisconnect).mockImplementation(mockOnDisconnect as any);

      const userId = 'user123';
      const position = {
        x: 100,
        y: 200,
        userName: 'Test User',
        color: '#45B7D1',
      };

      await updateCursorPosition(userId, position);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith({}, 'cursorPositions/user123');
      expect(firebaseDatabase.onDisconnect).toHaveBeenCalledWith(mockRef);
      expect(mockSet).toHaveBeenCalledWith(
        mockRef,
        expect.objectContaining({
          x: 100,
          y: 200,
          userId: 'user123',
          userName: 'Test User',
          color: '#45B7D1',
          lastUpdated: expect.any(Number),
        })
      );
    });

    it('should include lastUpdated timestamp', async () => {
      const mockRef = vi.fn();
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockOnDisconnect = vi.fn(() => ({
        remove: vi.fn(),
      }));

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.set).mockImplementation(mockSet);
      vi.mocked(firebaseDatabase.onDisconnect).mockImplementation(mockOnDisconnect as any);

      const beforeTime = Date.now();
      await updateCursorPosition('user123', {
        x: 100,
        y: 200,
        userName: 'Test',
        color: '#000',
      });
      const afterTime = Date.now();

      const callArgs = mockSet.mock.calls[0][1];
      expect(callArgs.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.lastUpdated).toBeLessThanOrEqual(afterTime);
    });

    it('should handle errors gracefully', async () => {
      const mockRef = vi.fn();
      const mockSet = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockOnDisconnect = vi.fn(() => ({
        remove: vi.fn(),
      }));

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.set).mockImplementation(mockSet);
      vi.mocked(firebaseDatabase.onDisconnect).mockImplementation(mockOnDisconnect as any);

      await expect(
        updateCursorPosition('user123', {
          x: 100,
          y: 200,
          userName: 'Test',
          color: '#000',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('subscribeToCursors', () => {
    it('should subscribe to cursor updates and filter out current user', () => {
      const mockRef = vi.fn();
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        // Simulate snapshot with multiple users
        const snapshot = {
          exists: () => true,
          val: () => ({
            user123: {
              x: 100,
              y: 200,
              userName: 'User 1',
              color: '#45B7D1',
              lastUpdated: Date.now(),
            },
            user456: {
              x: 300,
              y: 400,
              userName: 'User 2',
              color: '#A2D5AB',
              lastUpdated: Date.now(),
            },
          }),
        };
        callback(snapshot as any);
        return mockUnsubscribe;
      });

      const unsubscribe = subscribeToCursors('user123', mockCallback);

      expect(firebaseDatabase.ref).toHaveBeenCalledWith({}, 'cursorPositions');
      expect(firebaseDatabase.onValue).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          user456: expect.objectContaining({
            userId: 'user456',
            x: 300,
            y: 400,
            userName: 'User 2',
            color: '#A2D5AB',
          }),
        })
      );
      expect(mockCallback.mock.calls[0][0]).not.toHaveProperty('user123');
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle empty cursor data', () => {
      const mockRef = vi.fn();
      const mockCallback = vi.fn();

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback) => {
        const snapshot = {
          exists: () => false,
          val: () => null,
        };
        callback(snapshot as any);
        return vi.fn();
      });

      subscribeToCursors('user123', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({});
    });

    it('should handle errors in subscription', () => {
      const mockRef = vi.fn();
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.onValue).mockImplementation((ref, callback, errorCallback) => {
        errorCallback(new Error('Connection failed') as any);
        return vi.fn();
      });

      subscribeToCursors('user123', mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('removeCursor', () => {
    it('should remove cursor from Realtime DB', async () => {
      const mockRef = vi.fn();
      const mockRemove = vi.fn().mockResolvedValue(undefined);

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.remove).mockImplementation(mockRemove);

      await removeCursor('user123');

      expect(firebaseDatabase.ref).toHaveBeenCalledWith({}, 'cursorPositions/user123');
      expect(mockRemove).toHaveBeenCalledWith(mockRef);
    });

    it('should handle removal errors', async () => {
      const mockRef = vi.fn();
      const mockRemove = vi.fn().mockRejectedValue(new Error('Permission denied'));

      vi.mocked(firebaseDatabase.ref).mockReturnValue(mockRef as any);
      vi.mocked(firebaseDatabase.remove).mockImplementation(mockRemove);

      await expect(removeCursor('user123')).rejects.toThrow('Permission denied');
    });
  });
});

