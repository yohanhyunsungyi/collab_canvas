import type { CanvasShape } from './canvas.types';

export type ActionType = 
  | 'create'
  | 'delete'
  | 'update'
  | 'move'
  | 'resize'
  | 'color_change'
  | 'text_update'
  | 'rotate'
  | 'duplicate';

export interface HistoryAction {
  id: string;
  type: ActionType;
  timestamp: number;
  userId: string;
  // Store before/after states for undo/redo
  beforeState?: CanvasShape[];
  afterState?: CanvasShape[];
  // Specific shape IDs affected by this action
  affectedShapeIds: string[];
}

export interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  maxStackSize: number;
}

export const DEFAULT_MAX_STACK_SIZE = 50;


