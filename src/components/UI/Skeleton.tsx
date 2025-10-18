import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

/**
 * Skeleton loader component for displaying loading states
 * Provides multiple variants and animation options
 */
export const Skeleton = ({
  width = '100%',
  height = '20px',
  variant = 'rectangular',
  animation = 'pulse',
  className = '',
}: SkeletonProps) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const classNames = [
    'skeleton',
    `skeleton-${variant}`,
    animation !== 'none' ? `skeleton-${animation}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classNames} style={style} aria-busy="true" aria-live="polite" />;
};

interface SkeletonGroupProps {
  count?: number;
  spacing?: string | number;
  children?: React.ReactNode;
}

/**
 * Group multiple skeleton loaders with consistent spacing
 */
export const SkeletonGroup = ({ count = 3, spacing = '12px', children }: SkeletonGroupProps) => {
  const gap = typeof spacing === 'number' ? `${spacing}px` : spacing;

  return (
    <div className="skeleton-group" style={{ gap }}>
      {children
        ? children
        : Array.from({ length: count }).map((_, i) => <Skeleton key={i} />)}
    </div>
  );
};

export default Skeleton;

