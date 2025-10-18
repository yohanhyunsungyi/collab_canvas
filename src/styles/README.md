# CollabCanvas Design System

A comprehensive design system providing consistent styling tokens and theme management for the CollabCanvas application.

## Overview

The design system consists of:
- **Design Tokens** (`design-system.ts`) - Colors, spacing, typography, shadows, etc.
- **Theme System** (`theme.ts`) - Light/dark mode support and theme management
- **Easy Imports** (`index.ts`) - Centralized exports

## Quick Start

```typescript
import { colors, spacing, typography, animations } from '@/styles';

// Use in your components
const buttonStyle = {
  backgroundColor: colors.brand.primary,
  padding: spacing.md,
  fontSize: typography.fontSize.base,
  borderRadius: borderRadius.md,
};
```

## Design Tokens

### Colors

#### Brand Colors
```typescript
colors.brand.primary      // #4ECDC4 - Main brand color
colors.brand.primaryDark  // #45B7D1 - Darker variant
colors.brand.primaryLight // #A2D5AB - Lighter variant
```

#### Text Colors
```typescript
colors.text.primary    // #333333 - Main text
colors.text.secondary  // #666666 - Secondary text
colors.text.tertiary   // #999999 - Tertiary text
```

#### Status Colors
```typescript
colors.status.success  // #4caf50 - Success state
colors.status.error    // #f44336 - Error state
colors.status.warning  // #ff9800 - Warning state
colors.status.info     // #2196f3 - Info state
```

#### Canvas Colors
```typescript
colors.canvas.selection  // #00bcd4 - Selected shapes
colors.canvas.locked     // #ff5722 - Locked shapes
colors.canvas.highlight  // #10b981 - AI-highlighted shapes
```

#### Shape Palette (Color Picker)
```typescript
colors.shapes.red      // #ef4444
colors.shapes.blue     // #3b82f6
colors.shapes.green    // #22c55e
colors.shapes.purple   // #a855f7
// ... and more
```

### Spacing

Based on a 4px grid system:

```typescript
spacing.xs   // 0.25rem (4px)
spacing.sm   // 0.5rem (8px)
spacing.md   // 1rem (16px)
spacing.lg   // 1.5rem (24px)
spacing.xl   // 2rem (32px)
spacing['2xl'] // 3rem (48px)
spacing['3xl'] // 4rem (64px)

// Use spacingPx for calculations
const totalWidth = 100 + spacingPx.md * 2; // 100px + 32px padding
```

### Typography

```typescript
// Font Sizes
typography.fontSize.xs    // 0.75rem (12px)
typography.fontSize.base  // 1rem (16px)
typography.fontSize['2xl'] // 1.5rem (24px)
typography.fontSize['5xl'] // 3rem (48px)

// Font Weights
typography.fontWeight.normal   // 400
typography.fontWeight.semibold // 600
typography.fontWeight.bold     // 700

// Line Heights
typography.lineHeight.tight   // 1.2
typography.lineHeight.normal  // 1.5
typography.lineHeight.relaxed // 1.75

// Font Family
typography.fontFamily.sans // System font stack
typography.fontFamily.mono // Monospace font stack
```

### Border Radius

```typescript
borderRadius.sm   // 4px
borderRadius.md   // 6px
borderRadius.lg   // 8px
borderRadius.xl   // 12px
borderRadius.full // 50% (circle)
```

### Shadows

```typescript
shadows.sm  // 0 1px 3px rgba(0, 0, 0, 0.05)
shadows.md  // 0 2px 8px rgba(0, 0, 0, 0.08)
shadows.lg  // 0 4px 12px rgba(0, 0, 0, 0.12)
shadows.xl  // 0 8px 24px rgba(0, 0, 0, 0.15)
```

### Transitions

```typescript
// Full transition strings
transitions.fast  // 0.15s ease
transitions.base  // 0.2s ease
transitions.slow  // 0.3s ease

// Duration only (milliseconds)
transitions.duration.fast  // 150
transitions.duration.base  // 200
transitions.duration.slow  // 300

// Easing functions
transitions.easing.ease      // 'ease'
transitions.easing.easeOut   // 'ease-out'
transitions.easing.easeInOut // 'ease-in-out'
```

### Z-Index

```typescript
zIndex.base          // 0
zIndex.dropdown      // 1000
zIndex.modal         // 1400
zIndex.tooltip       // 1600
zIndex.toast         // 1700
```

### Canvas Tokens

```typescript
canvas.width        // 5000
canvas.height       // 5000
canvas.minScale     // 0.1
canvas.maxScale     // 3
canvas.gridSize     // 50
canvas.lockTimeout  // 30000 (30 seconds)
```

## Animation Presets

Pre-configured animation settings:

```typescript
// Fade In
animations.fadeIn
// { from: { opacity: 0 }, to: { opacity: 1 }, duration: 200 }

// Slide In From Right
animations.slideInFromRight
// { from: { transform: 'translateX(100%)' }, ... }

// Scale In
animations.scaleIn
// { from: { transform: 'scale(0.8)' }, ... }

// Pulse
animations.pulse
// { keyframes: { '0%': ..., '50%': ..., '100%': ... } }
```

