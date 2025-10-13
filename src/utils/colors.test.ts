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
    const color = getUserColor();
    expect(USER_COLORS).toContain(color);
  });

  it('should cycle through colors with getUserColor', () => {
    const colors = [];
    for (let i = 0; i < 12; i++) {
      colors.push(getUserColor());
    }
    // Should cycle back after 10 colors
    expect(colors[0]).toBe(colors[10]);
    expect(colors[1]).toBe(colors[11]);
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

