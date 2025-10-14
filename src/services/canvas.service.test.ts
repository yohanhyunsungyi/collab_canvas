import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  createShape,
  updateShape,
  deleteShape,
  fetchAllShapes,
  subscribeToShapes,
} from './canvas.service';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../types/canvas.types';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    fromMillis: vi.fn((ms: number) => ms),
    now: vi.fn(() => Date.now()),
  },
}));

// Mock firebase config
vi.mock('./firebase', () => ({
  firestore: {},
}));

// Import mocked functions
import {
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  doc,
  collection,
} from 'firebase/firestore';

describe('Canvas Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createShape', () => {
    it('should create a rectangle shape in Firestore', async () => {
      const mockShape: RectangleShape = {
        id: 'test-rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      (doc as Mock).mockReturnValue({ id: mockShape.id });
      (setDoc as Mock).mockResolvedValue(undefined);

      const result = await createShape(mockShape);

      expect(result).toBe(mockShape.id);
      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: mockShape.id,
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
        })
      );
    });

    it('should create a circle shape in Firestore', async () => {
      const mockShape: CircleShape = {
        id: 'test-circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 100,
        color: '#4ECDC4',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      (doc as Mock).mockReturnValue({ id: mockShape.id });
      (setDoc as Mock).mockResolvedValue(undefined);

      const result = await createShape(mockShape);

      expect(result).toBe(mockShape.id);
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: mockShape.id,
          type: 'circle',
          x: 200,
          y: 200,
          radius: 100,
          color: '#4ECDC4',
        })
      );
    });

    it('should create a text shape in Firestore', async () => {
      const mockShape: TextShape = {
        id: 'test-text-1',
        type: 'text',
        x: 300,
        y: 300,
        text: 'Hello World',
        fontSize: 24,
        width: 150,
        height: 30,
        color: '#45B7D1',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      (doc as Mock).mockReturnValue({ id: mockShape.id });
      (setDoc as Mock).mockResolvedValue(undefined);

      const result = await createShape(mockShape);

      expect(result).toBe(mockShape.id);
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: mockShape.id,
          type: 'text',
          text: 'Hello World',
          fontSize: 24,
        })
      );
    });

    it('should throw error if Firestore operation fails', async () => {
      const mockShape: RectangleShape = {
        id: 'test-rect-fail',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#FF6B6B',
        createdBy: 'user-1',
        createdAt: Date.now(),
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };

      (doc as Mock).mockReturnValue({ id: mockShape.id });
      (setDoc as Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(createShape(mockShape)).rejects.toThrow('Failed to create shape');
    });
  });

  describe('updateShape', () => {
    it('should update shape position', async () => {
      const shapeId = 'test-rect-1';
      const updates = {
        x: 200,
        y: 250,
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
      };

      (doc as Mock).mockReturnValue({ id: shapeId });
      (updateDoc as Mock).mockResolvedValue(undefined);

      await updateShape(shapeId, updates);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          x: 200,
          y: 250,
          lastModifiedAt: expect.any(Number),
        })
      );
    });

    it('should update shape size (rectangle)', async () => {
      const shapeId = 'test-rect-1';
      const updates = {
        width: 300,
        height: 200,
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
      };

      (doc as Mock).mockReturnValue({ id: shapeId });
      (updateDoc as Mock).mockResolvedValue(undefined);

      await updateShape(shapeId, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          width: 300,
          height: 200,
          lastModifiedAt: expect.any(Number),
        })
      );
    });

    it('should update shape size (circle)', async () => {
      const shapeId = 'test-circle-1';
      const updates = {
        radius: 150,
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
      };

      (doc as Mock).mockReturnValue({ id: shapeId });
      (updateDoc as Mock).mockResolvedValue(undefined);

      await updateShape(shapeId, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          radius: 150,
          lastModifiedAt: expect.any(Number),
        })
      );
    });

    it('should update shape color', async () => {
      const shapeId = 'test-rect-1';
      const updates = {
        color: '#00FF00',
        lastModifiedBy: 'user-1',
        lastModifiedAt: Date.now(),
      };

      (doc as Mock).mockReturnValue({ id: shapeId });
      (updateDoc as Mock).mockResolvedValue(undefined);

      await updateShape(shapeId, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          color: '#00FF00',
          lastModifiedAt: expect.any(Number),
        })
      );
    });

    it('should throw error if update fails', async () => {
      const shapeId = 'test-rect-1';
      const updates = { x: 200, y: 250 };

      (doc as Mock).mockReturnValue({ id: shapeId });
      (updateDoc as Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(updateShape(shapeId, updates)).rejects.toThrow('Failed to update shape');
    });
  });

  describe('deleteShape', () => {
    it('should delete a shape from Firestore', async () => {
      const shapeId = 'test-rect-1';

      (doc as Mock).mockReturnValue({ id: shapeId });
      (deleteDoc as Mock).mockResolvedValue(undefined);

      await deleteShape(shapeId);

      expect(deleteDoc).toHaveBeenCalledTimes(1);
      expect(deleteDoc).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error if delete fails', async () => {
      const shapeId = 'test-rect-1';

      (doc as Mock).mockReturnValue({ id: shapeId });
      (deleteDoc as Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(deleteShape(shapeId)).rejects.toThrow('Failed to delete shape');
    });
  });

  describe('fetchAllShapes', () => {
    it('should fetch all shapes from Firestore', async () => {
      const mockShapes = [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
          createdBy: 'user-1',
          createdAt: 1000000,
          lastModifiedBy: 'user-1',
          lastModifiedAt: 1000000,
          lockedBy: null,
          lockedAt: null,
        },
        {
          id: 'circle-1',
          type: 'circle',
          x: 300,
          y: 300,
          radius: 100,
          color: '#4ECDC4',
          createdBy: 'user-2',
          createdAt: 2000000,
          lastModifiedBy: 'user-2',
          lastModifiedAt: 2000000,
          lockedBy: null,
          lockedAt: null,
        },
      ];

      const mockDocs = mockShapes.map((data) => ({
        id: data.id,
        data: () => data,
      }));

      (collection as Mock).mockReturnValue({ name: 'canvasObjects' });
      (getDocs as Mock).mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          mockDocs.forEach(callback);
        },
      });

      const result = await fetchAllShapes();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('rect-1');
      expect(result[1].id).toBe('circle-1');
      expect(getDocs).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if no shapes exist', async () => {
      (collection as Mock).mockReturnValue({ name: 'canvasObjects' });
      (getDocs as Mock).mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          // Empty - no documents
        },
      });

      const result = await fetchAllShapes();

      expect(result).toEqual([]);
    });

    it('should throw error if fetch fails', async () => {
      (collection as Mock).mockReturnValue({ name: 'canvasObjects' });
      (getDocs as Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(fetchAllShapes()).rejects.toThrow('Failed to fetch shapes');
    });
  });

  describe('subscribeToShapes', () => {
    it('should subscribe to real-time shape updates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      const mockShapes = [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          color: '#FF6B6B',
          createdBy: 'user-1',
          createdAt: 1000000,
          lastModifiedBy: 'user-1',
          lastModifiedAt: 1000000,
          lockedBy: null,
          lockedAt: null,
        },
      ];

      (collection as Mock).mockReturnValue({ name: 'canvasObjects' });
      (onSnapshot as Mock).mockImplementation((query, callback) => {
        // Simulate snapshot
        const mockSnapshot = {
          forEach: (fn: (doc: any) => void) => {
            mockShapes.forEach((data) => {
              fn({ id: data.id, data: () => data });
            });
          },
        };
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const unsubscribe = subscribeToShapes(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'rect-1', type: 'rectangle' }),
        ])
      );
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle empty snapshots', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      (collection as Mock).mockReturnValue({ name: 'canvasObjects' });
      (onSnapshot as Mock).mockImplementation((query, callback) => {
        const mockSnapshot = {
          forEach: (fn: (doc: any) => void) => {
            // Empty
          },
        };
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      subscribeToShapes(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });
  });
});

