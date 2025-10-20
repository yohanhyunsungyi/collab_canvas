// Shape colors (inlined for Firebase functions)
export const SHAPE_COLORS = {
  red: '#EF5350',
  orange: '#FF7043',
  yellow: '#FFCA28',
  green: '#66BB6A',
  blue: '#42A5F5',
  indigo: '#5C6BC0',
  purple: '#AB47BC',
  pink: '#EC407A',
  gray: '#BDBDBD',
  black: '#424242',
};

/**
 * Resolve color name to hex code
 */
export const resolveColorToHex = (color: string | undefined): string => {
  if (!color) {
    return SHAPE_COLORS.blue; // default
  }

  const normalized = color.trim().toLowerCase();
  
  // If already a hex color, return it
  if (normalized.startsWith('#')) {
    return normalized;
  }

  // Map common color names
  const colorMap: Record<string, string> = {
    red: SHAPE_COLORS.red,
    orange: SHAPE_COLORS.orange,
    yellow: SHAPE_COLORS.yellow,
    green: SHAPE_COLORS.green,
    blue: SHAPE_COLORS.blue,
    indigo: SHAPE_COLORS.indigo,
    purple: SHAPE_COLORS.purple,
    pink: SHAPE_COLORS.pink,
    gray: SHAPE_COLORS.gray,
    grey: SHAPE_COLORS.gray,
    black: SHAPE_COLORS.black,
  };

  return colorMap[normalized] || SHAPE_COLORS.blue;
};
