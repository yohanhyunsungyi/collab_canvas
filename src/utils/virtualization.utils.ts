/**
 * Virtualization utilities for optimizing canvas rendering with large numbers of objects
 * 
 * Features:
 * - Viewport-based culling: only render shapes visible in viewport
 * - Object pooling: reuse Konva nodes for better memory management
 * - Spatial indexing: fast lookup of visible shapes
 */

import type { CanvasShape, RectangleShape, CircleShape, TextShape, Viewport } from '../types/canvas.types';

/**
 * Spatial index for fast shape lookup
 * Divides canvas into grid cells for efficient queries
 */
export class SpatialIndex {
  private cellSize: number;
  private cells: Map<string, Set<string>>; // cell key -> shape IDs
  private shapeLocations: Map<string, Set<string>>; // shape ID -> cell keys
  
  constructor(cellSize: number = 500) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.shapeLocations = new Map();
  }

  /**
   * Convert coordinates to cell key
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Get all cells that a shape overlaps
   */
  private getShapeCells(shape: CanvasShape): string[] {
    const bounds = this.getShapeBounds(shape);
    const cells: Set<string> = new Set();

    // Get all cells that the shape's bounding box overlaps
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        cells.add(`${cx},${cy}`);
      }
    }

    return Array.from(cells);
  }

  /**
   * Get bounding box for any shape type
   */
  private getShapeBounds(shape: CanvasShape): { minX: number; maxX: number; minY: number; maxY: number } {
    switch (shape.type) {
      case 'rectangle': {
        const rect = shape as RectangleShape;
        return {
          minX: rect.x,
          maxX: rect.x + rect.width,
          minY: rect.y,
          maxY: rect.y + rect.height,
        };
      }
      case 'circle': {
        const circle = shape as CircleShape;
        return {
          minX: circle.x - circle.radius,
          maxX: circle.x + circle.radius,
          minY: circle.y - circle.radius,
          maxY: circle.y + circle.radius,
        };
      }
      case 'text': {
        const text = shape as TextShape;
        const estimatedWidth = (text.text?.length || 0) * (text.fontSize || 24) * 0.6;
        const estimatedHeight = text.fontSize || 24;
        return {
          minX: text.x,
          maxX: text.x + estimatedWidth,
          minY: text.y,
          maxY: text.y + estimatedHeight,
        };
      }
      default:
        return { minX: shape.x, maxX: shape.x, minY: shape.y, maxY: shape.y };
    }
  }

  /**
   * Add or update a shape in the index
   */
  addShape(shape: CanvasShape): void {
    // Remove from old cells if already indexed
    this.removeShape(shape.id);

    // Add to new cells
    const cells = this.getShapeCells(shape);
    for (const cellKey of cells) {
      if (!this.cells.has(cellKey)) {
        this.cells.set(cellKey, new Set());
      }
      this.cells.get(cellKey)!.add(shape.id);
    }

    // Track which cells this shape is in
    this.shapeLocations.set(shape.id, new Set(cells));
  }

  /**
   * Remove a shape from the index
   */
  removeShape(shapeId: string): void {
    const cells = this.shapeLocations.get(shapeId);
    if (cells) {
      for (const cellKey of cells) {
        this.cells.get(cellKey)?.delete(shapeId);
      }
      this.shapeLocations.delete(shapeId);
    }
  }

  /**
   * Get all shape IDs in a viewport area
   */
  getShapesInViewport(viewport: { x: number; y: number; width: number; height: number }): Set<string> {
    const result: Set<string> = new Set();

    // Find all cells that overlap the viewport
    const minCellX = Math.floor(viewport.x / this.cellSize);
    const maxCellX = Math.floor((viewport.x + viewport.width) / this.cellSize);
    const minCellY = Math.floor(viewport.y / this.cellSize);
    const maxCellY = Math.floor((viewport.y + viewport.height) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const cellKey = `${cx},${cy}`;
        const cellShapes = this.cells.get(cellKey);
        if (cellShapes) {
          cellShapes.forEach(id => result.add(id));
        }
      }
    }

    return result;
  }

  /**
   * Clear all indexed shapes
   */
  clear(): void {
    this.cells.clear();
    this.shapeLocations.clear();
  }

  /**
   * Get statistics about the index
   */
  getStats(): { totalCells: number; totalShapes: number; avgShapesPerCell: number } {
    const totalCells = this.cells.size;
    const totalShapes = this.shapeLocations.size;
    let totalShapesInCells = 0;
    this.cells.forEach(cell => totalShapesInCells += cell.size);
    const avgShapesPerCell = totalCells > 0 ? totalShapesInCells / totalCells : 0;

    return { totalCells, totalShapes, avgShapesPerCell };
  }
}

/**
 * Calculate visible viewport bounds in canvas coordinates
 */
