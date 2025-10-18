/**
 * CollabCanvas Theme System
 * 
 * Provides theme management with support for light and dark modes.
 * Currently implements light mode with structure for future dark mode support.
 */

import { colors, spacing, typography, borderRadius, shadows, transitions, zIndex } from './design-system';

/**
 * Theme interface defining the structure of a theme
 */
export interface Theme {
  name: string;
  colors: {
    // Brand
    primary: string;
    primaryDark: string;
    primaryLight: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;

    // Backgrounds
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    backgroundElevated: string;

    // Borders
    border: string;
    borderLight: string;
    borderDark: string;

    // Status
    success: string;
    error: string;
    warning: string;
    info: string;

    // Canvas-specific
    canvasBackground: string;
    canvasGrid: string;
    canvasBoundary: string;
    selection: string;
    locked: string;
    highlight: string;

    // Interactive states
    hover: string;
    active: string;
    disabled: string;
    focus: string;
  };
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  transitions: typeof transitions;
  zIndex: typeof zIndex;
}

/**
 * Light Theme (Default)
 * The primary theme for CollabCanvas
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    // Brand
    primary: colors.brand.primary,
    primaryDark: colors.brand.primaryDark,
    primaryLight: colors.brand.primaryLight,

    // Text
    textPrimary: colors.text.primary,
    textSecondary: colors.text.secondary,
    textTertiary: colors.text.tertiary,
    textInverse: '#ffffff',

    // Backgrounds
    background: colors.background.primary,
    backgroundSecondary: colors.background.secondary,
    backgroundTertiary: colors.background.tertiary,
    backgroundElevated: '#ffffff',

    // Borders
    border: colors.border.default,
    borderLight: colors.border.light,
    borderDark: colors.border.dark,

    // Status
    success: colors.status.success,
    error: colors.status.error,
    warning: colors.status.warning,
    info: colors.status.info,

    // Canvas-specific
    canvasBackground: '#f9f9f9',
    canvasGrid: colors.canvas.grid,
    canvasBoundary: colors.canvas.boundary,
    selection: colors.canvas.selection,
    locked: colors.canvas.locked,
    highlight: colors.canvas.highlight,

    // Interactive states
    hover: 'rgba(0, 0, 0, 0.05)',
    active: 'rgba(0, 0, 0, 0.1)',
    disabled: 'rgba(0, 0, 0, 0.3)',
    focus: colors.brand.primary,
  },
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
};

/**
 * Dark Theme (Future Implementation)
 * Structure for future dark mode support
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    // Brand (adjusted for dark mode)
    primary: '#5FD8D3',
    primaryDark: '#52C4E0',
    primaryLight: '#B0DFBC',

    // Text
    textPrimary: '#e5e5e5',
    textSecondary: '#b0b0b0',
    textTertiary: '#808080',
    textInverse: '#1a1a1a',

    // Backgrounds
    background: '#1a1a1a',
    backgroundSecondary: '#242424',
    backgroundTertiary: '#2e2e2e',
    backgroundElevated: '#323232',

    // Borders
    border: '#404040',
    borderLight: '#333333',
    borderDark: '#4d4d4d',

    // Status (adjusted for dark mode)
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#42a5f5',

    // Canvas-specific
    canvasBackground: '#1f1f1f',
    canvasGrid: '#333333',
    canvasBoundary: '#ff6b58',
    selection: '#26c6da',
    locked: '#ff6b58',
    highlight: '#34d399',

    // Interactive states
    hover: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    focus: '#5FD8D3',
  },
  spacing,
  typography,
  borderRadius,
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 2px 8px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.5)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.6)',
    '2xl': '0 12px 32px rgba(0, 0, 0, 0.7)',
  },
  transitions,
  zIndex,
};

/**
 * Theme type for easier access
 */
export type ThemeName = 'light' | 'dark';

/**
 * Available themes
 */
export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

/**
 * Default theme
 */
export const defaultTheme: Theme = lightTheme;

/**
 * Get theme by name
 * @param name - The theme name ('light' or 'dark')
 * @returns The requested theme or default theme if not found
 */
export const getTheme = (name: ThemeName): Theme => {
  return themes[name] || defaultTheme;
};

/**
 * Theme Context Value Interface
 * For use with React Context API
 */
export interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

/**
 * Local Storage Key for Theme Persistence
 */
export const THEME_STORAGE_KEY = 'collabcanvas-theme';

/**
 * Get stored theme preference
 * @returns The stored theme name or 'light' as default
 */
export const getStoredTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored === 'dark' || stored === 'light') ? stored : 'light';
};

/**
 * Store theme preference
 * @param themeName - The theme name to store
 */
export const storeTheme = (themeName: ThemeName): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(THEME_STORAGE_KEY, themeName);
};

/**
 * Apply theme to document root
 * Updates CSS variables based on the theme
 * @param theme - The theme to apply
 */
export const applyThemeToDocument = (theme: Theme): void => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Apply color variables
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
  root.style.setProperty('--color-primary-light', theme.colors.primaryLight);

  root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--color-text-tertiary', theme.colors.textTertiary);

  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-background-secondary', theme.colors.backgroundSecondary);
  root.style.setProperty('--color-background-tertiary', theme.colors.backgroundTertiary);

  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-border-light', theme.colors.borderLight);
  root.style.setProperty('--color-border-dark', theme.colors.borderDark);

  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-info', theme.colors.info);

  // Apply theme name as data attribute for CSS selectors
  root.setAttribute('data-theme', theme.name);
};

/**
 * Detect user's preferred color scheme
 * @returns 'dark' if user prefers dark mode, 'light' otherwise
 */
export const getPreferredColorScheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Listen for color scheme changes
 * @param callback - Function to call when color scheme changes
 * @returns Cleanup function to remove listener
 */
export const watchColorSchemeChanges = (callback: (prefersDark: boolean) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  // Legacy browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
};

