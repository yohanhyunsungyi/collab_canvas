import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';
import type { CanvasShape } from '../types/canvas.types';

export interface DesignSuggestion {
  id: string;
  type: 'alignment' | 'spacing' | 'color' | 'grouping' | 'layout' | 'completeness';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedShapeIds: string[];
  changes: SuggestionChange[];
  newElements?: NewElementSuggestion[];
}

export interface SuggestionChange {
  shapeId: string;
  property: string;
  oldValue: any;
  newValue: any;
}

export interface NewElementSuggestion {
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  text?: string;
  fontSize?: number;
}

/**
 * Check if AI suggestions service is available
 */
export function isAISuggestionsAvailable(): boolean {
  return true; // Cloud Functions are always available if Firebase is configured
}

/**
 * Analyzes the current canvas state and generates design improvement suggestions
 * Uses Firebase Cloud Function for secure API access
 */
export async function analyzeCanvasDesign(shapes: CanvasShape[]): Promise<DesignSuggestion[]> {
  if (shapes.length === 0) {
    return [];
  }

  try {
    const functions = getFunctions(app);
    const analyzeDesign = httpsCallable(functions, 'analyzeDesign');
    
    const result = await analyzeDesign({ shapes });
    const data = result.data as { success: boolean; suggestions: DesignSuggestion[] };
    
    if (!data.success) {
      throw new Error('Failed to analyze design');
    }

    return data.suggestions;
  } catch (error: any) {
    console.error('Error getting design suggestions:', error);
    
    if (error.code === 'unauthenticated') {
      throw new Error('Please sign in to use AI design suggestions');
    } else if (error.code === 'failed-precondition') {
      throw new Error('AI service is not configured. Please contact support.');
    }
    
    throw error;
  }
}