export function getViewportBounds(
  containerWidth: number,
  containerHeight: number,
  viewport: Viewport,
  padding: number = 100 // Extra padding to preload shapes just outside viewport
): { x: number; y: number; width: number; height: number } {
  // Convert screen coordinates to canvas coordinates
  const x = (-viewport.x) / viewport.scale - padding;
  const y = (-viewport.y) / viewport.scale - padding;
  const width = containerWidth / viewport.scale + padding * 2;
  const height = containerHeight / viewport.scale + padding * 2;

  return { x, y, width, height };
}

/**
 * Check if a shape is visible in the viewport
 */
export function isShapeVisible(
  shape: CanvasShape,
  viewportBounds: { x: number; y: number; width: number; height: number }
): boolean {
  let shapeMinX: number, shapeMaxX: number, shapeMinY: number, shapeMaxY: number;

  switch (shape.type) {
    case 'rectangle': {
      const rect = shape as RectangleShape;
      shapeMinX = rect.x;
      shapeMaxX = rect.x + rect.width;
      shapeMinY = rect.y;
      shapeMaxY = rect.y + rect.height;
      break;
    }
    case 'circle': {
      const circle = shape as CircleShape;
      shapeMinX = circle.x - circle.radius;
      shapeMaxX = circle.x + circle.radius;
      shapeMinY = circle.y - circle.radius;
      shapeMaxY = circle.y + circle.radius;
      break;
    }
    case 'text': {
      const text = shape as TextShape;
      const estimatedWidth = (text.text?.length || 0) * (text.fontSize || 24) * 0.6;
      const estimatedHeight = text.fontSize || 24;
      shapeMinX = text.x;
      shapeMaxX = text.x + estimatedWidth;
      shapeMinY = text.y;
      shapeMaxY = text.y + estimatedHeight;
      break;
    }
    default:
      return true; // Unknown shape type, assume visible
  }

  // Check if shape's bounding box intersects with viewport
  const viewportMinX = viewportBounds.x;
  const viewportMaxX = viewportBounds.x + viewportBounds.width;
  const viewportMinY = viewportBounds.y;
  const viewportMaxY = viewportBounds.y + viewportBounds.height;

  // AABB (Axis-Aligned Bounding Box) intersection test
  return !(
    shapeMaxX < viewportMinX ||
    shapeMinX > viewportMaxX ||
    shapeMaxY < viewportMinY ||
    shapeMinY > viewportMaxY
  );
}

/**
 * Filter shapes to only those visible in viewport
 */
export function getVisibleShapes(
  shapes: CanvasShape[],
  containerWidth: number,
  containerHeight: number,
  viewport: Viewport,
  padding: number = 100
): CanvasShape[] {
  const viewportBounds = getViewportBounds(containerWidth, containerHeight, viewport, padding);
  return shapes.filter(shape => isShapeVisible(shape, viewportBounds));
}

/**
 * Debounce function for optimizing frequent updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for rate-limiting frequent operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Performance monitor for tracking FPS and render times
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private renderTimes: number[] = [];
  private maxSamples = 60;

  /**
   * Call this at the start of each frame
   */
  startFrame(): number {
    return performance.now();
  }

  /**
   * Call this at the end of each frame
   */
  endFrame(startTime: number): void {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.renderTimes.push(renderTime);
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }

    this.frameCount++;
    const currentTime = endTime;
    const elapsed = currentTime - this.lastTime;

    // Update FPS every second
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get average render time in ms
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  /**
   * Get max render time in ms
   */
  getMaxRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    return Math.max(...this.renderTimes);
  }

  /**
   * Get performance stats
   */
  getStats(): {
    fps: number;
    avgRenderTime: number;
    maxRenderTime: number;
    samples: number;
  } {
    return {
      fps: this.getFPS(),
      avgRenderTime: this.getAverageRenderTime(),
      maxRenderTime: this.getMaxRenderTime(),
      samples: this.renderTimes.length,
    };
  }

  /**
   * Reset all stats
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.renderTimes = [];
  }
}

/**
 * Batch update manager for combining multiple small updates into one
 */
export class BatchUpdateManager<T> {
  private pendingUpdates: Map<string, T> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private flushCallback: (updates: Map<string, T>) => void;
  private flushDelay: number;

  constructor(flushCallback: (updates: Map<string, T>) => void, flushDelay: number = 16) {
    this.flushCallback = flushCallback;
    this.flushDelay = flushDelay;
  }

  /**
   * Add an update to the batch
   */
  addUpdate(key: string, value: T): void {
    this.pendingUpdates.set(key, value);
    this.scheduleFlush();
  }

  /**
   * Schedule a flush if not already scheduled
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.flushDelay);
  }

  /**
   * Immediately flush all pending updates
   */
  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pendingUpdates.size === 0) return;

    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.flushCallback(updates);
  }

  /**
   * Clear all pending updates without flushing
   */
  clear(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pendingUpdates.clear();
  }

  /**
   * Get number of pending updates
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

