const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const COLOR_ALIAS_MAP: Record<string, string> = {
  // Design system colors (primary names)
  red: '#EF5350',
  orange: '#FF7043',
  yellow: '#FFCA28',
  green: '#66BB6A',
  blue: '#42A5F5',
  indigo: '#5C6BC0',
  purple: '#AB47BC',
  pink: '#EC407A',
  gray: '#BDBDBD',
  grey: '#BDBDBD',
  black: '#424242',
  
  // Additional aliases for design system colors
  navy: '#5C6BC0',
  navyblue: '#5C6BC0',
  skyblue: '#42A5F5',
  lightblue: '#42A5F5',
  royalblue: '#42A5F5',
  cobalt: '#42A5F5',
  cyan: '#42A5F5',
  aqua: '#42A5F5',
  teal: '#66BB6A',
  lime: '#66BB6A',
  chartreuse: '#66BB6A',
  jade: '#66BB6A',
  emerald: '#66BB6A',
  mint: '#66BB6A',
  amber: '#FFCA28',
  gold: '#FFCA28',
  apricot: '#FF7043',
  peach: '#FF7043',
  coral: '#FF7043',
  salmon: '#FF7043',
  brick: '#EF5350',
  crimson: '#EF5350',
  scarlet: '#EF5350',
  blush: '#EC407A',
  rose: '#EC407A',
  magenta: '#EC407A',
  fuchsia: '#EC407A',
  violet: '#AB47BC',
  lavender: '#AB47BC',
  plum: '#AB47BC',
  mauve: '#AB47BC',
  lilac: '#AB47BC',
  periwinkle: '#AB47BC',
};

export const normalizeHexColor = (value: string | undefined | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(HEX_COLOR_REGEX);
  if (!match) {
    return null;
  }

  let hexBody = match[1].toLowerCase();

  if (hexBody.length === 3) {
    hexBody = hexBody
      .split('')
      .map((char) => char + char)
      .join('');
  } else if (hexBody.length === 8) {
    hexBody = hexBody.slice(0, 6);
  }

  if (hexBody.length !== 6) {
    return null;
  }

  return `#${hexBody}`;
};

const hexToRgb = (hex: string): [number, number, number] | null => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return null;
  }

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null;
  }

  return [r, g, b];
};

const colorDistance = (a: string, b: string): number => {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);

  if (!rgbA || !rgbB) {
    return Number.POSITIVE_INFINITY;
  }

  const [r1, g1, b1] = rgbA;
  const [r2, g2, b2] = rgbB;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const buildAliasKeys = (input: string): Set<string> => {
  const normalized = input.trim().toLowerCase();
  const keys = new Set<string>();
  if (!normalized) {
    return keys;
  }

  keys.add(normalized);
  keys.add(normalized.replace(/[^a-z0-9]/g, ''));

  const tokens = normalized.split(/[\s,_-]+/).filter(Boolean);
  for (const token of tokens) {
    keys.add(token);
  }

  return keys;
};

export interface ColorResolution {
  direct: Set<string>;
  fallback: Set<string>;
}

/**
 * Resolve a natural language color description to palette-friendly hex codes.
 * Direct matches are preferred (aliases, explicit hex).
 */
export const resolveColorQuery = (query: string): ColorResolution => {
  const direct = new Set<string>();
  const fallback = new Set<string>();

  if (!query) {
    return { direct, fallback };
  }

  // Direct hex input
  const normalizedHex = normalizeHexColor(query);
  if (normalizedHex) {
    direct.add(normalizedHex);
    return { direct, fallback };
  }

  // Alias matching (supports "light blue", "navy", etc.)
  const aliasKeys = buildAliasKeys(query);
  for (const key of aliasKeys) {
    const aliasHex = COLOR_ALIAS_MAP[key];
    if (aliasHex) {
      const normalizedAlias = normalizeHexColor(aliasHex);
      if (normalizedAlias) {
        direct.add(normalizedAlias);
      }
    }
  }

  return { direct, fallback };
};

/**
 * Check if a shape's color matches the query color within acceptable tolerance
 */
export const isColorMatch = (shapeColor: string | undefined, queryColor: string): boolean => {
  if (!shapeColor || !queryColor) {
    return false;
  }

  const normalizedShape = normalizeHexColor(shapeColor);
  const normalizedQuery = normalizeHexColor(queryColor);

  if (!normalizedShape || !normalizedQuery) {
    return false;
  }

  // Exact match
  if (normalizedShape === normalizedQuery) {
    return true;
  }

  // Close enough match (within 30 units in RGB space)
  const distance = colorDistance(normalizedShape, normalizedQuery);
  return distance <= 30;
};

/**
 * Filter shapes by color description
 */
export const filterShapesByColor = (
  shapes: any[],
  colorQuery: string
): any[] => {
  const { direct, fallback } = resolveColorQuery(colorQuery);
  const allColors = new Set([...direct, ...fallback]);

  if (allColors.size === 0) {
    return [];
  }

  return shapes.filter((shape) => {
    for (const targetColor of allColors) {
      if (isColorMatch(shape.color, targetColor)) {
        return true;
      }
    }
    return false;
  });
};
