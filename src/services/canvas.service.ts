import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  type Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../types/canvas.types';

// Firestore collection name for canvas objects
const CANVAS_COLLECTION = 'canvasObjects';

/**
 * Firestore document data structure
 * Matches the CanvasShape interface but with Firestore Timestamp support
 */
interface FirestoreShapeData {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  color: string;
  rotation?: number;
  createdBy: string;
  createdAt: number | Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: number | Timestamp;
  lockedBy: string | null;
  lockedAt: number | null;
  // Rectangle specific
  width?: number;
  height?: number;
  // Circle specific
  radius?: number;
  // Text specific
  text?: string;
  fontSize?: number;
}

/**
 * Convert Firestore Timestamp to number (milliseconds)
 */
const timestampToNumber = (timestamp: number | Timestamp): number => {
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  return timestamp.toMillis();
};

/**
 * Convert Firestore document data to CanvasShape
 */
const firestoreToShape = (data: FirestoreShapeData): CanvasShape => {
  const baseShape = {
    id: data.id,
    type: data.type,
    x: data.x,
    y: data.y,
    color: data.color,
    rotation: data.rotation,
    createdBy: data.createdBy,
    createdAt: timestampToNumber(data.createdAt),
    lastModifiedBy: data.lastModifiedBy,
    lastModifiedAt: timestampToNumber(data.lastModifiedAt),
    lockedBy: data.lockedBy,
    lockedAt: data.lockedAt,
  };

  // Type-specific shape construction
  if (data.type === 'rectangle') {
    return {
      ...baseShape,
      type: 'rectangle',
      width: data.width || 0,
      height: data.height || 0,
    } as RectangleShape;
  } else if (data.type === 'circle') {
    return {
      ...baseShape,
      type: 'circle',
      radius: data.radius || 0,
    } as CircleShape;
  } else {
    return {
      ...baseShape,
      type: 'text',
      text: data.text || '',
      fontSize: data.fontSize || 24,
      width: data.width,
      height: data.height,
    } as TextShape;
  }
};

/**
 * Convert CanvasShape to Firestore document data
 */
const shapeToFirestore = (shape: CanvasShape): FirestoreShapeData => {
  const baseData: FirestoreShapeData = {
    id: shape.id,
    type: shape.type,
    x: shape.x,
    y: shape.y,
    color: shape.color,
    rotation: shape.rotation,
    createdBy: shape.createdBy,
    createdAt: shape.createdAt,
    lastModifiedBy: shape.lastModifiedBy,
    lastModifiedAt: shape.lastModifiedAt,
    lockedBy: shape.lockedBy,
    lockedAt: shape.lockedAt,
  };

  // Add type-specific fields
  if (shape.type === 'rectangle') {
    return {
      ...baseData,
      width: shape.width,
      height: shape.height,
    };
  } else if (shape.type === 'circle') {
    return {
      ...baseData,
      radius: shape.radius,
    };
  } else {
    // For text shapes, only include width/height if they exist
    const textData: FirestoreShapeData = {
      ...baseData,
      text: shape.text,
      fontSize: shape.fontSize,
    };
    if (shape.width !== undefined) textData.width = shape.width;
    if (shape.height !== undefined) textData.height = shape.height;
    return textData;
  }
};

/**
 * Create a new shape in Firestore
 * @param shape - The shape to create
 * @returns Promise with the shape ID
 */
