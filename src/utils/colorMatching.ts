import { SHAPE_COLORS } from './colors';

const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_FUNCTION_REGEX = /^rgba?\((.+)\)$/i;

const COLOR_ALIAS_MAP: Record<string, string> = {
  // Blues
  blue: '#0000FF',
  navy: '#000080',
  navyblue: '#000080',
  skyblue: '#87CEEB',
  royalblue: '#4169E1',
  cobalt: '#0047AB',
  ocean: '#4DB6AC',
  azure: '#4FC3F7',
  babyblue: '#4FC3F7',
  powderblue: '#4FC3F7',
  lightblue: '#4FC3F7',
  cyan: '#4DD0E1',
  aqua: '#4DD0E1',
  aquamarine: '#4DD0E1',
  turquoise: '#4DD0E1',
  teal: '#4DB6AC',
  mint: '#4DB6AC',
  seafoam: '#4DB6AC',
  emerald: '#4DB6AC',
  // Greens
  green: '#008000',
  lime: '#00FF00',
  chartreuse: '#7FFF00',
  jade: '#00A86B',
  // Warm colors
  yellow: '#FFFF00',
  amber: '#FFBF00',
  gold: '#FFD700',
  orange: '#FFA500',
  apricot: '#FBCEB1',
  peach: '#FFE5B4',
  butterscotch: '#E3963E',
  coral: '#FF7F50',
  salmon: '#FA8072',
  terracotta: '#E2725B',
  red: '#FF0000',
  brick: '#B22222',
  // Pinks & Purples
  pink: '#FFC0CB',
  blush: '#DE5D83',
  rose: '#FF007F',
  magenta: '#FF00FF',
  fuchsia: '#FF00FF',
  purple: '#800080',
  plum: '#DDA0DD',
  mauve: '#E0B0FF',
  violet: '#EE82EE',
  lavender: '#E6E6FA',
  lilac: '#C8A2C8',
  periwinkle: '#CCCCFF',
  indigo: '#4B0082',
};

let colorTestElement: HTMLElement | null = null;

const ensureColorTestElement = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  if (colorTestElement) {
    return colorTestElement;
  }

  const el = document.createElement('span');
  el.style.display = 'none';

  const parent = document.body || document.documentElement;
  parent?.appendChild(el);
  colorTestElement = el;
  return colorTestElement;
};

const clampChannel = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
};

const hexFromChannels = (r: number, g: number, b: number): string => {
  const toHex = (channel: number): string => clampChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const parseRgbString = (value: string): string | null => {
  const match = value.trim().match(RGB_FUNCTION_REGEX);
  if (!match) {
    return null;
  }

  const body = match[1];
  const parts = body
    .split(/[\s,\/]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const parseChannel = (part: string): number => {
    if (part.endsWith('%')) {
      const percent = parseFloat(part.slice(0, -1));
      if (Number.isNaN(percent)) {
        return 0;
      }
      return clampChannel((percent / 100) * 255);
    }
    return clampChannel(parseFloat(part));
  };

  const [r, g, b] = parts;
  return hexFromChannels(parseChannel(r), parseChannel(g), parseChannel(b));
};

const tryParseCssColor = (input: string): string | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const el = ensureColorTestElement();
  if (!el) {
    return null;
  }

  el.style.color = '';
  el.style.color = input;

  if (!el.style.color) {
    return null;
  }

  const computed = window.getComputedStyle(el).color;
  if (!computed) {
    return null;
  }

  return parseRgbString(computed);
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

const getClosestPaletteColor = (hex: string): { hex: string | null; distance: number } => {
  const normalizedHex = normalizeHexColor(hex);
  if (!normalizedHex) {
    return { hex: null, distance: Number.POSITIVE_INFINITY };
  }

  let closest: string | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const paletteColor of SHAPE_COLORS) {
    const normalizedPaletteColor = normalizeHexColor(paletteColor);
    if (!normalizedPaletteColor) {
      continue;
    }

    const distance = colorDistance(normalizedHex, normalizedPaletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      closest = normalizedPaletteColor;
    }
  }

  return { hex: closest, distance: minDistance };
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
 * Direct matches are preferred (aliases, explicit hex, rgb strings).
 * Fallback matches include CSS keyword parsing with palette snapping.
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

  // RGB / RGBA function input
  const rgbHex = parseRgbString(query);
  if (rgbHex) {
    direct.add(rgbHex);
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

  if (direct.size > 0) {
    return { direct, fallback };
  }

  // CSS keyword parsing as fallback
  const cssHex = tryParseCssColor(query);
  if (cssHex) {
    const normalizedCssHex = normalizeHexColor(cssHex);
    if (normalizedCssHex) {
      fallback.add(normalizedCssHex);
      const { hex: closest, distance } = getClosestPaletteColor(normalizedCssHex);
      if (closest && distance <= 150) {
        fallback.add(closest);
      }
    }
  }

  return { direct, fallback };
};
