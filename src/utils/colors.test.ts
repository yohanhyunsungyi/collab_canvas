import { describe, it, expect } from 'vitest';
import { getUserColor, getRandomColor, getColorByIndex, USER_COLORS } from './colors';

describe('Color Utility', () => {
  it('should have 10 predefined colors', () => {
    expect(USER_COLORS).toHaveLength(10);
    USER_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('should return colors from palette with getUserColor', () => {
    const color = getUserColor('user-123');
    expect(USER_COLORS).toContain(color);
  });

  it('should return consistent color for same user ID', () => {
    const userId = 'test-user-123';
    const color1 = getUserColor(userId);
    const color2 = getUserColor(userId);
    const color3 = getUserColor(userId);
    
    // Same user ID should always get the same color
    expect(color1).toBe(color2);
    expect(color2).toBe(color3);
  });

  it('should return different colors for different user IDs', () => {
    const color1 = getUserColor('user-1');
    const color2 = getUserColor('user-2');
    const color3 = getUserColor('user-3');
    
    // At least some colors should be different (not guaranteed all different due to hash collisions)
    const uniqueColors = new Set([color1, color2, color3]);
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  it('should return random color from palette', () => {
    const color = getRandomColor();
    expect(USER_COLORS).toContain(color);
  });

  it('should return color by index', () => {
    expect(getColorByIndex(0)).toBe(USER_COLORS[0]);
    expect(getColorByIndex(5)).toBe(USER_COLORS[5]);
    expect(getColorByIndex(10)).toBe(USER_COLORS[0]); // Cycles
  });
});

