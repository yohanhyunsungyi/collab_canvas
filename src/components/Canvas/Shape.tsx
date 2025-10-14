import { Rect, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { CanvasShape, RectangleShape, CircleShape, TextShape } from '../../types/canvas.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/boundaries';

interface ShapeProps {
  shape: CanvasShape;
  isSelected: boolean;
  onSelect: () => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  shapeRef: (id: string, node: Konva.Node | null) => void;
}

/**
 * Generic Shape component that renders different Konva shapes
 * based on the shape type (rectangle, circle, text)
 */
export const Shape = ({ shape, isSelected, onSelect, onDragMove, onDragEnd, shapeRef }: ShapeProps) => {
  // Handle drag start
  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
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
    // Make draggable only when selected
    draggable: isSelected,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    // Selection styling
    stroke: isSelected ? '#00bcd4' : undefined,
    strokeWidth: isSelected ? 3 : 0,
    shadowColor: isSelected ? '#00bcd4' : undefined,
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: isSelected ? 0.5 : 0,
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

