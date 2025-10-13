export type ShapeType = 'rectangle' | 'circle' | 'text';

export type ToolType = 'select' | 'rectangle' | 'circle' | 'text' | 'pan';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  color: string;
  createdBy: string;
  createdAt: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
  lockedBy: string | null;
  lockedAt: number | null;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  width?: number;
  height?: number;
}

export type CanvasShape = RectangleShape | CircleShape | TextShape;

export interface CanvasState {
  shapes: CanvasShape[];
  selectedShapeId: string | null;
  currentTool: ToolType;
  loading: boolean;
  error: string | null;
}

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

