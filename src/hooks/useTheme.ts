/**
 * useTheme Hook
 * 
 * Provides theme management functionality for React components.
 * Handles theme switching, persistence, and system preference detection.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type Theme,
  type ThemeName,
  getTheme,
  getStoredTheme,
  storeTheme,
  applyThemeToDocument,
  getPreferredColorScheme,
  watchColorSchemeChanges,
} from '../styles/theme';

/**
 * Hook for accessing and managing the application theme
 * 
 * @param options - Configuration options
 * @param options.followSystem - Whether to follow system color scheme preference (default: false)
 * @returns Theme management utilities
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, themeName, setTheme, toggleTheme } = useTheme();
 *   
 *   return (
 *     <div style={{ backgroundColor: theme.colors.background }}>
 *       <button onClick={toggleTheme}>
 *         Switch to {themeName === 'light' ? 'dark' : 'light'} mode
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useTheme = (options?: { followSystem?: boolean }) => {
  const { followSystem = false } = options || {};

  // Initialize theme from storage or system preference
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    if (followSystem) {
      return getPreferredColorScheme();
    }
    return getStoredTheme();
  });

  // Get the actual theme object
  const theme = useMemo(() => getTheme(themeName), [themeName]);

  /**
   * Change the current theme
   */
  const setTheme = useCallback((newThemeName: ThemeName) => {
    setThemeNameState(newThemeName);
    storeTheme(newThemeName);
    applyThemeToDocument(getTheme(newThemeName));
  }, []);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    const newTheme = themeName === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [themeName, setTheme]);

  /**
   * Apply theme to document on mount and when theme changes
   */
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  /**
   * Watch for system color scheme changes if followSystem is enabled
   */
  useEffect(() => {
    if (!followSystem) return;

    const cleanup = watchColorSchemeChanges((prefersDark) => {
      const systemTheme = prefersDark ? 'dark' : 'light';
      setThemeNameState(systemTheme);
      applyThemeToDocument(getTheme(systemTheme));
    });

    return cleanup;
  }, [followSystem]);

  return {
    /** The current theme object with all design tokens */
    theme,
    
    /** The current theme name ('light' or 'dark') */
    themeName,
    
    /** Function to change the theme */
    setTheme,
    
    /** Function to toggle between light and dark themes */
    toggleTheme,
    
    /** Whether the app is currently in dark mode */
    isDark: themeName === 'dark',
    
    /** Whether the app is currently in light mode */
    isLight: themeName === 'light',
  };
};

/**
 * Hook for accessing theme colors only (lightweight)
 * Use this when you only need colors and don't need theme switching functionality
 * 
 * @returns Theme colors
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const colors = useThemeColors();
 *   
 *   return <div style={{ color: colors.textPrimary }}>Hello</div>;
 * }
 * ```
 */
export const useThemeColors = () => {
  const themeName = getStoredTheme();
  const theme = getTheme(themeName);
  return theme.colors;
};

/**
 * Hook for detecting user's preferred color scheme
 * 
 * @returns The preferred color scheme ('light' or 'dark')
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const preferredScheme = usePreferredColorScheme();
 *   
 *   return <div>You prefer {preferredScheme} mode</div>;
 * }
 * ```
 */
export const usePreferredColorScheme = (): ThemeName => {
  const [preferredScheme, setPreferredScheme] = useState<ThemeName>(getPreferredColorScheme);

  useEffect(() => {
    const cleanup = watchColorSchemeChanges((prefersDark) => {
      setPreferredScheme(prefersDark ? 'dark' : 'light');
    });

    return cleanup;
  }, []);

  return preferredScheme;
};

/**
 * Hook for media query-based responsive design
 * 
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns Whether the media query matches
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = !useMediaQuery('(min-width: 768px)');
 *   
 *   return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
 * }
 * ```
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Legacy browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
};

export default useTheme;

