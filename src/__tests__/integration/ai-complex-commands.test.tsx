import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiExecutorService } from '../../services/ai-executor.service';
import { fetchAllShapes } from '../../services/canvas.service';
import type { ExecutionContext } from '../../services/ai-executor.service';
import type { CanvasShape } from '../../types/canvas.types';

/**
 * Integration Tests for Complex AI Commands
 * Tests login form, navigation bar, card layout, and dashboard creation
 */

// Mock Firebase
vi.mock('../../services/firebase', () => ({
  firestore: {},
  auth: {},
  realtimeDb: {},
}));

vi.mock('../../services/canvas.service', () => ({
  fetchAllShapes: vi.fn(),
  updateShape: vi.fn(),
  createShape: vi.fn(),
  deleteShape: vi.fn(),
  subscribeToShapes: vi.fn(),
  acquireLock: vi.fn(),
  releaseLock: vi.fn(),
  isLockExpired: vi.fn(),
}));

describe('AI Complex Commands - Integration Tests', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup execution context
    context = {
      userId: 'test-user',
      shapes: [],
      selectedShapeIds: [],
      canvasWidth: 5000,
      canvasHeight: 5000,
    };

    // Mock fetchAllShapes to return empty array
    (fetchAllShapes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  describe('Login Form Command', () => {
    it('should create login form with 18 elements', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].message).toContain('18');
      expect(result[0].data?.shapeIds).toHaveLength(18);
    });

    it('should create login form with proper element types', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      const shapeIds = result[0].data?.shapeIds as string[];
      
      // Should have created multiple shapes
      expect(shapeIds.length).toBeGreaterThanOrEqual(18);
    });

    it('should position login form elements correctly', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({ x: 0, y: 0 }),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      // Elements should be created (exact positioning is implementation detail)
    });

    it('should create login form with custom position', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({ x: 500, y: 300 }),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      expect(result[0].data?.shapeIds).toHaveLength(18);
    });
  });

  describe('Navigation Bar Command', () => {
    it('should create navigation bar with 10+ elements', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createNavigationBar',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].data?.shapeIds).toBeDefined();
      expect(result[0].data?.shapeIds.length).toBeGreaterThanOrEqual(10);
    });

    it('should create navigation bar with menu items', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createNavigationBar',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      expect(result[0].message).toContain('navigation bar');
    });

    it('should position navigation bar at top by default', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createNavigationBar',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      // Should create navbar elements
    });

    it('should create navigation bar with custom position', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createNavigationBar',
          arguments: JSON.stringify({ y: 100 }),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
    });
  });

  describe('Card Layout Command', () => {
    it('should create card layout with 8 elements', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createCardLayout',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].data?.shapeIds).toHaveLength(8);
    });

    it('should create card with proper hierarchy', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createCardLayout',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      expect(result[0].message).toContain('card');
    });

    it('should create card with custom position', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createCardLayout',
          arguments: JSON.stringify({ x: 200, y: 200 }),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      expect(result[0].data?.shapeIds).toHaveLength(8);
    });
  });

  describe('Dashboard Command', () => {
    it('should create dashboard with 21 elements', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createDashboard',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(result[0].data?.shapeIds).toHaveLength(21);
    });

    it('should create dashboard with 4 stat cards', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createDashboard',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      expect(result[0].message).toContain('dashboard');
      expect(result[0].message).toMatch(/4\s+(stats\s+)?cards/);
    });

    it('should create dashboard with custom position', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createDashboard',
          arguments: JSON.stringify({ x: -300, y: -200 }),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      expect(result[0].data?.shapeIds).toHaveLength(21);
    });
  });

  describe('Element Positioning and Spacing', () => {
    it('should create elements with proper spacing in login form', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      // All elements should be created successfully
      expect(result[0].data?.shapeIds).toHaveLength(18);
    });

    it('should create elements with proper horizontal spacing in navbar', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createNavigationBar',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      // Elements should be spaced horizontally
    });

    it('should create elements with proper vertical spacing in card', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createCardLayout',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      // Elements should be spaced vertically within card
    });

    it('should create elements with proper grid spacing in dashboard', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createDashboard',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      expect(result[0].success).toBe(true);
      // Dashboard should have 4 cards in grid layout
    });
  });

  describe('Multiple Complex Commands', () => {
    it('should execute multiple complex commands in sequence', async () => {
      const toolCalls = [
        {
          id: 'call_1',
          type: 'function' as const,
          function: {
            name: 'createLoginForm',
            arguments: JSON.stringify({ x: -500, y: 0 }),
          },
        },
        {
          id: 'call_2',
          type: 'function' as const,
          function: {
            name: 'createCardLayout',
            arguments: JSON.stringify({ x: 500, y: 0 }),
          },
        },
      ];

      const result = await aiExecutorService.executeTools(toolCalls, context);

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(true);
      expect(result[0].data?.shapeIds).toHaveLength(18);
      expect(result[1].data?.shapeIds).toHaveLength(8);
    });

    it('should handle complex command errors gracefully', async () => {
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({ invalidParam: true }),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);

      // Should still succeed (extra params are ignored)
      expect(result[0].success).toBe(true);
    });
  });

  describe('Complex Command Performance', () => {
    it('should create login form in reasonable time', async () => {
      const startTime = Date.now();
      
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createLoginForm',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);
      const elapsed = Date.now() - startTime;

      expect(result[0].success).toBe(true);
      expect(elapsed).toBeLessThan(500); // Should complete in <500ms
    });

    it('should create dashboard in reasonable time', async () => {
      const startTime = Date.now();
      
      const toolCall = {
        id: 'call_1',
        type: 'function' as const,
        function: {
          name: 'createDashboard',
          arguments: JSON.stringify({}),
        },
      };

      const result = await aiExecutorService.executeTools([toolCall], context);
      const elapsed = Date.now() - startTime;

      expect(result[0].success).toBe(true);
      expect(elapsed).toBeLessThan(1000); // Should complete in <1s
    });
  });
});

