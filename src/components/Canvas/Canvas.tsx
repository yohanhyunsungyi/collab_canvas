import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Viewport, RectangleShape, CircleShape, TextShape, CanvasShape } from '../../types/canvas.types';
import { CanvasToolbar } from './CanvasToolbar';
import { useCanvas } from '../../hooks/useCanvas';
import { useAuth } from '../../hooks/useAuth';
import { Shape } from './Shape';
import './Canvas.css';

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const INITIAL_SCALE = 1;
const MIN_SCALE = 0.1; // 10% zoom out
const MAX_SCALE = 3; // 300% zoom in
const SCALE_BY = 1.1; // Zoom factor per wheel tick

export const Canvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Get current user for shape creation
  const { user } = useAuth();
  
  // Canvas state management hook
  const {
    shapes,
    selectedShapeId,
    currentTool,
    currentColor,
    setCurrentTool,
    setCurrentColor,
    addShape,
    updateShape,
    selectShape,
  } = useCanvas();
  
  // Viewport state: position and scale
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    scale: INITIAL_SCALE,
  });

  // Drawing state for creating new shapes
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [previewShape, setPreviewShape] = useState<CanvasShape | null>(null);

  // Text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const [textEditPosition, setTextEditPosition] = useState<{ x: number; y: number } | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const textInputCreatedAt = useRef<number>(0);

  // Calculate boundary constraints for panning
  const getBoundaryConstraints = useCallback((scale: number) => {
    const scaledWidth = CANVAS_WIDTH * scale;
    const scaledHeight = CANVAS_HEIGHT * scale;
    
    return {
      minX: Math.min(0, containerSize.width - scaledWidth),
      maxX: 0,
      minY: Math.min(0, containerSize.height - scaledHeight),
      maxY: 0,
    };
  }, [containerSize.width, containerSize.height]);

  // Constrain position within boundaries
  const constrainPosition = useCallback((x: number, y: number, scale: number) => {
    const bounds = getBoundaryConstraints(scale);
    
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
  }, [getBoundaryConstraints]);

  // Update container size on mount and window resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.querySelector('.canvas-container');
      if (container) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        setContainerSize({
          width: newWidth,
          height: newHeight,
        });
        
        // Center the viewport on initial load
        const centerX = (newWidth / 2) - (CANVAS_WIDTH / 2);
        const centerY = (newHeight / 2) - (CANVAS_HEIGHT / 2);
        const constrained = constrainPosition(centerX, centerY, INITIAL_SCALE);
        
        setViewport({
          x: constrained.x,
          y: constrained.y,
          scale: INITIAL_SCALE,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [constrainPosition]);

  // Deselect shapes when switching away from select tool
  useEffect(() => {
    if (currentTool !== 'select' && selectedShapeId) {
      selectShape(null);
    }
  }, [currentTool, selectedShapeId, selectShape]);

  // Attach transformer to selected shape
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedShapeId) {
      const selectedNode = shapeRefs.current.get(selectedShapeId);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedShapeId]);

  // Handle spacebar key events for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Handle drag end to update viewport state with constraints
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only handle drag end for the Stage itself, not for shapes
    if (e.target !== stageRef.current) {
      return;
    }
    
    const stage = e.target as Konva.Stage;
    const constrained = constrainPosition(stage.x(), stage.y(), viewport.scale);
    
    setViewport({
      x: constrained.x,
      y: constrained.y,
      scale: viewport.scale,
    });
  };

  // Drag boundary function to prevent dragging outside canvas bounds
  const handleDragBound = (pos: { x: number; y: number }) => {
    return constrainPosition(pos.x, pos.y, viewport.scale);
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;

    // Calculate new scale based on wheel direction
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, oldScale * (direction > 0 ? SCALE_BY : 1 / SCALE_BY))
    );

    // No change if scale is at limits
    if (newScale === oldScale) return;

    // Calculate the point in canvas coordinates that the mouse is over
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    // Calculate new position to keep the mouse point at the same canvas position
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // Apply boundary constraints to new position
    const constrained = constrainPosition(newPos.x, newPos.y, newScale);

    setViewport({
      x: constrained.x,
      y: constrained.y,
      scale: newScale,
    });
  };

  // Get canvas coordinates from pointer position
  const getCanvasPointer = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    
    // Convert screen coordinates to canvas coordinates
    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };
  };

  // Handle mouse down for shape creation and selection
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    // If there's an active text input, save it first before handling any other action
    if (isEditingText) {
      handleTextComplete(true); // Force complete to bypass the 200ms check
      // Don't process the click further - just save the text
      return;
    }
    
    // Handle select tool - click to select shapes or deselect
    if (currentTool === 'select') {
      if (clickedOnEmpty) {
        // Clicked on empty canvas - deselect all
        selectShape(null);
      }
      // If clicked on a shape, the Shape component's onSelect will handle it
      return;
    }
    
    // Handle text tool - click to place text input
    if (currentTool === 'text') {
      // Only create text on empty canvas
      if (!clickedOnEmpty) return;
      
      const pointer = getCanvasPointer();
      if (!pointer) return;
      
      // Convert canvas coordinates to screen coordinates for input positioning
      const screenX = pointer.x * viewport.scale + viewport.x;
      const screenY = pointer.y * viewport.scale + viewport.y;
      
      // Track when input is created to prevent immediate blur
      textInputCreatedAt.current = Date.now();
      
      setIsEditingText(true);
      setTextEditPosition({ x: screenX, y: screenY });
      setTextEditValue('');
      
      // Focus input after state update with a slight delay
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
      
      return;
    }
    
    // Only handle drawing tools (rectangle, circle) if clicked on empty canvas
    if (currentTool !== 'rectangle' && currentTool !== 'circle') return;
    
    // Don't start drawing if panning mode is active
    if (isSpacePressed || isPanning) return;
    
    // Only start drawing on empty canvas
    if (!clickedOnEmpty) return;
    
    const pointer = getCanvasPointer();
    if (!pointer) return;
    
    setIsDrawing(true);
    setStartPoint(pointer);
  };

  // Handle mouse move for shape preview
  const handleStageMouseMove = () => {
    if (!isDrawing || !startPoint) return;
    if (currentTool !== 'rectangle' && currentTool !== 'circle') return;
    
    const pointer = getCanvasPointer();
    if (!pointer || !user) return;
    
    if (currentTool === 'rectangle') {
      // Calculate rectangle dimensions
      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;
      
      // Create rectangle preview
      const preview: RectangleShape = {
        id: 'preview',
        type: 'rectangle',
        x: width > 0 ? startPoint.x : pointer.x,
        y: height > 0 ? startPoint.y : pointer.y,
        width: Math.abs(width),
        height: Math.abs(height),
        color: currentColor,
        createdBy: user.id,
        createdAt: Date.now(),
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };
      
      setPreviewShape(preview);
    } else if (currentTool === 'circle') {
      // Calculate radius from distance between start point and current pointer
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Create circle preview
      const preview: CircleShape = {
        id: 'preview',
        type: 'circle',
        x: startPoint.x,
        y: startPoint.y,
        radius,
        color: currentColor,
        createdBy: user.id,
        createdAt: Date.now(),
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };
      
      setPreviewShape(preview);
    }
  };

  // Handle mouse up to finish shape creation
  const handleStageMouseUp = () => {
    if (!isDrawing || !startPoint) return;
    if (currentTool !== 'rectangle' && currentTool !== 'circle') return;
    
    const pointer = getCanvasPointer();
    if (!pointer || !user) return;
    
    if (currentTool === 'rectangle') {
      // Calculate rectangle dimensions
      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;
      
      // Only create shape if it has meaningful size (at least 5px)
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        const newShape: RectangleShape = {
          id: `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'rectangle',
          x: width > 0 ? startPoint.x : pointer.x,
          y: height > 0 ? startPoint.y : pointer.y,
          width: Math.abs(width),
          height: Math.abs(height),
          color: currentColor,
          createdBy: user.id,
          createdAt: Date.now(),
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        };
        
        addShape(newShape);
      }
    } else if (currentTool === 'circle') {
      // Calculate radius from distance between start point and current pointer
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Only create shape if it has meaningful size (at least 5px radius)
      if (radius > 5) {
        const newShape: CircleShape = {
          id: `circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'circle',
          x: startPoint.x,
          y: startPoint.y,
          radius,
          color: currentColor,
          createdBy: user.id,
          createdAt: Date.now(),
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        };
        
        addShape(newShape);
      }
    }
    
    // Reset drawing state
    setIsDrawing(false);
    setStartPoint(null);
    setPreviewShape(null);
  };

  // Handle text input completion
  const handleTextComplete = (forceComplete = false) => {
    if (!isEditingText || !textEditPosition || !user) return;
    
    // Prevent immediate blur after input creation (within 200ms)
    // But allow forced completion (when called explicitly from click)
    if (!forceComplete) {
      const timeSinceCreation = Date.now() - textInputCreatedAt.current;
      if (timeSinceCreation < 200) {
        // Input was just created, ignore this blur event
        // Refocus the input
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 0);
        return;
      }
    }
    
    const trimmedText = textEditValue.trim();
    
    // Only create text shape if user entered something
    if (trimmedText.length > 0) {
      // Convert screen coordinates back to canvas coordinates
      const canvasX = (textEditPosition.x - viewport.x) / viewport.scale;
      const canvasY = (textEditPosition.y - viewport.y) / viewport.scale;
      
      const newShape: TextShape = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        x: canvasX,
        y: canvasY,
        text: trimmedText,
        fontSize: 24,
        color: currentColor,
        createdBy: user.id,
        createdAt: Date.now(),
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
        lockedBy: null,
        lockedAt: null,
      };
      
      addShape(newShape);
    }
    
    // Reset text editing state
    setIsEditingText(false);
    setTextEditPosition(null);
    setTextEditValue('');
  };

  // Handle text input blur (de-focus)
  const handleTextBlur = () => {
    handleTextComplete(false); // Use normal blur behavior with 200ms check
  };

  // Handle text input key press
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextComplete(true); // Force complete on Enter
    } else if (e.key === 'Escape') {
      // Cancel text editing
      setIsEditingText(false);
      setTextEditPosition(null);
      setTextEditValue('');
    }
  };

  // Constrain shape position within canvas boundaries
  const constrainShapePosition = (shape: CanvasShape, x: number, y: number) => {
    let constrainedX = x;
    let constrainedY = y;

    if (shape.type === 'rectangle') {
      // Constrain rectangle
      constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH - shape.width));
      constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - shape.height));
    } else if (shape.type === 'circle') {
      // Constrain circle (center must stay radius distance from edges)
      constrainedX = Math.max(shape.radius, Math.min(x, CANVAS_WIDTH - shape.radius));
      constrainedY = Math.max(shape.radius, Math.min(y, CANVAS_HEIGHT - shape.radius));
    } else if (shape.type === 'text') {
      // Constrain text (approximate height by fontSize)
      const textHeight = shape.fontSize * 1.2; // Approximate line height
      constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH));
      constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - textHeight));
    }

    return { x: constrainedX, y: constrainedY };
  };

  // Handle shape drag move (live update during drag)
  const handleShapeDragMove = (id: string, x: number, y: number) => {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    const constrained = constrainShapePosition(shape, x, y);
    updateShape(id, constrained);
  };

  // Handle shape drag end (final position)
  const handleShapeDragEnd = (id: string, x: number, y: number) => {
    if (!user) return;
    
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    const constrained = constrainShapePosition(shape, x, y);
    updateShape(id, {
      ...constrained,
      lastModifiedBy: user.id,
      lastModifiedAt: Date.now(),
    });
  };

  // Handle shape transform (resize/scale)
  const handleTransform = () => {
    if (!selectedShapeId) return;
    
    const node = shapeRefs.current.get(selectedShapeId);
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply scale to dimensions
    node.scaleX(1);
    node.scaleY(1);

    const shape = shapes.find((s) => s.id === selectedShapeId);
    if (!shape) return;

    const nodeX = node.x();
    const nodeY = node.y();

    // Update dimensions based on shape type with boundary constraints
    if (shape.type === 'rectangle') {
      let width = Math.max(5, node.width() * scaleX);
      let height = Math.max(5, node.height() * scaleY);
      
      // Constrain width and height to stay within canvas
      width = Math.min(width, CANVAS_WIDTH - nodeX);
      height = Math.min(height, CANVAS_HEIGHT - nodeY);
      
      // Update node dimensions for Transformer
      node.width(width);
      node.height(height);
      
      updateShape(selectedShapeId, {
        x: nodeX,
        y: nodeY,
        width,
        height,
      });
    } else if (shape.type === 'circle') {
      // For circles, use the average of scaleX and scaleY
      let newRadius = Math.max(5, shape.radius * ((scaleX + scaleY) / 2));
      
      // Constrain radius to stay within canvas
      const maxRadiusX = Math.min(nodeX, CANVAS_WIDTH - nodeX);
      const maxRadiusY = Math.min(nodeY, CANVAS_HEIGHT - nodeY);
      newRadius = Math.min(newRadius, maxRadiusX, maxRadiusY);
      
      updateShape(selectedShapeId, {
        x: nodeX,
        y: nodeY,
        radius: newRadius,
      });
    } else if (shape.type === 'text') {
      let width = Math.max(20, node.width() * scaleX);
      let fontSize = Math.max(8, shape.fontSize * scaleY);
      
      // Constrain text size to stay within canvas
      const textHeight = fontSize * 1.2;
      if (nodeY + textHeight > CANVAS_HEIGHT) {
        fontSize = Math.max(8, (CANVAS_HEIGHT - nodeY) / 1.2);
      }
      
      // Update node dimensions for Transformer
      node.width(width);
      
      updateShape(selectedShapeId, {
        x: nodeX,
        y: nodeY,
        width,
        fontSize,
      });
    }
  };

  // Handle transform end (resize complete)
  const handleTransformEnd = () => {
    if (!user || !selectedShapeId) return;
    
    updateShape(selectedShapeId, {
      lastModifiedBy: user.id,
      lastModifiedAt: Date.now(),
    });
  };

  // Handle color change - update current color and selected shape color
  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    
    // If a shape is selected, update its color
    if (selectedShapeId && user) {
      updateShape(selectedShapeId, {
        color,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
    }
  };

  // Register shape ref for transformer
  const setShapeRef = (id: string, node: Konva.Node | null) => {
    if (node) {
      shapeRefs.current.set(id, node);
    } else {
      shapeRefs.current.delete(id);
    }
  };

  return (
    <div className="canvas-wrapper">
      <header className="canvas-header">
        <h1>CollabCanvas</h1>
        <div className="canvas-info">
          Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px | 
          Zoom: {Math.round(viewport.scale * 100)}% |
          Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})
          {isSpacePressed && ' | 🖐️ Pan Mode'}
        </div>
      </header>

      <CanvasToolbar
        currentTool={currentTool}
        currentColor={currentColor}
        onToolChange={setCurrentTool}
        onColorChange={handleColorChange}
      />

      <div 
        className="canvas-container"
        style={{ 
          cursor: isPanning ? 'grab' : 
                  currentTool === 'text' ? 'text' : 
                  currentTool === 'select' ? 'default' : 
                  'crosshair' 
        }}
      >
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          draggable={isSpacePressed || currentTool === 'pan'}
          onDragEnd={handleDragEnd}
          dragBoundFunc={handleDragBound}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            {/* Gray out area outside canvas bounds */}
            {/* Top gray area */}
            <Rect
              x={-10000}
              y={-10000}
              width={25000}
              height={10000}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            {/* Bottom gray area */}
            <Rect
              x={-10000}
              y={CANVAS_HEIGHT}
              width={25000}
              height={10000}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            {/* Left gray area */}
            <Rect
              x={-10000}
              y={0}
              width={10000}
              height={CANVAS_HEIGHT}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            {/* Right gray area */}
            <Rect
              x={CANVAS_WIDTH}
              y={0}
              width={10000}
              height={CANVAS_HEIGHT}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            
            {/* Canvas boundary rectangle - visual indicator */}
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              stroke="#ff0000"
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
            
            {/* Render all shapes */}
            {shapes.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                onSelect={() => {
                  // Only allow selection when using select tool
                  if (currentTool === 'select') {
                    selectShape(shape.id);
                  }
                }}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                shapeRef={setShapeRef}
              />
            ))}

            {/* Transformer for resizing selected shapes */}
            <Transformer
              ref={transformerRef}
              onTransform={handleTransform}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize to minimum dimensions
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                
                // Constrain within canvas boundaries
                const maxWidth = CANVAS_WIDTH - newBox.x;
                const maxHeight = CANVAS_HEIGHT - newBox.y;
                
                if (newBox.width > maxWidth || newBox.height > maxHeight) {
                  return {
                    ...newBox,
                    width: Math.min(newBox.width, maxWidth),
                    height: Math.min(newBox.height, maxHeight),
                  };
                }
                
                return newBox;
              }}
            />
            
            {/* Render preview shape while drawing */}
            {previewShape && previewShape.type === 'rectangle' && (
              <Rect
                x={previewShape.x}
                y={previewShape.y}
                width={previewShape.width}
                height={previewShape.height}
                fill={previewShape.color}
                opacity={0.5}
                listening={false}
              />
            )}
            {previewShape && previewShape.type === 'circle' && (
              <Circle
                x={previewShape.x}
                y={previewShape.y}
                radius={previewShape.radius}
                fill={previewShape.color}
                opacity={0.5}
                listening={false}
              />
            )}
          </Layer>
        </Stage>

        {/* Text input overlay for text creation */}
        {isEditingText && textEditPosition && (
          <input
            ref={textInputRef}
            type="text"
            value={textEditValue}
            onChange={(e) => setTextEditValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            onBlur={handleTextBlur}
            style={{
              position: 'absolute',
              left: `${textEditPosition.x}px`,
              top: `${textEditPosition.y}px`,
              fontSize: `${24 * viewport.scale}px`,
              color: currentColor,
              backgroundColor: 'transparent',
              border: '2px solid #00bcd4',
              outline: 'none',
              padding: '2px 4px',
              fontFamily: 'Arial, sans-serif',
              minWidth: '100px',
              zIndex: 1000,
            }}
            autoFocus
          />
        )}
      </div>
    </div>
  );
};

