import { describe, expect, it } from 'vitest';
import { normalizeHexColor, resolveColorQuery } from './colorMatching';

describe('normalizeHexColor', () => {
  it('normalizes 3-digit hex codes', () => {
    expect(normalizeHexColor('#abc')).toBe('#aabbcc');
  });

  it('normalizes 6-digit hex codes', () => {
    expect(normalizeHexColor('#A1B2C3')).toBe('#a1b2c3');
  });

  it('strips alpha channel from 8-digit hex codes', () => {
    expect(normalizeHexColor('#11223344')).toBe('#112233');
  });

  it('returns null for invalid hex', () => {
    expect(normalizeHexColor('not-a-color')).toBeNull();
  });
});

describe('resolveColorQuery', () => {
  it('maps simple aliases to palette colors', () => {
    const result = resolveColorQuery('blue');
    expect(Array.from(result.direct)).toContain('#64b5f6');
  });

  it('handles spaced color names via alias lookup', () => {
    const result = resolveColorQuery('light blue');
    expect(Array.from(result.direct)).toContain('#4fc3f7');
  });

  it('parses rgb strings into hex', () => {
    const result = resolveColorQuery('rgb(255, 0, 0)');
    expect(Array.from(result.direct)).toContain('#ff0000');
  });

  it('falls back to CSS keyword parsing when no alias exists', () => {
    const result = resolveColorQuery('honeydew');
    expect(result.direct.size).toBe(0);
    expect(result.fallback.size).toBeGreaterThan(0);
  });
});