### Using with CSS

```css
.fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Using with Konva

```typescript
import Konva from 'konva';
import { animations, transitions } from '@/styles';

// Fade in shape
shape.to({
  opacity: 1,
  duration: transitions.duration.base / 1000, // Convert ms to seconds
  easing: Konva.Easings.EaseOut,
});

// Scale animation
shape.to({
  scaleX: 1.1,
  scaleY: 1.1,
  duration: transitions.duration.fast / 1000,
  easing: Konva.Easings.EaseInOut,
});
```

## Theme System

### Using Themes

The application supports light and dark themes:

```typescript
import { lightTheme, darkTheme, getTheme } from '@/styles';

// Get current theme
const theme = getTheme('light');

// Use theme colors
const textColor = theme.colors.textPrimary;
const bgColor = theme.colors.background;
```

### Theme Structure

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string;
    textPrimary: string;
    background: string;
    // ... etc
  };
  spacing: {...};
  typography: {...};
  // ... etc
}
```

### Persisting Theme Preference

```typescript
import { getStoredTheme, storeTheme } from '@/styles';

// Get stored preference
const savedTheme = getStoredTheme(); // 'light' or 'dark'

// Save preference
storeTheme('dark');
```

### Applying Theme to Document

```typescript
import { applyThemeToDocument, lightTheme } from '@/styles';

// Apply theme CSS variables to document root
applyThemeToDocument(lightTheme);
```

### React Hook (Future)

```typescript
// Coming soon: useTheme hook for React components
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, themeName, setTheme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      style={{ color: theme.colors.primary }}
    >
      Current theme: {themeName}
    </button>
  );
}
```

## Utility Functions

### CSS Variable Helpers

```typescript
import { getCSSVariable, setCSSVariable } from '@/styles';

// Get CSS variable value
const primaryColor = getCSSVariable('--color-primary');

// Set CSS variable
setCSSVariable('--color-primary', '#ff0000');
```

## Examples

### Button Component

```typescript
import { colors, spacing, borderRadius, shadows, transitions } from '@/styles';

const buttonStyle = {
  backgroundColor: colors.brand.primary,
  color: '#ffffff',
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.md,
  boxShadow: shadows.sm,
  transition: transitions.base,
  border: 'none',
  cursor: 'pointer',
};

const buttonHoverStyle = {
  ...buttonStyle,
  backgroundColor: colors.brand.primaryDark,
  boxShadow: shadows.md,
};
```

### Card Component

```typescript
import { colors, spacing, borderRadius, shadows } from '@/styles';

const cardStyle = {
  backgroundColor: colors.background.primary,
  padding: spacing.lg,
  borderRadius: borderRadius.lg,
  boxShadow: shadows.lg,
  border: `1px solid ${colors.border.default}`,
};
```

### Toast Notification

```typescript
import { colors, spacing, borderRadius, shadows, zIndex } from '@/styles';

const toastStyle = {
  position: 'fixed' as const,
  top: spacing.lg,
  right: spacing.lg,
  backgroundColor: colors.background.elevated,
  padding: spacing.md,
  borderRadius: borderRadius.md,
  boxShadow: shadows.xl,
  zIndex: zIndex.toast,
};
```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
   ```typescript
   // ❌ Bad
   const style = { color: '#4ECDC4', padding: '16px' };
   
   // ✅ Good
   const style = { color: colors.brand.primary, padding: spacing.md };
   ```

2. **Use semantic color names**
   ```typescript
   // ❌ Bad
   const errorColor = '#ff0000';
   
   // ✅ Good
   const errorColor = colors.status.error;
   ```

3. **Leverage animation presets**
   ```typescript
   // ✅ Consistent animations
   const fadeInConfig = animations.fadeIn;
   ```

4. **Use spacing scale for consistency**
   ```typescript
   // ✅ All spacing follows 4px grid
   margin: spacing.md;
   padding: spacing.lg;
   gap: spacing.sm;
   ```

5. **Use theme system for dark mode support**
   ```typescript
   // ✅ Future-proof for dark mode
   const { theme } = useTheme();
   const textColor = theme.colors.textPrimary;
   ```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { 
  ColorPalette, 
  SpacingScale, 
  Theme,
  ThemeName 
} from '@/styles';
```

## CSS Variables

The design system integrates with CSS variables defined in `src/index.css`:

```css
:root {
  --color-primary: #4ECDC4;
  --spacing-md: 1rem;
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  /* ... etc */
}
```

## Migration Guide

If you have hardcoded values, migrate them to design tokens:

```typescript
// Before
const oldStyle = {
  color: '#4ECDC4',
  padding: '16px',
  borderRadius: '6px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
};

// After
import { colors, spacing, borderRadius, shadows } from '@/styles';

const newStyle = {
  color: colors.brand.primary,
  padding: spacing.md,
  borderRadius: borderRadius.md,
  boxShadow: shadows.md,
};
```

## Contributing

When adding new design tokens:

1. Add to appropriate section in `design-system.ts`
2. Update corresponding CSS variables in `index.css`
3. Update light/dark themes in `theme.ts`
4. Document in this README
5. Add TypeScript types if needed

## License

Part of CollabCanvas project.

