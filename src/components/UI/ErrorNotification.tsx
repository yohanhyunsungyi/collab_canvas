import { useEffect } from 'react';
import './ErrorNotification.css';

interface ErrorNotificationProps {
  message: string | null;
  onDismiss?: () => void;
  autoHideDuration?: number; // milliseconds
}

/**
 * Error notification component to display error messages
 * Auto-hides after specified duration (default: 5 seconds)
 */
export const ErrorNotification = ({
  message,
  onDismiss,
  autoHideDuration = 5000
}: ErrorNotificationProps) => {
  // Auto-hide after duration
  useEffect(() => {
    if (!message || !onDismiss) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [message, onDismiss, autoHideDuration]);

  if (!message) return null;

  return (
    <div className="error-notification">
      <div className="error-notification-content">
        <svg 
          className="error-icon" 
          viewBox="0 0 20 20" 
          fill="currentColor"
          width="20" 
          height="20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd"
          />
        </svg>
        <span className="error-message">{message}</span>
        {onDismiss && (
          <button 
            className="error-dismiss" 
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

