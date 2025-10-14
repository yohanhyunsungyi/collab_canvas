import { Rect, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { CanvasShape } from '../../types/canvas.types';

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
  // Handle drag move
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent event from bubbling to Stage
    const node = e.target;
    onDragMove(shape.id, node.x(), node.y());
  };

  // Handle drag end
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent event from bubbling to Stage
    const node = e.target;
    onDragEnd(shape.id, node.x(), node.y());
  };
  
  // Handle drag start
  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent event from bubbling to Stage
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
      return (
        <Text
          id={shape.id}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fontSize={shape.fontSize}
          fill={shape.color}
          ref={(node) => shapeRef(shape.id, node)}
          {...commonProps}
        />
      );

    default:
      return null;
  }
};

