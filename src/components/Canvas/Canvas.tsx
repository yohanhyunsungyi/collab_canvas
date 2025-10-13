import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import type { Viewport } from '../../types/canvas.types';
import { CanvasToolbar } from './CanvasToolbar';
import { useCanvas } from '../../hooks/useCanvas';
import './Canvas.css';

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const INITIAL_SCALE = 1;
const MIN_SCALE = 0.1; // 10% zoom out
const MAX_SCALE = 3; // 300% zoom in
const SCALE_BY = 1.1; // Zoom factor per wheel tick

export const Canvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Canvas state management hook
  const {
    currentTool,
    currentColor,
    setCurrentTool,
    setCurrentColor,
    // Shape management functions (will be used in PR #4)
    // shapes, selectedShapeId, addShape, updateShape, removeShape, selectShape
  } = useCanvas();
  
  // Viewport state: position and scale
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    scale: INITIAL_SCALE,
  });

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
        onColorChange={setCurrentColor}
      />

      <div 
        className="canvas-container"
        style={{ cursor: isPanning ? 'grab' : 'default' }}
      >
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          draggable={true}
          onDragEnd={handleDragEnd}
          dragBoundFunc={handleDragBound}
          onWheel={handleWheel}
        >
          <Layer>
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
            
            {/* Shapes will be rendered here in future tasks */}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

