import { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  variant?: 'error' | 'success' | 'info';
  onDismiss: () => void;
  durationMs?: number;
  placement?: 'fixed' | 'inline';
}

export const Toast = ({ message, variant = 'info', onDismiss, durationMs = 3000, placement = 'fixed' }: ToastProps) => {
  useEffect(() => {
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [onDismiss, durationMs]);

  return (
    <div className={`toast ${placement === 'inline' ? 'toast-inline' : ''} toast-${variant}`} role="status" aria-live="polite">
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
};

export default Toast;


