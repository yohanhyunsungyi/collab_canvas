/**
 * CollabCanvas Design System
 * 
 * Central source of truth for design tokens used throughout the application.
 * These values match the CSS variables defined in index.css.
 */

/**
 * Brand Colors
 * Primary colors that define the CollabCanvas brand identity
 */
export const colors = {
  // Brand Colors
  brand: {
    primary: '#4ECDC4',
    primaryDark: '#45B7D1',
    primaryLight: '#A2D5AB',
  },

  // Neutral Colors
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
  },

  border: {
    light: '#f0f0f0',
    default: '#e0e0e0',
    dark: '#cccccc',
  },

  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
  },

  // Status Colors
  status: {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  },

  // Canvas-specific Colors
  canvas: {
    grid: '#e0e0e0',
    boundary: '#ff5722',
    selection: '#00bcd4',
    locked: '#ff5722',
    highlight: '#10b981',
  },

  // Shape Default Colors (Color Picker Palette)
  shapes: {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    blue: '#3b82f6',
    indigo: '#6366f1',
    purple: '#a855f7',
    pink: '#ec4899',
    gray: '#6b7280',
    black: '#1f2937',
  },
} as const;

/**
 * Spacing Scale
 * Consistent spacing system based on 4px grid
 */
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

/**
 * Spacing values as numbers (in pixels)
 * Useful for calculations in JavaScript
 */
export const spacingPx = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

/**
 * Typography Scale
 * Font sizes following a modular scale
 */
export const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  fontFamily: {
    sans: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
    mono: `'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace`,
  },
} as const;

/**
 * Border Radius Scale
 * Rounded corners for consistency
 */
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '50%',
} as const;

/**
 * Shadow Levels
 * Elevation system for depth perception
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.12)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.15)',
  '2xl': '0 12px 32px rgba(0, 0, 0, 0.18)',
} as const;

/**
 * Transition Timings
 * Animation durations for consistency
 */
export const transitions = {
  fast: '0.15s ease',
  base: '0.2s ease',
  slow: '0.3s ease',
  
  // Duration only (no easing)
  duration: {
    fast: 150,    // milliseconds
    base: 200,
    slow: 300,
  },
  
  // Easing functions
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
} as const;

/**
 * Z-Index Scale
 * Layering system for stacking contexts
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
} as const;

/**
 * Breakpoints
 * Responsive design breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Canvas-specific Design Tokens
 */
export const canvas = {
  // Canvas dimensions
  width: 5000,
  height: 5000,
  
  // Viewport bounds
  minX: -2500,
  maxX: 2500,
  minY: -2500,
  maxY: 2500,
  
  // Zoom constraints
  minScale: 0.1,
  maxScale: 3,
  scaleBy: 1.1,
  
  // Grid settings
  gridSize: 50,
  gridColor: colors.canvas.grid,
  
  // Shape defaults
  defaultShapeColor: colors.shapes.blue,
  defaultTextSize: 24,
  defaultRectangleSize: { width: 100, height: 100 },
  defaultCircleRadius: 50,
  
  // Selection & Lock
  selectionColor: colors.canvas.selection,
  selectionStrokeWidth: 3,
  lockColor: colors.canvas.locked,
  lockStrokeWidth: 3,
  highlightColor: colors.canvas.highlight,
  highlightDuration: 3000, // 3 seconds
  
  // Lock timeout
  lockTimeout: 30000, // 30 seconds
} as const;

/**
 * Animation Presets
 * Common animation configurations
 */
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: transitions.duration.base,
    easing: transitions.easing.easeOut,
  },
  
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: transitions.duration.base,
    easing: transitions.easing.easeIn,
  },
  
  slideInFromRight: {
    from: { transform: 'translateX(100%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
    duration: transitions.duration.slow,
    easing: transitions.easing.easeOut,
  },
  
  slideInFromBottom: {
    from: { transform: 'translateY(100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: transitions.duration.slow,
    easing: transitions.easing.easeOut,
  },
  
  scaleIn: {
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: transitions.duration.base,
    easing: transitions.easing.easeOut,
  },
  
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.8)', opacity: 0 },
    duration: transitions.duration.base,
    easing: transitions.easing.easeIn,
  },
  
  pulse: {
    keyframes: {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
    duration: 1000,
    iterationCount: 'infinite',
  },
} as const;

/**
 * Helper function to get CSS variable value
 * @param varName - CSS variable name (e.g., '--color-primary')
 * @returns The value of the CSS variable
 */
export const getCSSVariable = (varName: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

/**
 * Helper function to set CSS variable
 * @param varName - CSS variable name (e.g., '--color-primary')
 * @param value - The value to set
 */
export const setCSSVariable = (varName: string, value: string): void => {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(varName, value);
};

/**
 * Type exports for TypeScript users
 */
export type ColorPalette = typeof colors;
export type SpacingScale = typeof spacing;
export type TypographyScale = typeof typography;
export type BorderRadiusScale = typeof borderRadius;
export type ShadowScale = typeof shadows;
export type TransitionScale = typeof transitions;
export type ZIndexScale = typeof zIndex;
export type BreakpointScale = typeof breakpoints;
export type CanvasTokens = typeof canvas;
export type AnimationPresets = typeof animations;

