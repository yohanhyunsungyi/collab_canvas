import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Viewport, RectangleShape, CircleShape, TextShape, CanvasShape } from '../../types/canvas.types';
import { CanvasToolbar } from './CanvasToolbar';
import { useCanvas } from '../../hooks/useCanvas';
import { useAuth } from '../../hooks/useAuth';
import { useCursors } from '../../hooks/useCursors';
import { Shape } from './Shape';
import { Grid } from './Grid';
import { SelectionBox } from './SelectionBox';
import { MultiplayerCursors } from './MultiplayerCursors';
// Removed sidebar; presence is now displayed in top bar
import { ErrorNotification } from '../UI/ErrorNotification';
import { ConnectionStatus } from '../UI/ConnectionStatus';
import { PresenceMenu } from '../Presence/PresenceMenu';
import { fetchAllShapes, subscribeToShapes, acquireLock, releaseLock, isLockExpired } from '../../services/canvas.service';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  getTransformerBoundBoxFunc,
  constrainRectangleDimensions,
  constrainCircleRadius,
  constrainShapeCreation,
  constrainPoint,
} from '../../utils/boundaries';
import './Canvas.css';
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
    const { user, logout } = useAuth();
  
  // Canvas state management hook
  const {
    shapes,
    selectedShapeIds,
    currentTool,
    currentColor,
    currentFontSize,
    error: canvasError,
    clearError: clearCanvasError,
    setCurrentTool,
    setCurrentColor,
    setCurrentFontSize,
    addShape,
    updateShape,
    removeShape,
    selectShape,
    toggleShapeSelection,
    clearSelection,
    selectShapesInArea,
    duplicateSelectedShapes,
    setShapes,
    applyShapeChanges,
  } = useCanvas();
  
  // Multiplayer cursors hook
  const { cursors, updateOwnCursor, error: cursorsError } = useCursors();
  
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

  // Drag selection state
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [dragSelectEnd, setDragSelectEnd] = useState<{ x: number; y: number } | null>(null);

  // Group drag state - for moving multiple shapes together
  const [groupDragInitialPositions, setGroupDragInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);

  // Text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const [textEditPosition, setTextEditPosition] = useState<{ x: number; y: number } | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  const [editingTextId, setEditingTextId] = useState<string | null>(null); // For editing existing text
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const textInputCreatedAt = useRef<number>(0);

  // Effect for loading shapes from Firestore and subscribing to real-time updates
  useEffect(() => {
    let isInitialLoad = true;
    
    // Initial load: fetch all shapes
    fetchAllShapes()
      .then((allShapes) => {
        console.log(`[Canvas] Initial load: ${allShapes.length} shapes`);
        setShapes(allShapes);
      })
      .catch((error) => {
        console.error('[Canvas] Failed to load initial shapes:', error);
      });
    
    // Subscribe to real-time changes
    const unsubscribe = subscribeToShapes((changes) => {
      // Skip the first onSnapshot callback which contains all existing documents
      // (we already loaded them via fetchAllShapes)
      if (isInitialLoad) {
        isInitialLoad = false;
        console.log('[Canvas] Skipping initial snapshot (already loaded)');
        return;
      }
      
      console.log(`[Canvas] Applying ${changes.length} real-time changes`);
      applyShapeChanges(changes);
    });

    // Unsubscribe on component unmount
    return () => {
      unsubscribe();
    };
  }, [setShapes, applyShapeChanges]);

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
    if (currentTool !== 'select' && selectedShapeIds.length > 0) {
      clearSelection();
    }
  }, [currentTool, selectedShapeIds.length, clearSelection]);

  // Attach transformer to selected shape(s)
  // Note: Transformer only works on single shape, so we only show it when one shape is selected
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedShapeIds.length === 1) {
      const selectedNode = shapeRefs.current.get(selectedShapeIds[0]);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedShapeIds]);

  // Handle keyboard events for pan mode and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger keyboard shortcuts while editing text or if target is an input
      const target = e.target as HTMLElement;
      const isInputTarget = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Handle Delete/Backspace key to delete selected shape(s)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputTarget && !isEditingText) {
        e.preventDefault();
        if (selectedShapeIds.length > 0) {
          console.log('[Canvas] Deleting shapes:', selectedShapeIds);
          selectedShapeIds.forEach(id => removeShape(id));
        }
        return;
      }
      
      // Handle Cmd/Ctrl+D to duplicate selected shape(s)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isInputTarget && !isEditingText) {
        e.preventDefault();
        if (selectedShapeIds.length > 0 && user) {
          console.log('[Canvas] Duplicating shapes:', selectedShapeIds);
          duplicateSelectedShapes(user.id);
        }
        return;
      }
      
      // Handle spacebar for pan mode
      if (e.code === 'Space' && !isSpacePressed && !isEditingText && !isInputTarget) {
        e.preventDefault();
        setIsSpacePressed(true);
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputTarget = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (e.code === 'Space' && isSpacePressed && !isInputTarget) {
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
  }, [isSpacePressed, isEditingText, selectedShapeIds, removeShape, duplicateSelectedShapes, user]);

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
  // Uses Konva's getRelativePointerPosition which automatically handles Stage transform
  const getCanvasPointer = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    
    const pointer = stage.getRelativePointerPosition();
    if (!pointer) return null;
    
    // getRelativePointerPosition already accounts for stage position and scale
    return {
      x: pointer.x,
      y: pointer.y,
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
        // Clicked on empty canvas
        if (!e.evt.shiftKey) {
          // Start drag-to-select if not shift-clicking
          const pointer = getCanvasPointer();
          if (pointer && !isPanning && !isSpacePressed) {
            setIsDragSelecting(true);
            setDragSelectStart(pointer);
            setDragSelectEnd(pointer);
          } else if (!isPanning && !isSpacePressed) {
            // Just clear selection if we can't get pointer
            clearSelection();
          }
        }
      }
      // If clicked on a shape, the Shape component's onSelect will handle it
      return;
    }
    
    // Handle text tool - click to place text input
    if (currentTool === 'text') {
      // Don't create text input while panning
      if (isPanning || isSpacePressed) return;
      
      // Only create text on empty canvas
      if (!clickedOnEmpty) return;
      
      const canvasPointer = getCanvasPointer();
      if (!canvasPointer) return;
      
      // Convert canvas coordinates to screen coordinates for input positioning
      const stage = stageRef.current;
      if (!stage) return;
      
      // canvasPointer is in canvas coordinates (0~5000)
      // Convert to screen coordinates relative to canvas-container (position: relative)
      // No need to add stageBox offset since input is inside canvas-container
      const screenX = canvasPointer.x * viewport.scale + viewport.x;
      const screenY = canvasPointer.y * viewport.scale + viewport.y;
      
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
    // Update cursor position for multiplayer cursors
    const pointer = getCanvasPointer();
    if (pointer) {
      updateOwnCursor(pointer.x, pointer.y);
    }
    
    // Handle drag-to-select
    if (isDragSelecting && dragSelectStart && pointer) {
      setDragSelectEnd(pointer);
      return;
    }
    
    if (!isDrawing || !startPoint) return;
    if (currentTool !== 'rectangle' && currentTool !== 'circle') return;
    
    if (!pointer || !user) return;
    
    if (currentTool === 'rectangle') {
      // Calculate rectangle dimensions
      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;
      const rawX = width > 0 ? startPoint.x : pointer.x;
      const rawY = height > 0 ? startPoint.y : pointer.y;
      const rawWidth = Math.abs(width);
      const rawHeight = Math.abs(height);
      
      // Apply boundary constraints for preview
      const constrained = constrainShapeCreation('rectangle', rawX, rawY, rawWidth, rawHeight);
      
      // Create rectangle preview
      const preview: RectangleShape = {
        id: 'preview',
        type: 'rectangle',
        x: constrained.x,
        y: constrained.y,
        width: constrained.width ?? rawWidth,
        height: constrained.height ?? rawHeight,
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
      
      // Apply boundary constraints for preview
      const constrained = constrainShapeCreation('circle', startPoint.x, startPoint.y, undefined, undefined, radius);
      
      // Create circle preview
      const preview: CircleShape = {
        id: 'preview',
        type: 'circle',
        x: constrained.x,
        y: constrained.y,
        radius: constrained.radius ?? radius,
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
    // Handle drag-to-select completion
    if (isDragSelecting && dragSelectStart && dragSelectEnd) {
      // Select all shapes within the drag rectangle
      selectShapesInArea(dragSelectStart.x, dragSelectStart.y, dragSelectEnd.x, dragSelectEnd.y);
      
      // Reset drag selection state
      setIsDragSelecting(false);
      setDragSelectStart(null);
      setDragSelectEnd(null);
      return;
    }
    
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
        const rawX = width > 0 ? startPoint.x : pointer.x;
        const rawY = height > 0 ? startPoint.y : pointer.y;
        const rawWidth = Math.abs(width);
        const rawHeight = Math.abs(height);
        
        // Apply boundary constraints
        const constrained = constrainShapeCreation('rectangle', rawX, rawY, rawWidth, rawHeight);
        
        const newShapeData = {
          type: 'rectangle' as const,
          x: constrained.x,
          y: constrained.y,
          width: constrained.width ?? rawWidth,
          height: constrained.height ?? rawHeight,
          color: currentColor,
        };
        
        addShape(newShapeData, user.id);
      }
    } else if (currentTool === 'circle') {
      // Calculate radius from distance between start point and current pointer
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Only create shape if it has meaningful size (at least 5px radius)
      if (radius > 5) {
        // Apply boundary constraints
        const constrained = constrainShapeCreation('circle', startPoint.x, startPoint.y, undefined, undefined, radius);
        
        const newShapeData = {
          type: 'circle' as const,
          x: constrained.x,
          y: constrained.y,
          radius: constrained.radius ?? radius,
          color: currentColor,
        };
        
        addShape(newShapeData, user.id);
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
    
    // Only create/update text shape if user entered something
    if (trimmedText.length > 0) {
      if (editingTextId) {
        // Update existing text
        updateShape(editingTextId, {
          text: trimmedText,
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
        });
      } else {
        // Creating new text: convert screen coordinates back to canvas coordinates
        // Note: For existing text edit, we don't need this conversion
        if (!stageRef.current) return;
        
        const stageBox = stageRef.current.container().getBoundingClientRect();
        const canvasX = (textEditPosition.x - stageBox.left - viewport.x) / viewport.scale;
        const canvasY = (textEditPosition.y - stageBox.top - viewport.y) / viewport.scale;
        
        // Apply boundary constraints
        const constrained = constrainPoint(canvasX, canvasY);
        
        const newShapeData = {
          type: 'text' as const,
          x: constrained.x,
          y: constrained.y,
          text: trimmedText,
          fontSize: currentFontSize,
          color: currentColor,
        };
        
        addShape(newShapeData, user.id);
      }
    }
    
    // Reset text editing state
    setIsEditingText(false);
    setTextEditPosition(null);
    setTextEditValue('');
    setEditingTextId(null);
  };

  // Handle text input blur (de-focus)
  const handleTextBlur = () => {
    handleTextComplete(false); // Use normal blur behavior with 200ms check
  };

  // Handle text input key press
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without shift: complete editing
      e.preventDefault();
      handleTextComplete(true); // Force complete on Enter
    } else if (e.key === 'Escape') {
      // Cancel text editing
      setIsEditingText(false);
      setTextEditPosition(null);
      setTextEditValue('');
      setEditingTextId(null);
    }
    // Shift+Enter: allow new line in textarea
  };

  // Handle double-click on text shape to edit
  const handleTextDoubleClick = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.type !== 'text') return;
    
    // Check if locked by another user
    if (shape.lockedBy && shape.lockedBy !== user?.id && !isLockExpired(shape.lockedAt)) {
      console.log(`[Canvas] Cannot edit - text ${shapeId} is locked by ${shape.lockedBy}`);
      return;
    }
    
    console.log('[Canvas] Double-click on text, entering edit mode:', shapeId);
    
    if (!stageRef.current) return;
    
    // Get the Konva node reference for this text shape
    const textNode = shapeRefs.current.get(shapeId);
    if (!textNode) {
      console.warn('[Canvas] Text node not found in refs');
      return;
    }
    
    // Use Konva's absolutePosition() method (best practice)
    // This handles all transformations (scale, rotation, parent transforms) automatically
    const textPosition = textNode.absolutePosition();
    
    // Get the stage container's position on the page
    const stageBox = stageRef.current.container().getBoundingClientRect();
    
    // Calculate absolute position on the page
    // Following Konva best practices: https://konvajs.org/docs/sandbox/Editable_Text.html
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };
    
    console.log('[Canvas] Text edit position:', {
      canvasPos: { x: shape.x, y: shape.y },
      absolutePos: textPosition,
      stageBox: { left: stageBox.left, top: stageBox.top },
      finalPos: areaPosition
    });
    
    // Set editing state with absolute position
    setEditingTextId(shapeId);
    setTextEditValue(shape.text);
    setTextEditPosition(areaPosition);
    setIsEditingText(true);
    textInputCreatedAt.current = Date.now();
    
    // Focus the input after a short delay
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select(); // Select all text for easy replacement
    }, 10);
  }, [shapes, user]);

  // Handle lock acquisition
  const handleLockAcquire = useCallback(async (shapeId: string) => {
    if (!user) return false;
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return false;
    
    // Check if already locked by another user
    if (shape.lockedBy && shape.lockedBy !== user.id) {
      // Check if lock has expired
      if (!isLockExpired(shape.lockedAt)) {
        console.log(`[Canvas] Cannot interact - shape ${shapeId} is locked by ${shape.lockedBy}`);
        return false;
      }
    }
    
    // Attempt to acquire lock
    const acquired = await acquireLock(shapeId, user.id);
    if (acquired) {
      console.log(`[Canvas] Lock acquired on shape ${shapeId}`);
    }
    return acquired;
  }, [user, shapes]);

  // Handle lock release
  const handleLockRelease = useCallback(async (shapeId: string) => {
    if (!user) return;
    
    await releaseLock(shapeId, user.id);
    console.log(`[Canvas] Lock released on shape ${shapeId}`);
  }, [user]);

  // Effect to handle lock release when selection changes
  useEffect(() => {
    // Create a ref to track the previous selected shape
    let prevSelectedShapeId: string | null = null;
    
    return () => {
      // Cleanup: release lock when component unmounts
      if (prevSelectedShapeId) {
        handleLockRelease(prevSelectedShapeId);
      }
    };
  }, []);

  // Effect to manage lock when selection changes
  useEffect(() => {
    const manageLocks = async () => {
      // Get previous selection from local state tracking
      const prevSelectedShapeIds = (window as any).__prevSelectedShapeIds || [];
      
      // Find shapes that were deselected and release their locks
      const deselected = prevSelectedShapeIds.filter((id: string) => !selectedShapeIds.includes(id));
      for (const id of deselected) {
        await handleLockRelease(id);
      }
      
      // Track current selection globally for next comparison
      (window as any).__prevSelectedShapeIds = selectedShapeIds;
    };
    
    manageLocks();
  }, [selectedShapeIds, handleLockRelease]);

  // Handle shape drag move (live update during drag)
  // Note: Position constraints are handled by dragBoundFunc in Shape component
  const handleShapeDragMove = useCallback((id: string, x: number, y: number) => {
    // Check if this is part of a multi-selection
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(id)) {
      // Initialize group drag if not already initialized
      let initialPositionsMap = groupDragInitialPositions;
      
      if (!isDraggingGroup) {
        // Store initial positions of all selected shapes
        const initialPositions = new Map<string, { x: number; y: number }>();
        shapes.forEach(shape => {
          if (selectedShapeIds.includes(shape.id)) {
            initialPositions.set(shape.id, { x: shape.x, y: shape.y });
          }
        });
        setGroupDragInitialPositions(initialPositions);
        setIsDraggingGroup(true);
        // Use the newly created map immediately instead of waiting for state update
        initialPositionsMap = initialPositions;
      }

      // Get the initial position of the dragged shape
      const draggedShapeInitial = initialPositionsMap.get(id);
      if (draggedShapeInitial) {
        // Calculate delta from initial position
        const deltaX = x - draggedShapeInitial.x;
        const deltaY = y - draggedShapeInitial.y;

        // Apply the same delta to all selected shapes
        selectedShapeIds.forEach(shapeId => {
          const initialPos = initialPositionsMap.get(shapeId);
          if (initialPos) {
            const newX = initialPos.x + deltaX;
            const newY = initialPos.y + deltaY;
            updateShape(shapeId, { x: newX, y: newY });
          }
        });
      }
    } else {
      // Single shape drag
      updateShape(id, { x, y });
    }
  }, [updateShape, selectedShapeIds, isDraggingGroup, groupDragInitialPositions, shapes]);

  // Handle shape drag end (final position)
  // Note: Position constraints are handled by dragBoundFunc in Shape component
  const handleShapeDragEnd = useCallback((id: string, x: number, y: number) => {
    if (!user) return;
    
    // Check if this was a group drag
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(id)) {
      // Get the initial position of the dragged shape
      const draggedShapeInitial = groupDragInitialPositions.get(id);
      if (draggedShapeInitial) {
        // Calculate final delta
        const deltaX = x - draggedShapeInitial.x;
        const deltaY = y - draggedShapeInitial.y;

        // Update all selected shapes with final positions and metadata
        selectedShapeIds.forEach(shapeId => {
          const initialPos = groupDragInitialPositions.get(shapeId);
          if (initialPos) {
            const finalX = initialPos.x + deltaX;
            const finalY = initialPos.y + deltaY;
            updateShape(shapeId, {
              x: finalX,
              y: finalY,
              lastModifiedBy: user.id,
              lastModifiedAt: Date.now(),
            });
          }
          // Release lock for each shape
          handleLockRelease(shapeId);
        });
      }

      // Reset group drag state
      setIsDraggingGroup(false);
      setGroupDragInitialPositions(new Map());
    } else {
      // Single shape drag end
      updateShape(id, {
        x,
        y,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
      
      // Release lock after drag ends
      handleLockRelease(id);
    }
  }, [user, updateShape, handleLockRelease, selectedShapeIds, groupDragInitialPositions]);

  // Handle transform start - acquire lock when starting to resize (if not already locked)
  const handleTransformStart = useCallback(async () => {
    if (selectedShapeIds.length !== 1 || !user) return;
    
    const shapeId = selectedShapeIds[0];
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    // Only acquire lock if not already locked by current user
    if (!shape.lockedBy || shape.lockedBy !== user.id) {
      await handleLockAcquire(shapeId);
    }
  }, [selectedShapeIds, user, shapes, handleLockAcquire]);

  // Handle shape transform (resize/scale)
  // Uses centralized boundary constraint functions from boundaries.ts
  const handleTransform = () => {
    if (selectedShapeIds.length !== 1) return;
    
    const shapeId = selectedShapeIds[0];
    const node = shapeRefs.current.get(shapeId);
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply scale to dimensions
    node.scaleX(1);
    node.scaleY(1);

    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    const nodeX = node.x();
    const nodeY = node.y();

    // Update dimensions based on shape type with boundary constraints
    if (shape.type === 'rectangle') {
      const rawWidth = Math.max(5, node.width() * scaleX);
      const rawHeight = Math.max(5, node.height() * scaleY);
      
      // Use centralized constraint function
      const { width, height } = constrainRectangleDimensions(nodeX, nodeY, rawWidth, rawHeight);
      
      // Update node dimensions for Transformer
      node.width(width);
      node.height(height);
      
      updateShape(shapeId, {
        x: nodeX,
        y: nodeY,
        width,
        height,
      });
    } else if (shape.type === 'circle') {
      // For circles, always use original shape radius as base to avoid accumulation
      const rawRadius = Math.max(5, shape.radius * ((scaleX + scaleY) / 2));
      
      // Check if circle with new radius would exceed canvas boundaries
      const boundingBoxX = nodeX - rawRadius;
      const boundingBoxY = nodeY - rawRadius;
      const boundingBoxWidth = rawRadius * 2;
      const boundingBoxHeight = rawRadius * 2;
      
      const isOut = 
        boundingBoxX < 0 ||
        boundingBoxY < 0 ||
        boundingBoxX + boundingBoxWidth > CANVAS_WIDTH ||
        boundingBoxY + boundingBoxHeight > CANVAS_HEIGHT;
      
      // If new size would exceed boundaries, keep the old radius and position
      if (isOut) {
        // Reset scale to prevent further attempts
        node.scaleX(1);
        node.scaleY(1);
        // Reset position to previous position (stop movement)
        node.x(shape.x);
        node.y(shape.y);
        return;
      }
      
      // Use centralized constraint function
      const radius = constrainCircleRadius(nodeX, nodeY, rawRadius);
      
      // Update node dimensions for Transformer
      // Circle needs both radius and width/height for proper boundary detection
      if ((node as any).radius) {
        (node as any).radius(radius);
      }
      node.width(radius * 2);
      node.height(radius * 2);
      
      updateShape(shapeId, {
        x: nodeX,
        y: nodeY,
        radius,
      });
    } else if (shape.type === 'text') {
      // Text: no resizing, auto-fit to content
      // Reset scale to 1
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  // Handle transform end (resize complete)
  const handleTransformEnd = () => {
    if (!user || selectedShapeIds.length !== 1) return;
    
    const shapeId = selectedShapeIds[0];
    updateShape(shapeId, {
      lastModifiedBy: user.id,
      lastModifiedAt: Date.now(),
    });
    
    // Release lock after transform ends
    handleLockRelease(shapeId);
  };

  // Handle color change - update current color and selected shape(s) color
  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    
    // If shape(s) are selected, update their color
    if (selectedShapeIds.length > 0 && user) {
      selectedShapeIds.forEach(shapeId => {
        updateShape(shapeId, {
          color,
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
        });
      });
    }
  };

  const handleFontSizeChange = (fontSize: number) => {
    setCurrentFontSize(fontSize);
    
    // If text shape(s) are selected, update their fontSize
    if (selectedShapeIds.length > 0 && user) {
      selectedShapeIds.forEach(shapeId => {
        const selectedShape = shapes.find(s => s.id === shapeId);
        if (selectedShape && selectedShape.type === 'text') {
          updateShape(shapeId, {
            fontSize,
            lastModifiedBy: user.id,
            lastModifiedAt: Date.now(),
          });
        }
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
      {/* Error Notifications */}
      <ErrorNotification 
        message={canvasError || cursorsError} 
        onDismiss={clearCanvasError}
      />
      
      <header className="canvas-header">
      <h1>Collab Canvas by Yohan</h1>
        
        <div className="canvas-header-actions">
          <PresenceMenu />
          <ConnectionStatus />
          {user && (
            <button 
              className="logout-button"
              onClick={logout}
              title="Logout"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </header>

      <div className="canvas-main-content">
        <div
        className="canvas-container"
        style={{ 
          cursor: (isPanning || currentTool === 'pan') ? 'grab' : 
                  currentTool === 'text' ? 'text' : 
                  currentTool === 'select' ? 'default' : 
                  'crosshair' 
        }}
      >
        {/* Canvas Info Overlay: top-left, simple three-line readout */}
        <div className="canvas-info-overlay" aria-live="polite">
          <div>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
          <div>Zoom: {Math.round(viewport.scale * 100)}%</div>
          <div>Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})</div>
        </div>

        <CanvasToolbar
          currentTool={currentTool}
          currentColor={currentColor}
          currentFontSize={currentFontSize}
          selectedShapeId={selectedShapeIds[0] || null}
          onToolChange={setCurrentTool}
          onColorChange={handleColorChange}
          onFontSizeChange={handleFontSizeChange}
          onDuplicate={() => user && duplicateSelectedShapes(user.id)}
          onDelete={() => selectedShapeIds.forEach(id => removeShape(id))}
        />
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
            {/* Grid background - renders behind all other elements */}
            <Grid />
            
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
            {shapes.map((shape) => {
              const handleShapeSelect = async (e: Konva.KonvaEventObject<MouseEvent>) => {
                console.log('[Canvas] onSelect called for shape:', shape.id, 'currentTool:', currentTool);
                
                // Check if shape is locked by another user
                if (shape.lockedBy && shape.lockedBy !== user?.id && !isLockExpired(shape.lockedAt)) {
                  console.log(`[Canvas] Cannot select - shape ${shape.id} is locked by ${shape.lockedBy}`);
                  return;
                }
                
                // Check if shift key is pressed for multi-select
                const isShiftPressed = e.evt.shiftKey;
                
                if (isShiftPressed) {
                  // Shift-click: toggle selection
                  console.log('[Canvas] Toggling shape selection:', shape.id);
                  toggleShapeSelection(shape.id);
                  
                  // Acquire lock if adding to selection
                  if (!selectedShapeIds.includes(shape.id) && user) {
                    await handleLockAcquire(shape.id);
                  }
                } else {
                  // Normal click: select only this shape
                  // Acquire lock on selection
                  if (user) {
                    const acquired = await handleLockAcquire(shape.id);
                    if (!acquired) {
                      console.log(`[Canvas] Failed to acquire lock on shape ${shape.id}`);
                      return;
                    }
                  }
                  
                  console.log('[Canvas] Selecting shape:', shape.id);
                  selectShape(shape.id);
                }
              };

              // Handle drag start for group movement
              const handleShapeDragStart = async () => {
                // If this shape is part of a multi-selection, acquire locks on all selected shapes
                if (selectedShapeIds.length > 1 && selectedShapeIds.includes(shape.id) && user) {
                  for (const shapeId of selectedShapeIds) {
                    const s = shapes.find(sh => sh.id === shapeId);
                    if (s && (!s.lockedBy || s.lockedBy === user.id || isLockExpired(s.lockedAt))) {
                      await handleLockAcquire(shapeId);
                    }
                  }
                }
              };
              
              return (
                <Shape
                  key={shape.id}
                  shape={shape}
                  isSelected={selectedShapeIds.includes(shape.id)}
                  isEditing={isEditingText && editingTextId === shape.id}
                  onSelect={handleShapeSelect}
                  onDoubleClick={handleTextDoubleClick}
                  onDragStart={handleShapeDragStart}
                  onDragMove={handleShapeDragMove}
                  onDragEnd={handleShapeDragEnd}
                  onLockAcquire={handleLockAcquire}
                  onLockRelease={handleLockRelease}
                  currentUserId={user?.id}
                  shapeRef={setShapeRef}
                />
              );
            })}
            
            {/* Selection box for multiple selected shapes */}
            <SelectionBox shapes={shapes} selectedShapeIds={selectedShapeIds} />

            {/* Transformer for resizing selected shapes */}
            <Transformer
              ref={transformerRef}
              onTransformStart={handleTransformStart}
              onTransform={handleTransform}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={getTransformerBoundBoxFunc}
              rotateEnabled={false}
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
            
            {/* Render drag selection rectangle */}
            {isDragSelecting && dragSelectStart && dragSelectEnd && (
              <Rect
                x={Math.min(dragSelectStart.x, dragSelectEnd.x)}
                y={Math.min(dragSelectStart.y, dragSelectEnd.y)}
                width={Math.abs(dragSelectEnd.x - dragSelectStart.x)}
                height={Math.abs(dragSelectEnd.y - dragSelectStart.y)}
                fill="rgba(0, 188, 212, 0.1)"
                stroke="#00bcd4"
                strokeWidth={2}
                dash={[4, 4]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>

        {/* Text input overlay for text editing (Konva best practice: positioned textarea) */}
        {isEditingText && textEditPosition && (() => {
          const editingShape = editingTextId ? shapes.find(s => s.id === editingTextId && s.type === 'text') as TextShape : null;
          const fontSize = editingShape?.fontSize || currentFontSize;
          const color = editingShape?.color || currentColor;
          
          // Get the text node to retrieve its absolute scale
          const textNode = editingTextId ? shapeRefs.current.get(editingTextId) : null;
          const scale = textNode ? textNode.getAbsoluteScale().x : viewport.scale;
          
          return (
            <textarea
              ref={textInputRef}
              value={textEditValue}
              onChange={(e) => setTextEditValue(e.target.value)}
              onKeyDown={handleTextKeyDown}
              onBlur={handleTextBlur}
              style={{
                position: 'absolute',
                left: `${textEditPosition.x}px`,
                top: `${textEditPosition.y}px`,
                fontSize: `${fontSize * scale}px`,
                color: color,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: editingTextId ? 'none' : '2px solid #00bcd4',
                outline: 'none',
                padding: '0',
                margin: '0',
                fontFamily: 'Arial, sans-serif',
                minWidth: editingTextId ? 'auto' : '100px',
                width: 'auto',
                height: 'auto',
                lineHeight: '1.2',
                overflow: 'hidden',
                resize: 'none',
                zIndex: 1000,
                whiteSpace: 'pre-wrap',
                transformOrigin: 'left top',
              }}
              autoFocus
            />
          );
        })()}
        
        {/* Multiplayer cursors overlay */}
        <MultiplayerCursors cursors={cursors} viewport={viewport} />
      </div>

      {/* Presence sidebar removed; presence shown in top bar */}
      </div>
    </div>
  );
};

