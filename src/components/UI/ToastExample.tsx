/**
 * Example component showing how to use Toast notifications with useToast hook
 * 
 * This file is for documentation purposes and not imported in the main app.
 */

import { useToast } from '../../hooks/useToast';
import { Toast } from './Toast';
import { Button } from './Button';

export const ToastExample = () => {
  const { toasts, success, error, info, dismissToast } = useToast();

  return (
    <div style={{ padding: '20px' }}>
      <h2>Toast Notifications Demo</h2>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button onClick={() => success('Successfully saved!')}>
          Show Success Toast
        </Button>
        
        <Button onClick={() => error('Something went wrong!')}>
          Show Error Toast
        </Button>
        
        <Button onClick={() => info('This is an info message')}>
          Show Info Toast
        </Button>
        
        <Button onClick={() => success('This toast lasts 5 seconds', 5000)}>
          Custom Duration (5s)
        </Button>
      </div>

      {/* Render all active toasts */}
      <div style={{ position: 'fixed', right: '16px', bottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 2000 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            durationMs={toast.duration}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Usage in other components:
 * 
 * import { useToast } from '../hooks/useToast';
 * 
 * function MyComponent() {
 *   const { success, error, info } = useToast();
 *   
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Data saved successfully!');
 *     } catch (err) {
 *       error('Failed to save data');
 *     }
 *   };
 *   
 *   return <button onClick={handleSave}>Save</button>;
 * }
 */

