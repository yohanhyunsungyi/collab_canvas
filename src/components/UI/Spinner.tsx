import './Spinner.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
  label?: string;
  className?: string;
}

/**
 * Spinner component for loading states
 * Shows a circular loading indicator with customizable size and color
 */
export const Spinner = ({ 
  size = 'medium', 
  color = '#5B7FEE', 
  label = 'Loading...', 
  className = '' 
}: SpinnerProps) => {
  const getSizeValue = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 20;
      case 'large': return 48;
      case 'medium':
      default: return 32;
    }
  };

  const sizeValue = getSizeValue();
  const style = {
    width: `${sizeValue}px`,
    height: `${sizeValue}px`,
    borderColor: `${color}33`, // 20% opacity for background
    borderTopColor: color,
  };

  return (
    <div className={`spinner-container ${className}`} role="status">
      <div className="spinner" style={style} aria-label={label} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
};

interface SpinnerOverlayProps {
  show: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large' | number;
}

/**
 * Full-screen spinner overlay
 * Useful for blocking interactions during loading
 */
export const SpinnerOverlay = ({ show, label = 'Loading...', size = 'large' }: SpinnerOverlayProps) => {
  if (!show) return null;

  return (
    <div className="spinner-overlay">
      <Spinner size={size} label={label} />
    </div>
  );
};

export default Spinner;

