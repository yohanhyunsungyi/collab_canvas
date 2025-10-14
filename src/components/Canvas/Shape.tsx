import { memo, useMemo } from 'react';
import { Rect, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../../types/canvas.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/boundaries';
import { isLockExpired } from '../../services/canvas.service';

interface ShapeProps {
  shape: CanvasShape;
  isSelected: boolean;
  onSelect: () => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onLockAcquire: (shapeId: string) => Promise<boolean>;
  onLockRelease: (shapeId: string) => void;
  currentUserId?: string;
  shapeRef: (id: string, node: Konva.Node | null) => void;
}

/**
 * Generic Shape component that renders different Konva shapes
 * based on the shape type (rectangle, circle, text)
 * Memoized for performance with many shapes
 */
const ShapeComponent = ({ 
  shape, 
  isSelected, 
  onSelect, 
  onDragMove, 
  onDragEnd, 
  onLockAcquire,
  onLockRelease,
  currentUserId,
  shapeRef 
}: ShapeProps): JSX.Element | null => {
  // Check if shape is locked by another user
  const isLockedByOther = shape.lockedBy && 
    shape.lockedBy !== currentUserId && 
    !isLockExpired(shape.lockedAt);

  // Handle mouse down - attempt to acquire lock
  const handleMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    // Don't allow interaction if locked by another user
    if (isLockedByOther) {
      console.log(`[Shape] Cannot interact - shape ${shape.id} is locked by ${shape.lockedBy}`);
      return;
    }
    
    // Attempt to acquire lock
    if (currentUserId) {
      await onLockAcquire(shape.id);
    }
  };

  // Handle drag start
  const handleDragStart = async (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    // Don't allow drag if locked by another user
    if (isLockedByOther) {
      e.target.stopDrag();
      return;
    }
    
    // Acquire lock on drag start
    if (currentUserId) {
      const acquired = await onLockAcquire(shape.id);
      if (!acquired) {
        e.target.stopDrag();
        return;
      }
    }
  };

  // Handle drag move with boundary constraints
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    let x = node.x();
    let y = node.y();
    
    // Apply boundary constraints based on shape type
    if (shape.type === 'rectangle') {
      const rectShape = shape as RectangleShape;
      x = Math.max(0, Math.min(x, CANVAS_WIDTH - rectShape.width));
      y = Math.max(0, Math.min(y, CANVAS_HEIGHT - rectShape.height));
    } else if (shape.type === 'circle') {
      const circleShape = shape as CircleShape;
      x = Math.max(circleShape.radius, Math.min(x, CANVAS_WIDTH - circleShape.radius));
      y = Math.max(circleShape.radius, Math.min(y, CANVAS_HEIGHT - circleShape.radius));
    } else if (shape.type === 'text') {
      // Text: constrain both starting and ending positions
      const textHeight = node.height();
      const textWidth = node.width();
      x = Math.max(0, Math.min(x, CANVAS_WIDTH - textWidth));
      y = Math.max(0, Math.min(y, CANVAS_HEIGHT - textHeight));
    }
    
    // Update node position if constrained
    if (node.x() !== x || node.y() !== y) {
      node.x(x);
      node.y(y);
    }
    
    onDragMove(shape.id, x, y);
  };

  // Handle drag end with boundary constraints
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    let x = node.x();
    let y = node.y();
    
    // Apply boundary constraints based on shape type
    if (shape.type === 'rectangle') {
      const rectShape = shape as RectangleShape;
      x = Math.max(0, Math.min(x, CANVAS_WIDTH - rectShape.width));
      y = Math.max(0, Math.min(y, CANVAS_HEIGHT - rectShape.height));
    } else if (shape.type === 'circle') {
      const circleShape = shape as CircleShape;
      x = Math.max(circleShape.radius, Math.min(x, CANVAS_WIDTH - circleShape.radius));
      y = Math.max(circleShape.radius, Math.min(y, CANVAS_HEIGHT - circleShape.radius));
    } else if (shape.type === 'text') {
      // Text: constrain both starting and ending positions
      const textHeight = node.height();
      const textWidth = node.width();
      x = Math.max(0, Math.min(x, CANVAS_WIDTH - textWidth));
      y = Math.max(0, Math.min(y, CANVAS_HEIGHT - textHeight));
    }
    
    // Update node position if constrained
    if (node.x() !== x || node.y() !== y) {
      node.x(x);
      node.y(y);
    }
    
    onDragEnd(shape.id, x, y);
  };

  // Common props for all shapes
  const commonProps = {
    onClick: onSelect,
    onTap: onSelect,
    onMouseDown: handleMouseDown,
    // Make draggable only when selected and not locked by another user
    draggable: isSelected && !isLockedByOther,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    // Selection and lock styling
    stroke: isLockedByOther ? '#ff5722' : (isSelected ? '#00bcd4' : undefined),
    strokeWidth: (isSelected || isLockedByOther) ? 3 : 0,
    shadowColor: isLockedByOther ? '#ff5722' : (isSelected ? '#00bcd4' : undefined),
    shadowBlur: (isSelected || isLockedByOther) ? 10 : 0,
    shadowOpacity: (isSelected || isLockedByOther) ? 0.5 : 0,
    // Change cursor style for locked shapes
    opacity: isLockedByOther ? 0.7 : 1,
  };

  // Render based on shape type
  switch (shape.type) {
    case 'rectangle':
      return (
        <Rect
          id={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.color}
          ref={(node) => shapeRef(shape.id, node)}
          {...commonProps}
        />
      );

    case 'circle':
      return (
        <Circle
          id={shape.id}
          x={shape.x}
          y={shape.y}
          radius={shape.radius}
          fill={shape.color}
          ref={(node) => shapeRef(shape.id, node)}
          {...commonProps}
        />
      );

    case 'text':
      const textShape = shape as TextShape;
      return (
        <Text
          id={shape.id}
          x={shape.x}
          y={shape.y}
          text={textShape.text}
          fontSize={textShape.fontSize}
          fill={shape.color}
          ref={(node) => shapeRef(shape.id, node)}
          {...commonProps}
        />
      );

    default:
      return null;
  }
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render when shape data, selection state, or lock state changes
export const Shape = memo(ShapeComponent, (prevProps, nextProps) => {
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.color === nextProps.shape.color &&
    prevProps.shape.lockedBy === nextProps.shape.lockedBy &&
    prevProps.shape.lockedAt === nextProps.shape.lockedAt &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.currentUserId === nextProps.currentUserId &&
    // Check type-specific properties
    (prevProps.shape.type !== 'rectangle' || 
      ((prevProps.shape as RectangleShape).width === (nextProps.shape as RectangleShape).width &&
       (prevProps.shape as RectangleShape).height === (nextProps.shape as RectangleShape).height)) &&
    (prevProps.shape.type !== 'circle' || 
      (prevProps.shape as CircleShape).radius === (nextProps.shape as CircleShape).radius) &&
    (prevProps.shape.type !== 'text' || 
      ((prevProps.shape as TextShape).text === (nextProps.shape as TextShape).text &&
       (prevProps.shape as TextShape).fontSize === (nextProps.shape as TextShape).fontSize))
  );
});

