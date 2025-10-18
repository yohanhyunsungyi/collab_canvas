# AI Design System Tool - Usage Guide

The AI can now access the CollabCanvas design system through the `getDesignSystemTokens` tool.

## Tool Overview

**Function Name:** `getDesignSystemTokens`

**Purpose:** Get design system tokens including colors, spacing, typography, and canvas defaults.

**Parameters:**
- `category` (optional): 'colors', 'spacing', 'typography', 'canvas', or 'all'

## Usage Examples

### Example 1: Query All Design Tokens
```
AI Command: "What design tokens are available?"
Tool Call: getDesignSystemTokens({ category: 'all' })
Response: Full design system with 10 shape colors, spacing scale, typography, and canvas defaults
```

### Example 2: Get Color Palette
```
AI Command: "Show me the available colors"
Tool Call: getDesignSystemTokens({ category: 'colors' })
Response: {
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
    black: '#1f2937'
  },
  brand: { primary: '#4ECDC4', ... },
  status: { success: '#4caf50', error: '#f44336', ... }
}
```

### Example 3: Create Shape with Design System Color
```
AI Command: "Create a purple rectangle"
Flow:
1. getDesignSystemTokens({ category: 'colors' })
2. Extract colors.shapes.purple = '#a855f7'
3. createRectangle({ color: '#a855f7', width: 100, height: 100 })
```

### Example 4: Use Professional Color Scheme
```
AI Command: "Create a dashboard with the design system colors"
Flow:
1. getDesignSystemTokens({ category: 'colors' })
2. Use colors.shapes.blue for primary elements
3. Use colors.shapes.green for success indicators
4. Use colors.shapes.red for alerts
5. Use colors.brand.primary for accents
```

### Example 5: Get Typography Defaults
```
AI Command: "What font sizes are available?"
Tool Call: getDesignSystemTokens({ category: 'typography' })
Response: {
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem'     // 48px
  }
}
```

### Example 6: Use Canvas Defaults
```
AI Command: "Create a shape with default settings"
Tool Call: getDesignSystemTokens({ category: 'canvas' })
Response: {
  defaultShapeColor: '#3b82f6',
  defaultTextSize: 24,
  defaultRectangleSize: { width: 100, height: 100 },
  defaultCircleRadius: 50
}
```

## Benefits

1. **Consistency**: AI creates shapes using the same color palette as the UI
2. **Professional**: 10 carefully chosen colors from the design system
3. **Flexible**: AI can query specific categories or get everything
4. **Smart**: AI learns about spacing, typography, and defaults
5. **Maintainable**: Single source of truth for all design values

## Design System Structure

### Colors
- **shapes**: 10 colors (red, orange, yellow, green, blue, indigo, purple, pink, gray, black)
- **brand**: primary, primaryDark, primaryLight
- **status**: success, error, warning, info
- **canvas**: selection, locked, highlight
- **text**: primary, secondary, tertiary
- **background**: primary, secondary, tertiary
- **border**: light, default, dark

### Spacing
- **values**: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px)
- **pixels**: Same as above but as numbers for calculations

### Typography
- **fontSize**: xs to 5xl (12px to 48px)
- **fontWeight**: normal (400), medium (500), semibold (600), bold (700)
- **lineHeight**: tight (1.2), normal (1.5), relaxed (1.75)

### Canvas
- **width**: 5000px
- **height**: 5000px
- **defaultShapeColor**: '#3b82f6' (blue)
- **defaultTextSize**: 24px
- **defaultRectangleSize**: { width: 100, height: 100 }
- **defaultCircleRadius**: 50px

## Best Practices for AI

1. **Query once, use many times**: Get all colors once, then reference them
2. **Use shape colors**: Prefer `colors.shapes.*` for canvas shapes
3. **Use defaults**: Apply canvas defaults when user doesn't specify values
4. **Be consistent**: Use the same color palette across all AI-generated content
5. **Explain choices**: Tell users you're using the design system colors

## Example AI Workflow

```
User: "Create a colorful grid of shapes"

AI thinks:
1. First, get the color palette
2. getDesignSystemTokens({ category: 'colors' })
3. Get 9 colors from colors.shapes
4. Create 3x3 grid with different colors
5. Tell user I used the design system colors

AI response:
"I'll create a 3x3 grid using the design system's color palette..."
[Creates grid with red, orange, yellow, green, blue, indigo, purple, pink, gray shapes]
"Created a colorful grid using 9 colors from the design system!"
```

## Integration with Toolbar

The toolbar now fully integrates the design system:

### Color Picker
- **Location**: Style section of the floating toolbar
- **Colors**: Uses all 10 design system shape colors (red, orange, yellow, green, blue, indigo, purple, pink, gray, black)
- **Component**: `ColorPicker.tsx` imports from `design-system.ts`
- **User Experience**: 5x2 grid with color labels and hover effects

### Font Size Selector
- **Location**: Next to the Text tool in the toolbar
- **Sizes**: Design system typography scale (12px to 48px)
- **Labels**: Shows both pixel value and design system name (e.g., "24px (2xl)")
- **Options**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl

### Design System Variables
- Button colors match `colors.background`
- Hover states use `colors.background.secondary`
- Borders use `colors.border`
- Shadows use `shadows.xl`
- Spacing uses `spacing.sm` and `spacing.md`

### Benefits
- **Consistency**: Manual toolbar and AI use the same color palette
- **Professional**: Unified design language throughout the app
- **Predictable**: Users see the same colors in both manual and AI workflows
- **Maintainable**: Single source of truth in `design-system.ts`

This ensures the AI-generated shapes and manually created shapes are visually consistent!

