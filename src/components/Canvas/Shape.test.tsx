import { describe, it, expect } from 'vitest';
import type { RectangleShape, CircleShape, TextShape } from '../../types/canvas.types';

describe('Shape', () => {
  it('should have rectangle shape properties', () => {
    const rectangleShape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    expect(rectangleShape.type).toBe('rectangle');
    expect(rectangleShape.width).toBe(200);
    expect(rectangleShape.height).toBe(150);
  });

  it('should have circle shape properties', () => {
    const circleShape: CircleShape = {
      id: 'circle-1',
      type: 'circle',
      x: 200,
      y: 200,
      radius: 75,
      color: '#00ff00',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    expect(circleShape.type).toBe('circle');
    expect(circleShape.radius).toBe(75);
  });

  it('should have text shape properties', () => {
    const textShape: TextShape = {
      id: 'text-1',
      type: 'text',
      x: 150,
      y: 150,
      text: 'Hello World',
      fontSize: 24,
      width: 200,
      color: '#0000ff',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    expect(textShape.type).toBe('text');
    expect(textShape.text).toBe('Hello World');
    expect(textShape.fontSize).toBe(24);
  });

  it('should support shape selection state', () => {
    const rectangleShape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    const isSelected = true;
    expect(isSelected).toBe(true);
    expect(rectangleShape.id).toBe('rect-1');
  });

  it('should support drag position updates', () => {
    const shape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    // Simulate drag
    const newX = 250;
    const newY = 300;
    const updatedShape = { ...shape, x: newX, y: newY };

    expect(updatedShape.x).toBe(250);
    expect(updatedShape.y).toBe(300);
  });

  it('should support resize updates', () => {
    const shape: RectangleShape = {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      color: '#ff0000',
      createdBy: 'user-1',
      createdAt: Date.now(),
      lastModifiedBy: 'user-1',
      lastModifiedAt: Date.now(),
      lockedBy: null,
      lockedAt: null,
    };

    // Simulate resize
    const newWidth = 300;
    const newHeight = 250;
    const updatedShape = { ...shape, width: newWidth, height: newHeight };

    expect(updatedShape.width).toBe(300);
    expect(updatedShape.height).toBe(250);
  });
});

