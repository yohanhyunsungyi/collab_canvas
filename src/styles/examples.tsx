/**
 * Design System Examples
 * 
 * Example components demonstrating how to use the CollabCanvas design system.
 * These are reference examples and not meant to be used directly in production.
 */

import { colors, spacing, typography, borderRadius, shadows, transitions } from './design-system';
import { useTheme } from '../hooks/useTheme';

/**
 * Example 1: Button using design tokens
 */
export const ExampleButton = () => {
  const buttonStyle: React.CSSProperties = {
    backgroundColor: colors.brand.primary,
    color: '#ffffff',
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.md,
    border: 'none',
    boxShadow: shadows.sm,
    cursor: 'pointer',
    transition: transitions.base,
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: colors.brand.primaryDark,
    boxShadow: shadows.md,
  };

  return (
    <button
      style={buttonStyle}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
    >
      Click Me
    </button>
  );
};

/**
 * Example 2: Card component using design tokens
 */
export const ExampleCard = ({ children }: { children: React.ReactNode }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.lg,
    border: `1px solid ${colors.border.default}`,
  };

  return <div style={cardStyle}>{children}</div>;
};

/**
 * Example 3: Alert component using status colors
 */
export const ExampleAlert = ({ 
  type, 
  children 
}: { 
  type: 'success' | 'error' | 'warning' | 'info'; 
  children: React.ReactNode;
}) => {
  const alertColors = {
    success: colors.status.success,
    error: colors.status.error,
    warning: colors.status.warning,
    info: colors.status.info,
  };

  const alertStyle: React.CSSProperties = {
    backgroundColor: alertColors[type] + '15', // Add alpha for light background
    color: alertColors[type],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeft: `4px solid ${alertColors[type]}`,
    fontSize: typography.fontSize.sm,
  };

  return <div style={alertStyle}>{children}</div>;
};

/**
 * Example 4: Using theme hook
 */
export const ExampleThemedComponent = () => {
  const { theme, themeName, toggleTheme } = useTheme();

  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.md,
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: theme.typography.fontSize['2xl'], marginBottom: theme.spacing.md }}>
        Current Theme: {themeName}
      </h2>
      <button
        onClick={toggleTheme}
        style={{
          backgroundColor: theme.colors.primary,
          color: '#ffffff',
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          borderRadius: theme.borderRadius.md,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Toggle Theme
      </button>
    </div>
  );
};

/**
 * Example 5: Typography scale
 */
export const ExampleTypography = () => {
  return (
    <div style={{ padding: spacing.lg }}>
      <h1 style={{ 
        fontSize: typography.fontSize['4xl'], 
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.md,
      }}>
        Heading 1
      </h1>
      <h2 style={{ 
        fontSize: typography.fontSize['3xl'], 
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing.md,
      }}>
        Heading 2
      </h2>
      <p style={{ 
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        lineHeight: typography.lineHeight.relaxed,
        marginBottom: spacing.sm,
      }}>
        Regular paragraph text with relaxed line height.
      </p>
      <p style={{ 
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
      }}>
        Small secondary text
      </p>
    </div>
  );
};

/**
 * Example 6: Spacing demonstration
 */
export const ExampleSpacing = () => {
  const boxStyle = (space: string): React.CSSProperties => ({
    backgroundColor: colors.brand.primaryLight,
    padding: space,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    display: 'inline-block',
  });

  return (
    <div style={{ padding: spacing.lg }}>
      <div style={boxStyle(spacing.xs)}>XS Padding</div>
      <div style={boxStyle(spacing.sm)}>SM Padding</div>
      <div style={boxStyle(spacing.md)}>MD Padding</div>
      <div style={boxStyle(spacing.lg)}>LG Padding</div>
      <div style={boxStyle(spacing.xl)}>XL Padding</div>
    </div>
  );
};

/**
 * Example 7: Shadow levels
 */
export const ExampleShadows = () => {
  const boxStyle = (shadow: string): React.CSSProperties => ({
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    boxShadow: shadow,
    width: '200px',
    textAlign: 'center',
  });

  return (
    <div style={{ padding: spacing.xl, display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
      <div style={boxStyle(shadows.sm)}>Small Shadow</div>
      <div style={boxStyle(shadows.md)}>Medium Shadow</div>
      <div style={boxStyle(shadows.lg)}>Large Shadow</div>
      <div style={boxStyle(shadows.xl)}>XL Shadow</div>
    </div>
  );
};

/**
 * Example 8: Animated component
 */
export const ExampleAnimated = () => {
  const animatedStyle: React.CSSProperties = {
    backgroundColor: colors.brand.primary,
    color: '#ffffff',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    transition: `all ${transitions.slow}`,
    transform: 'scale(1)',
    cursor: 'pointer',
  };

  const hoverStyle: React.CSSProperties = {
    ...animatedStyle,
    transform: 'scale(1.05)',
    boxShadow: shadows.xl,
  };

  return (
    <div
      style={animatedStyle}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, animatedStyle)}
    >
      Hover me for smooth animation!
    </div>
  );
};

/**
 * Example Component Showcase
 * Renders all examples together
 */
export const DesignSystemShowcase = () => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: spacing.xl,
      backgroundColor: colors.background.secondary,
    }}>
      <h1 style={{ 
        fontSize: typography.fontSize['4xl'], 
        marginBottom: spacing.xl,
        color: colors.text.primary,
      }}>
        CollabCanvas Design System Showcase
      </h1>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Buttons</h2>
        <ExampleButton />
      </section>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Cards</h2>
        <ExampleCard>
          <h3>Card Title</h3>
          <p>This is a card component using design system tokens.</p>
        </ExampleCard>
      </section>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Alerts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <ExampleAlert type="success">Success message!</ExampleAlert>
          <ExampleAlert type="error">Error message!</ExampleAlert>
          <ExampleAlert type="warning">Warning message!</ExampleAlert>
          <ExampleAlert type="info">Info message!</ExampleAlert>
        </div>
      </section>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Typography</h2>
        <ExampleTypography />
      </section>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Shadows</h2>
        <ExampleShadows />
      </section>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Animation</h2>
        <ExampleAnimated />
      </section>

      <section style={{ marginBottom: spacing['2xl'] }}>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing.lg }}>Theme Switching</h2>
        <ExampleThemedComponent />
      </section>
    </div>
  );
};

