import { useState, useCallback } from 'react';

export interface ToastOptions {
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
  variant: 'success' | 'error' | 'info';
  duration: number;
}

let toastId = 0;

/**
 * Hook for managing toast notifications
 * Provides methods to show success, error, and info toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastId}`;
    const toast: Toast = {
      id,
      message: options.message,
      variant: options.variant || 'info',
      duration: options.duration || 3000,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => {
      return showToast({ message, variant: 'success', duration });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      return showToast({ message, variant: 'error', duration });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      return showToast({ message, variant: 'info', duration });
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    info,
  };
};

