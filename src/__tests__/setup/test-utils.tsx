import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Firebase services
import './firebase-mock';

// Custom render function that includes providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Common test utilities
export const waitFor = async (callback: () => void, timeout = 3000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  throw new Error('Timeout waiting for condition');
};

// Mock user data for tests
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  color: '#FF5733',
  createdAt: Date.now(),
};

// Mock canvas shape for tests
export const mockRectangle = {
  id: 'shape-123',
  type: 'rectangle' as const,
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  color: '#3498db',
  createdBy: 'test-user-123',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user-123',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
};

export const mockCircle = {
  id: 'shape-456',
  type: 'circle' as const,
  x: 300,
  y: 200,
  radius: 75,
  color: '#e74c3c',
  createdBy: 'test-user-123',
  createdAt: Date.now(),
  lastModifiedBy: 'test-user-123',
  lastModifiedAt: Date.now(),
  lockedBy: null,
  lockedAt: null,
};