export const createShape = async (shape: CanvasShape): Promise<string> => {
  try {
    const shapeRef = doc(firestore, CANVAS_COLLECTION, shape.id);
    const firestoreData = shapeToFirestore(shape);
    
    await setDoc(shapeRef, firestoreData);
    
    console.log(`[Canvas Service] Created shape: ${shape.id} (${shape.type})`);
    return shape.id;
  } catch (error) {
    console.error('[Canvas Service] Error creating shape:', error);
    throw new Error(`Failed to create shape: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing shape in Firestore
 * @param id - The shape ID
 * @param updates - Partial shape data to update
 * @returns Promise that resolves when update is complete
 */
export const updateShape = async (
  id: string,
  updates: Partial<CanvasShape>
): Promise<void> => {
  try {
    const shapeRef = doc(firestore, CANVAS_COLLECTION, id);
    
    // Convert updates to Firestore format
    const firestoreUpdates: Partial<FirestoreShapeData> = {};
    
    // Copy primitive fields
    if (updates.x !== undefined) firestoreUpdates.x = updates.x;
    if (updates.y !== undefined) firestoreUpdates.y = updates.y;
    if (updates.color !== undefined) firestoreUpdates.color = updates.color;
    if (updates.lockedBy !== undefined) firestoreUpdates.lockedBy = updates.lockedBy;
    if (updates.lockedAt !== undefined) firestoreUpdates.lockedAt = updates.lockedAt;
    if (updates.lastModifiedBy !== undefined) firestoreUpdates.lastModifiedBy = updates.lastModifiedBy;
    
    // Update lastModifiedAt to current timestamp
    firestoreUpdates.lastModifiedAt = Date.now();
    
    // Type-specific updates
    if ('width' in updates && updates.width !== undefined) {
      firestoreUpdates.width = updates.width;
    }
    if ('height' in updates && updates.height !== undefined) {
      firestoreUpdates.height = updates.height;
    }
    if ('radius' in updates && updates.radius !== undefined) {
      firestoreUpdates.radius = updates.radius;
    }
    if ('rotation' in updates && updates.rotation !== undefined) {
      firestoreUpdates.rotation = updates.rotation;
    }
    if ('text' in updates && updates.text !== undefined) {
      firestoreUpdates.text = updates.text;
    }
    if ('fontSize' in updates && updates.fontSize !== undefined) {
      firestoreUpdates.fontSize = updates.fontSize;
    }
    
    await updateDoc(shapeRef, firestoreUpdates);
    
    console.log(`[Canvas Service] Updated shape: ${id}`);
  } catch (error) {
    console.error('[Canvas Service] Error updating shape:', error);
    throw new Error(`Failed to update shape: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a shape from Firestore
 * @param id - The shape ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteShape = async (id: string): Promise<void> => {
  try {
    const shapeRef = doc(firestore, CANVAS_COLLECTION, id);
    await deleteDoc(shapeRef);
    
    console.log(`[Canvas Service] Deleted shape: ${id}`);
  } catch (error) {
    console.error('[Canvas Service] Error deleting shape:', error);
    throw new Error(`Failed to delete shape: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch all shapes from Firestore (initial load)
 * @returns Promise with array of all canvas shapes
 */
export const fetchAllShapes = async (): Promise<CanvasShape[]> => {
  try {
    const shapesCollection = collection(firestore, CANVAS_COLLECTION);
    const shapesQuery = query(shapesCollection);
    const querySnapshot = await getDocs(shapesQuery);
    
    const shapes: CanvasShape[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreShapeData;
      shapes.push(firestoreToShape(data));
    });
    
    console.log(`[Canvas Service] Fetched ${shapes.length} shapes from Firestore`);
    return shapes;
  } catch (error) {
    console.error('[Canvas Service] Error fetching shapes:', error);
    throw new Error(`Failed to fetch shapes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Shape change event types for real-time updates
 */
export interface ShapeChangeEvent {
  type: 'added' | 'modified' | 'removed';
  shape: CanvasShape;
}

/**
 * Subscribe to real-time shape changes with granular change detection
 * @param callback - Function to call when shapes change (receives change events)
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToShapes = (
  callback: (changes: ShapeChangeEvent[]) => void
): Unsubscribe => {
  try {
    const shapesCollection = collection(firestore, CANVAS_COLLECTION);
    const shapesQuery = query(shapesCollection);
    
    console.log('[Canvas Service] Subscribing to real-time shape updates');
    
    const unsubscribe = onSnapshot(
      shapesQuery,
      (snapshot) => {
        const changes: ShapeChangeEvent[] = [];
        
        // Process document changes to detect added/modified/removed
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as FirestoreShapeData;
          const shape = firestoreToShape(data);
          
          if (change.type === 'added') {
            changes.push({ type: 'added', shape });
            console.log(`[Canvas Service] Shape added: ${shape.id} (${shape.type})`);
          } else if (change.type === 'modified') {
            changes.push({ type: 'modified', shape });
            console.log(`[Canvas Service] Shape modified: ${shape.id} (${shape.type})`);
          } else if (change.type === 'removed') {
            changes.push({ type: 'removed', shape });
            console.log(`[Canvas Service] Shape removed: ${shape.id}`);
          }
        });
        
        // Only call callback if there are actual changes
        if (changes.length > 0) {
          console.log(`[Canvas Service] Real-time update: ${changes.length} changes`);
          callback(changes);
        }
      },
      (error) => {
        console.error('[Canvas Service] Error in real-time listener:', error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('[Canvas Service] Error setting up real-time listener:', error);
    throw new Error(`Failed to subscribe to shapes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Lock timeout in milliseconds (30 seconds)
 */
const LOCK_TIMEOUT_MS = 30 * 1000;

/**
 * Check if a lock has expired
 * @param lockedAt - Timestamp when lock was acquired
 * @returns true if lock is expired or null
 */
export const isLockExpired = (lockedAt: number | null): boolean => {
  if (lockedAt === null) return true;
  return Date.now() - lockedAt > LOCK_TIMEOUT_MS;
};

/**
 * Attempt to acquire a lock on a shape
 * @param shapeId - The shape ID to lock
 * @param userId - The user ID attempting to acquire the lock
 * @returns Promise that resolves with true if lock acquired, false if already locked
 */
export const acquireLock = async (
  shapeId: string,
  userId: string
): Promise<boolean> => {
  try {
    const shapeRef = doc(firestore, CANVAS_COLLECTION, shapeId);
    
    // First, fetch the current shape to check lock status
    const shapes = await fetchAllShapes();
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape) {
      console.warn(`[Canvas Service] Cannot acquire lock - shape not found: ${shapeId}`);
      return false;
    }
    
    // Check if shape is already locked by someone else
    if (shape.lockedBy && shape.lockedBy !== userId) {
      // Check if the lock has expired
      if (!isLockExpired(shape.lockedAt)) {
        console.log(`[Canvas Service] Lock denied - shape ${shapeId} is locked by ${shape.lockedBy}`);
        return false;
      }
      // Lock has expired, we can take it
      console.log(`[Canvas Service] Lock expired, acquiring lock on shape ${shapeId}`);
    }
    
    // Acquire the lock
    await updateDoc(shapeRef, {
      lockedBy: userId,
      lockedAt: Date.now(),
    });
    
    console.log(`[Canvas Service] Lock acquired on shape ${shapeId} by ${userId}`);
    return true;
  } catch (error) {
    console.error('[Canvas Service] Error acquiring lock:', error);
    return false;
  }
};

/**
 * Release a lock on a shape
 * @param shapeId - The shape ID to unlock
 * @param userId - The user ID releasing the lock (optional, for validation)
 * @returns Promise that resolves when lock is released
 */
export const releaseLock = async (
  shapeId: string,
  userId?: string
): Promise<void> => {
  try {
    const shapeRef = doc(firestore, CANVAS_COLLECTION, shapeId);
    
    // If userId provided, verify this user owns the lock
    if (userId) {
      const shapes = await fetchAllShapes();
      const shape = shapes.find(s => s.id === shapeId);
      
      if (shape && shape.lockedBy !== userId) {
        console.warn(`[Canvas Service] Cannot release lock - shape ${shapeId} is locked by ${shape.lockedBy}, not ${userId}`);
        return;
      }
    }
    
    // Release the lock
    await updateDoc(shapeRef, {
      lockedBy: null,
      lockedAt: null,
    });
    
    console.log(`[Canvas Service] Lock released on shape ${shapeId}`);
  } catch (error) {
    console.error('[Canvas Service] Error releasing lock:', error);
    throw new Error(`Failed to release lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

