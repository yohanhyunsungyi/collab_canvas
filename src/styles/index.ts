/**
 * CollabCanvas Styles
 * 
 * Central export point for all design system and theme utilities
 */

// Design System
export {
  colors,
  spacing,
  spacingPx,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  canvas,
  animations,
  getCSSVariable,
  setCSSVariable,
} from './design-system';

export type {
  ColorPalette,
  SpacingScale,
  TypographyScale,
  BorderRadiusScale,
  ShadowScale,
  TransitionScale,
  ZIndexScale,
  BreakpointScale,
  CanvasTokens,
  AnimationPresets,
} from './design-system';

// Theme System
export {
  lightTheme,
  darkTheme,
  themes,
  defaultTheme,
  getTheme,
  getStoredTheme,
  storeTheme,
  applyThemeToDocument,
  getPreferredColorScheme,
  watchColorSchemeChanges,
  THEME_STORAGE_KEY,
} from './theme';

export type {
  Theme,
  ThemeName,
  ThemeContextValue,
} from './theme';

