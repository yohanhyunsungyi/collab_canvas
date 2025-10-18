import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Viewport, RectangleShape, CircleShape, TextShape, CanvasShape } from '../../types/canvas.types';
import type { ActionType } from '../../types/history.types';
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
import { AIPanel, type AIPanelHandle } from '../AI/AIPanel';
import { AISuggestions } from '../AI/AISuggestions';
import type { DesignSuggestion } from '../../services/ai-suggestions.service';
import { KeyboardShortcutsModal } from '../UI/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { EmptyCanvas } from '../UI/EmptyState';
import { fetchAllShapes, subscribeToShapes, acquireLock, releaseLock, isLockExpired } from '../../services/canvas.service';
import type { ShapeChangeEvent } from '../../services/canvas.service';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_MIN_X,
  CANVAS_MAX_X,
  CANVAS_MIN_Y,
  CANVAS_MAX_Y,
  getTransformerBoundBoxFunc,
  constrainRectangleDimensions,
  constrainCircleRadius,
  constrainShapeCreation,
  constrainPoint,
} from '../../utils/boundaries';
import './Canvas.css';

type BaseCreateInput<TShape extends CanvasShape> = Omit<
  TShape,
  'id' | 'createdAt' | 'lastModifiedAt' | 'lastModifiedBy' | 'createdBy' | 'lockedBy' | 'lockedAt'
>;

type RectangleCreateInput = BaseCreateInput<RectangleShape>;
type CircleCreateInput = BaseCreateInput<CircleShape>;
type TextCreateInput = BaseCreateInput<TextShape>;

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
  const aiPanelRef = useRef<AIPanelHandle | null>(null);
  const transformStartShapeRef = useRef<CanvasShape | null>(null); // Store shape state at transform start
  const dragStartShapeRef = useRef<CanvasShape | null>(null); // Store shape state at drag start
  
  // AI highlight state - tracks shapes recently modified by AI
  const [highlightedShapeIds, setHighlightedShapeIds] = useState<Set<string>>(new Set());
  const highlightTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Function to highlight shapes briefly (3 seconds)
  const highlightShapes = useCallback((shapeIds: string[]) => {
    // Clear any existing timeouts for these shapes
    shapeIds.forEach(id => {
      const existingTimeout = highlightTimeouts.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
    });

    // Add shapes to highlighted set
    setHighlightedShapeIds(prev => {
      const newSet = new Set(prev);
      shapeIds.forEach(id => newSet.add(id));
      return newSet;
    });

    // Set timeout to remove highlight after 3 seconds
    shapeIds.forEach(id => {
      const timeout = setTimeout(() => {
        setHighlightedShapeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        highlightTimeouts.current.delete(id);
      }, 3000);
      
      highlightTimeouts.current.set(id, timeout);
    });
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      highlightTimeouts.current.forEach(timeout => clearTimeout(timeout));
      highlightTimeouts.current.clear();
    };
  }, []);
  
    // Get current user for shape creation
    const { user, logout } = useAuth();
  
  // Canvas state management hook (with history/undo/redo/clipboard)
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
    updateMultipleShapes,
    removeShape,
    selectShape,
    toggleShapeSelection,
    clearSelection,
    selectShapesInArea,
    duplicateSelectedShapes,
    setShapes,
    applyShapeChanges,
    // History
    historyBegin,
    historyRecord,
    historyCommit,
    historyCoalesce,
    commitChangeSet,
    canUndo,
    canRedo,
    undo,
    redo,
    // Z-Index operations
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    // Alignment operations
    alignLeft,
    alignRight,
    alignTop,
    alignBottom,
    alignCenterHorizontal,
    alignMiddleVertical,
    distributeHorizontally,
    distributeVertically,
    // Clipboard
    copySelectedShapes,
    pasteShapes,
  } = useCanvas({ userId: user?.id });
  
  // Multiplayer cursors hook
  const { cursors, updateOwnCursor, error: cursorsError } = useCursors();
  
  // Viewport state: position and scale
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    scale: INITIAL_SCALE,
  });

  const getNextZIndex = useCallback(() => {
    if (shapes.length === 0) return 0;
    return Math.max(...shapes.map(shape => shape.zIndex ?? 0)) + 1;
  }, [shapes]);

  // Drawing state for creating new shapes
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [previewShape, setPreviewShape] = useState<CanvasShape | null>(null);

  // Buffer for remote real-time changes to coalesce multiple snapshots into a single render
  const pendingChangesRef = useRef<ShapeChangeEvent[]>([]);
  const flushScheduledRef = useRef(false);

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

  // Keyboard shortcuts modal state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // AI Suggestions modal state
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Delete selected shapes
  const handleDeleteSelected = useCallback(async () => {
    if (selectedShapeIds.length === 0 || !user) return;
    const changes: Record<string, { shapeId: string; before: any; after: any }> = {};
    for (const shapeId of selectedShapeIds) {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) continue;
      changes[shapeId] = { shapeId, before: { ...shape }, after: null };
    }
    await commitChangeSet('delete', changes);
    clearSelection();
  }, [selectedShapeIds, user, shapes, commitChangeSet, clearSelection]);

  // Select all shapes
  const handleSelectAll = useCallback(() => {
    const allShapeIds = shapes.map(shape => shape.id);
    selectShapesInArea(CANVAS_MIN_X, CANVAS_MIN_Y, CANVAS_MAX_X, CANVAS_MAX_Y);
  }, [shapes, selectShapesInArea]);

  // Handle arrow key movement
  const handleArrowMove = useCallback(async (dx: number, dy: number) => {
    if (selectedShapeIds.length === 0 || !user) return;
    const key = `move:${selectedShapeIds.slice().sort().join(',')}`;
    historyCoalesce(key, 'move', () => {
      for (const shapeId of selectedShapeIds) {
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) continue;
        const newPosition = constrainPoint(shape.x + dx, shape.y + dy);
        historyRecord(shapeId, { x: shape.x, y: shape.y }, { x: newPosition.x, y: newPosition.y });
        void updateShape(shapeId, { x: newPosition.x, y: newPosition.y, lastModifiedBy: user.id, lastModifiedAt: Date.now() });
      }
    }, 250);
  }, [selectedShapeIds, shapes, user, updateShape, historyCoalesce, historyRecord]);

  // Toggle keyboard shortcuts modal with '?'
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    enabled: !isEditingText, // Disable when editing text
    handlers: {
      onUndo: undo,
      onRedo: redo,
      onCopy: copySelectedShapes,
      onPaste: () => {
        if (user) {
          pasteShapes(user.id);
        }
      },
      onDuplicate: () => {
        if (user) {
          duplicateSelectedShapes(user.id);
        }
      },
      onDelete: handleDeleteSelected,
      onSelectAll: handleSelectAll,
      onEscape: clearSelection,
      onArrowMove: handleArrowMove,
      onBringToFront: bringToFront,
      onSendToBack: sendToBack,
      onBringForward: bringForward,
      onSendBackward: sendBackward,
    },
    selectedShapeIds,
    shapes,
  });

  // Track whether initial load is complete to prevent race conditions
  const initialLoadComplete = useRef(false);

  // Effect for loading shapes from Firestore and subscribing to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let initialSnapshotReceived = false;
    let initialShapeCount = 0; // Track how many shapes we fetched initially
    
    // Initial load: fetch all shapes, then subscribe to real-time changes
    fetchAllShapes()
      .then((allShapes) => {
        console.log(`[Canvas] Initial load: ${allShapes.length} shapes`);
        initialShapeCount = allShapes.length;
        
        // RACE CONDITION FIX: Merge with existing shapes instead of replacing
        // This prevents overwriting shapes that were optimistically added during initial load
        setShapes((currentShapes: CanvasShape[]) => {
          if (currentShapes.length === 0) {
            // No optimistic updates, just use fetched shapes
            console.log('[Canvas] No existing shapes, using fetched shapes');
            return allShapes;
          }
          
          // Merge: keep optimistic shapes that don't exist in fetched data
          const fetchedIds = new Set(allShapes.map((s: CanvasShape) => s.id));
          const optimisticShapes = currentShapes.filter((s: CanvasShape) => !fetchedIds.has(s.id));
          
          if (optimisticShapes.length > 0) {
            console.log(`[Canvas] Preserving ${optimisticShapes.length} optimistically added shapes during initial load`);
            return [...allShapes, ...optimisticShapes];
          }
          
          return allShapes;
        });
        
        initialLoadComplete.current = true;
        
        // Subscribe to real-time changes AFTER initial load completes
        // This ensures we don't skip any changes made immediately after page load
        unsubscribe = subscribeToShapes((changes) => {
          // IMPROVED: Only skip first snapshot if it matches what we already loaded
          // If there are MORE shapes in the first snapshot, it means shapes were created during initial load
          if (!initialSnapshotReceived) {
            initialSnapshotReceived = true;
            
            // Count "added" events in first snapshot
            const addedCount = changes.filter(c => c.type === 'added').length;
            
            if (addedCount > initialShapeCount) {
              // New shapes were created during initial load - DON'T skip this snapshot!
              console.log(`[Canvas] First snapshot has ${addedCount} shapes vs ${initialShapeCount} fetched - processing new shapes`);
            } else {
              // Same count - this is just the initial data we already have
              console.log('[Canvas] Skipping initial snapshot (already loaded)');
              return;
            }
          }

          // Buffer changes and flush once per animation frame to avoid N renders
          pendingChangesRef.current.push(...changes);
          if (!flushScheduledRef.current) {
            flushScheduledRef.current = true;
            requestAnimationFrame(() => {
              flushScheduledRef.current = false;
              if (pendingChangesRef.current.length === 0) return;

              // Coalesce by shape id: last event wins
              const byId = new Map<string, ShapeChangeEvent>();
              for (const ev of pendingChangesRef.current) {
                byId.set(ev.shape.id, ev);
              }
              const aggregated = Array.from(byId.values());
              pendingChangesRef.current = [];

              console.log(`[Canvas] Applying aggregated ${aggregated.length} real-time changes`);
              applyShapeChanges(aggregated);
            });
          }
        });
      })
      .catch((error) => {
        console.error('[Canvas] Failed to load initial shapes:', error);
      });

    // Unsubscribe on component unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setShapes, applyShapeChanges]);

  // Calculate boundary constraints for panning (centered coordinate system)
  const getBoundaryConstraints = useCallback((scale: number) => {
    // In centered coordinate system:
    // - Canvas coordinates range from CANVAS_MIN_X to CANVAS_MAX_X
    // - Stage.x represents where canvas coordinate 0 appears on screen
    // - When canvas right edge (CANVAS_MAX_X) is at screen left (0): Stage.x = -CANVAS_MAX_X * scale
    // - When canvas left edge (CANVAS_MIN_X) is at screen right (containerWidth): Stage.x = containerWidth - CANVAS_MIN_X * scale
    
    return {
      minX: -CANVAS_MAX_X * scale,  // Allow panning right to see left side of canvas
      maxX: containerSize.width - CANVAS_MIN_X * scale,  // Allow panning left to see right side of canvas
      minY: -CANVAS_MAX_Y * scale,  // Allow panning down to see top of canvas
      maxY: containerSize.height - CANVAS_MIN_Y * scale,  // Allow panning up to see bottom of canvas
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
        
        // Center the viewport to show canvas origin (0, 0) at screen center
        // Since canvas is now centered at (0, 0), position viewport so (0, 0) appears at screen center
        const centerX = newWidth / 2;
        const centerY = newHeight / 2;
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

  // Handle keyboard events for pan mode and AI focus (other shortcuts handled by useKeyboardShortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputTarget = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Cmd/Ctrl+K focuses AI input
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        aiPanelRef.current?.focusInput();
        return;
      }
      
      // Handle spacebar for pan mode (only this - other shortcuts handled by useKeyboardShortcuts)
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
  }, [isSpacePressed, isEditingText]);

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
      const nextZIndex = getNextZIndex();
      
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
        zIndex: nextZIndex,
      };
      
      setPreviewShape(preview);
    } else if (currentTool === 'circle') {
      // Calculate radius from distance between start point and current pointer
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Apply boundary constraints for preview
      const constrained = constrainShapeCreation('circle', startPoint.x, startPoint.y, undefined, undefined, radius);
      const nextZIndex = getNextZIndex();
      
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
        zIndex: nextZIndex,
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
        
        const nextZIndex = getNextZIndex();
        const newShapeData: RectangleCreateInput = {
          type: 'rectangle' as const,
          x: constrained.x,
          y: constrained.y,
          width: constrained.width ?? rawWidth,
          height: constrained.height ?? rawHeight,
          color: currentColor,
          zIndex: nextZIndex,
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
        
        const nextZIndex = getNextZIndex();
        const newShapeData: CircleCreateInput = {
          type: 'circle' as const,
          x: constrained.x,
          y: constrained.y,
          radius: constrained.radius ?? radius,
          color: currentColor,
          zIndex: nextZIndex,
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
        // Update existing text with history
        const existing = shapes.find(s => s.id === editingTextId);
        if (existing && existing.type === 'text' && existing.text !== trimmedText) {
          historyBegin('text_update');
          historyRecord(editingTextId, { text: existing.text }, { text: trimmedText });
          historyCommit();
        }
        updateShape(editingTextId, {
          text: trimmedText,
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
        });
      } else {
        // Creating new text: convert overlay screen coordinates (relative to container)
        // back to canvas coordinates (inverse of placement transform)
        const canvasX = (textEditPosition.x - viewport.x) / viewport.scale;
        const canvasY = (textEditPosition.y - viewport.y) / viewport.scale;
        
        // Apply boundary constraints
        const constrained = constrainPoint(canvasX, canvasY);
        const nextZIndex = getNextZIndex();
        
        const newShapeData: TextCreateInput = {
          type: 'text' as const,
          x: constrained.x,
          y: constrained.y,
          text: trimmedText,
          fontSize: currentFontSize,
          color: currentColor,
          zIndex: nextZIndex,
        };
        
        // Create as one history transaction (create)
        // new id generated inside addShape; we can't know it ahead, so record using after full shape
        // HistoryManager supports before=null/after=full shape; we'll piggyback by reusing the id returned optimistically
        const tempId = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const afterShape = {
          ...newShapeData,
          id: tempId,
          createdBy: user.id,
          createdAt: Date.now(),
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
          lockedBy: null,
          lockedAt: null,
        } as CanvasShape;
        historyBegin('create');
        historyRecord(tempId, null, afterShape);
        historyCommit();
        addShape(newShapeData, user.id, tempId);
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
    
    // Calculate position relative to `.canvas-container` (the textarea's offset parent).
    // Because the Stage is transformed via `viewport.x`/`viewport.scale`, we project
    // the Konva node's position into screen space relative to the container.
    const areaPosition = {
      x: textPosition.x * viewport.scale + viewport.x,
      y: textPosition.y * viewport.scale + viewport.y,
    };
    
    console.log('[Canvas] Text edit position:', {
      canvasPos: { x: shape.x, y: shape.y },
      absolutePos: textPosition,
      viewport,
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
      // Place caret at the end to preserve original content by default
      if (textInputRef.current) {
        const len = textInputRef.current.value.length;
        try {
          textInputRef.current.setSelectionRange(len, len);
        } catch {
          // Some browsers may not support setSelectionRange on textarea; safe to ignore
        }
      }
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
    
    const initialShape = dragStartShapeRef.current;
    
    // Check if this was a group drag
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(id)) {
      // Get the initial position of the dragged shape
      const draggedShapeInitial = groupDragInitialPositions.get(id);
      if (draggedShapeInitial) {
        // Calculate final delta
        const deltaX = x - draggedShapeInitial.x;
        const deltaY = y - draggedShapeInitial.y;

        // Prepare batch updates for all selected shapes
        const batchUpdates: Array<{ id: string; updates: Partial<CanvasShape> }> = [];
        
        // Update all selected shapes with final positions and metadata (as one history tx)
        historyBegin('move');
        selectedShapeIds.forEach((shapeId) => {
          const initialPos = groupDragInitialPositions.get(shapeId);
          if (initialPos) {
            const finalX = initialPos.x + deltaX;
            const finalY = initialPos.y + deltaY;
            historyRecord(shapeId, { x: initialPos.x, y: initialPos.y }, { x: finalX, y: finalY });
            
            // Add to batch updates instead of individual updates
            batchUpdates.push({
              id: shapeId,
              updates: {
                x: finalX,
                y: finalY,
                lastModifiedBy: user.id,
                lastModifiedAt: Date.now(),
              },
            });
          }
        });
        historyCommit();
        
        // OPTIMIZED: Single batch update instead of 500 individual updates!
        if (batchUpdates.length > 0) {
          updateMultipleShapes(batchUpdates);
        }
      }

      // Reset group drag state
      setIsDraggingGroup(false);
      setGroupDragInitialPositions(new Map());
    } else {
      // Single shape drag end
      if (initialShape && (initialShape.x !== x || initialShape.y !== y)) {
        historyBegin('move');
        historyRecord(id, { x: initialShape.x, y: initialShape.y }, { x, y });
        historyCommit();
      }
      
      // Update metadata only (position already updated by dragMove)
      updateShape(id, {
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
    }
    
    // Clear the drag start reference
    dragStartShapeRef.current = null;
    
    // Lock will be released when shape is deselected (via selection management effect)
  }, [user, updateShape, updateMultipleShapes, selectedShapeIds, groupDragInitialPositions, shapes, historyBegin, historyRecord, historyCommit]);

  // Handle transform start - acquire lock when starting to resize (if not already locked)
  const handleTransformStart = useCallback(async () => {
    if (selectedShapeIds.length !== 1 || !user) return;
    
    const shapeId = selectedShapeIds[0];
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    // Store initial shape state for history
    transformStartShapeRef.current = { ...shape };
    
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
    const rotation = node.rotation(); // Get rotation angle

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
        rotation,
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
        boundingBoxX < CANVAS_MIN_X ||
        boundingBoxY < CANVAS_MIN_Y ||
        boundingBoxX + boundingBoxWidth > CANVAS_MAX_X ||
        boundingBoxY + boundingBoxHeight > CANVAS_MAX_Y;
      
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
        rotation,
      });
    } else if (shape.type === 'text') {
      // Text: no resizing, auto-fit to content, but support rotation
      // Reset scale to 1
      node.scaleX(1);
      node.scaleY(1);
      
      // Update rotation if changed
      updateShape(shapeId, {
        x: nodeX,
        y: nodeY,
        rotation,
      });
    }
  };

  // Handle transform end (resize complete)
  const handleTransformEnd = () => {
    if (!user || selectedShapeIds.length !== 1) return;
    
    const shapeId = selectedShapeIds[0];
    const currentShape = shapes.find(s => s.id === shapeId);
    const initialShape = transformStartShapeRef.current;
    
    // If we have both initial and current shape, record the full transform in history
    if (initialShape && currentShape) {
      const before: Partial<CanvasShape> = {};
      const after: Partial<CanvasShape> = {};
      if (currentShape.x !== initialShape.x) { before.x = initialShape.x; after.x = currentShape.x; }
      if (currentShape.y !== initialShape.y) { before.y = initialShape.y; after.y = currentShape.y; }
      const initialRotation = initialShape.rotation ?? 0;
      const currentRotation = currentShape.rotation ?? 0;
      if (currentRotation !== initialRotation) { before.rotation = initialRotation; after.rotation = currentRotation; }
      if (currentShape.type === 'rectangle' && initialShape.type === 'rectangle') {
        if (currentShape.width !== initialShape.width) { (before as any).width = initialShape.width; (after as any).width = currentShape.width; }
        if (currentShape.height !== initialShape.height) { (before as any).height = initialShape.height; (after as any).height = currentShape.height; }
      } else if (currentShape.type === 'circle' && initialShape.type === 'circle') {
        if (currentShape.radius !== initialShape.radius) { (before as any).radius = initialShape.radius; (after as any).radius = currentShape.radius; }
      }

      const resized = ('width' in after) || ('height' in after) || ('radius' in after);
      const rotated = ('rotation' in after);
      const actionType: ActionType = resized ? 'resize' : (rotated ? 'rotate' : 'move');

      historyBegin(actionType);
      historyRecord(shapeId, before, after);
      historyCommit();

      // Clear the transform start reference
      transformStartShapeRef.current = null;
    } else {
      // Fallback: just update metadata
      updateShape(shapeId, {
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
    }
    
    // Lock will be released when shape is deselected (via selection management effect)
    // Keeping the lock active while shape remains selected prevents other users from selecting it
  };

  // Handle color change - update current color and selected shape(s) color
  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    
    // If shape(s) are selected, update their color
    if (selectedShapeIds.length > 0 && user) {
      historyBegin('color_change');
      selectedShapeIds.forEach(shapeId => {
        const prev = shapes.find(s => s.id === shapeId);
        if (!prev) return;
        historyRecord(shapeId, { color: prev.color }, { color });
        updateShape(shapeId, {
          color,
          lastModifiedBy: user.id,
          lastModifiedAt: Date.now(),
        });
      });
      historyCommit();
    }
  };

  const handleFontSizeChange = (fontSize: number) => {
    setCurrentFontSize(fontSize);
    
    // If text shape(s) are selected, update their fontSize
    if (selectedShapeIds.length > 0 && user) {
      historyBegin('text_update');
      selectedShapeIds.forEach(shapeId => {
        const selectedShape = shapes.find(s => s.id === shapeId);
        if (selectedShape && selectedShape.type === 'text') {
          historyRecord(shapeId, { fontSize: selectedShape.fontSize }, { fontSize });
          updateShape(shapeId, {
            fontSize,
            lastModifiedBy: user.id,
            lastModifiedAt: Date.now(),
          });
        }
      });
      historyCommit();
    }
  };

  // Helper functions to get shape bounding box coordinates
  // These account for different coordinate systems: circles use center, rectangles use top-left
  
  const getShapeLeft = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.x - shape.radius;
    if (shape.type === 'rectangle') return shape.x;
    if (shape.type === 'text') return shape.x;
    return shape.x;
  };

  const getShapeRight = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.x + shape.radius;
    if (shape.type === 'rectangle') return shape.x + shape.width;
    if (shape.type === 'text') return shape.x + (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
    return shape.x;
  };

  const getShapeCenterX = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.x; // Circle x is already center
    if (shape.type === 'rectangle') return shape.x + shape.width / 2;
    if (shape.type === 'text') return shape.x + ((shape.text?.length || 0) * (shape.fontSize || 24) * 0.6) / 2;
    return shape.x;
  };

  const getShapeTop = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.y - shape.radius;
    if (shape.type === 'rectangle') return shape.y;
    if (shape.type === 'text') return shape.y;
    return shape.y;
  };

  const getShapeBottom = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.y + shape.radius;
    if (shape.type === 'rectangle') return shape.y + shape.height;
    if (shape.type === 'text') return shape.y + (shape.fontSize || 24);
    return shape.y;
  };

  const getShapeCenterY = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.y; // Circle y is already center
    if (shape.type === 'rectangle') return shape.y + shape.height / 2;
    if (shape.type === 'text') return shape.y + (shape.fontSize || 24) / 2;
    return shape.y;
  };

  const getShapeWidth = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.radius * 2;
    if (shape.type === 'rectangle') return shape.width;
    if (shape.type === 'text') return (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
    return 0;
  };

  const getShapeHeight = (shape: CanvasShape): number => {
    if (shape.type === 'circle') return shape.radius * 2;
    if (shape.type === 'rectangle') return shape.height;
    if (shape.type === 'text') return shape.fontSize || 24;
    return 0;
  };

  // Set shape's x position based on desired left edge
  const setShapeLeft = (shape: CanvasShape, leftX: number): number => {
    if (shape.type === 'circle') return leftX + shape.radius; // Circle x is center
    return leftX; // Rectangle and text x is left edge
  };

  // Set shape's x position based on desired center
  const setShapeCenterX = (shape: CanvasShape, centerX: number): number => {
    if (shape.type === 'circle') return centerX; // Circle x is already center
    if (shape.type === 'rectangle') return centerX - shape.width / 2;
    if (shape.type === 'text') return centerX - ((shape.text?.length || 0) * (shape.fontSize || 24) * 0.6) / 2;
    return centerX;
  };

  // Set shape's x position based on desired right edge
  const setShapeRight = (shape: CanvasShape, rightX: number): number => {
    if (shape.type === 'circle') return rightX - shape.radius; // Circle x is center
    if (shape.type === 'rectangle') return rightX - shape.width;
    if (shape.type === 'text') return rightX - (shape.text?.length || 0) * (shape.fontSize || 24) * 0.6;
    return rightX;
  };

  // Set shape's y position based on desired top edge
  const setShapeTop = (shape: CanvasShape, topY: number): number => {
    if (shape.type === 'circle') return topY + shape.radius; // Circle y is center
    return topY; // Rectangle and text y is top edge
  };

  // Set shape's y position based on desired center
  const setShapeCenterY = (shape: CanvasShape, centerY: number): number => {
    if (shape.type === 'circle') return centerY; // Circle y is already center
    if (shape.type === 'rectangle') return centerY - shape.height / 2;
    if (shape.type === 'text') return centerY - (shape.fontSize || 24) / 2;
    return centerY;
  };

  // Set shape's y position based on desired bottom edge
  const setShapeBottom = (shape: CanvasShape, bottomY: number): number => {
    if (shape.type === 'circle') return bottomY - shape.radius; // Circle y is center
    if (shape.type === 'rectangle') return bottomY - shape.height;
    if (shape.type === 'text') return bottomY - (shape.fontSize || 24);
    return bottomY;
  };

  // Align selected shapes to the left
  const handleAlignLeft = () => {
    if (selectedShapeIds.length < 2 || !user) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const leftmostX = Math.min(...selectedShapes.map(s => getShapeLeft(s)));
    historyBegin('align');
    selectedShapes.forEach(shape => {
      const newX = setShapeLeft(shape, leftmostX);
      historyRecord(shape.id, { x: shape.x }, { x: newX });
      updateShape(shape.id, {
        x: newX,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
    });
    historyCommit();
  };

  // Align selected shapes to the center
  const handleAlignCenter = () => {
    if (selectedShapeIds.length < 2 || !user) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    
    // Find the bounding box center
    const leftmostX = Math.min(...selectedShapes.map(s => getShapeLeft(s)));
    const rightmostX = Math.max(...selectedShapes.map(s => getShapeRight(s)));
    const centerX = (leftmostX + rightmostX) / 2;
    historyBegin('align');
    selectedShapes.forEach(shape => {
      const newX = setShapeCenterX(shape, centerX);
      historyRecord(shape.id, { x: shape.x }, { x: newX });
      updateShape(shape.id, {
        x: newX,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
    });
    historyCommit();
  };

  // Align selected shapes to the right
  const handleAlignRight = () => {
    if (selectedShapeIds.length < 2 || !user) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const rightmostX = Math.max(...selectedShapes.map(s => getShapeRight(s)));
    historyBegin('align');
    selectedShapes.forEach(shape => {
      const newX = setShapeRight(shape, rightmostX);
      historyRecord(shape.id, { x: shape.x }, { x: newX });
      updateShape(shape.id, {
        x: newX,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
    });
    historyCommit();
  };

  // Distribute selected shapes horizontally with even spacing
  const handleDistributeHorizontally = () => {
    if (selectedShapeIds.length < 3 || !user) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    
    // Sort shapes by their left edge
    const sortedShapes = [...selectedShapes].sort((a, b) => getShapeLeft(a) - getShapeLeft(b));
    
    // Keep the leftmost and rightmost shapes in place
    const leftmostLeft = getShapeLeft(sortedShapes[0]);
    const rightmostRight = getShapeRight(sortedShapes[sortedShapes.length - 1]);
    const totalSpace = rightmostRight - leftmostLeft;
    
    // Calculate total width of all shapes
    const totalShapeWidth = sortedShapes.reduce((sum, shape) => sum + getShapeWidth(shape), 0);
    
    // Calculate spacing between shapes
    const spacing = (totalSpace - totalShapeWidth) / (sortedShapes.length - 1);
    
    // Position each shape as one history transaction
    let currentLeft = leftmostLeft;
    historyBegin('distribute');
    sortedShapes.forEach(shape => {
      const newX = setShapeLeft(shape, currentLeft);
      historyRecord(shape.id, { x: shape.x }, { x: newX });
      updateShape(shape.id, {
        x: newX,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
      currentLeft += getShapeWidth(shape) + spacing;
    });
    historyCommit();
  };

  // Distribute selected shapes vertically with even spacing
  const handleDistributeVertically = () => {
    if (selectedShapeIds.length < 3 || !user) return;
    
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    
    // Sort shapes by their top edge
    const sortedShapes = [...selectedShapes].sort((a, b) => getShapeTop(a) - getShapeTop(b));
    
    // Keep the topmost and bottommost shapes in place
    const topmostTop = getShapeTop(sortedShapes[0]);
    const bottommostBottom = getShapeBottom(sortedShapes[sortedShapes.length - 1]);
    const totalSpace = bottommostBottom - topmostTop;
    
    // Calculate total height of all shapes
    const totalShapeHeight = sortedShapes.reduce((sum, shape) => sum + getShapeHeight(shape), 0);
    
    // Calculate spacing between shapes
    const spacing = (totalSpace - totalShapeHeight) / (sortedShapes.length - 1);
    
    // Position each shape as one history transaction
    let currentTop = topmostTop;
    historyBegin('distribute');
    sortedShapes.forEach(shape => {
      const newY = setShapeTop(shape, currentTop);
      historyRecord(shape.id, { y: shape.y }, { y: newY });
      updateShape(shape.id, {
        y: newY,
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      });
      currentTop += getShapeHeight(shape) + spacing;
    });
    historyCommit();
  };

  // Apply AI design suggestion
  const handleApplySuggestion = useCallback((suggestion: DesignSuggestion) => {
    if (!user) return;

    // Map suggestion type to ActionType
    const actionType: ActionType = 
      suggestion.type === 'alignment' ? 'align' :
      suggestion.type === 'color' ? 'color_change' : 'update';
    
    historyBegin(actionType);
    
    suggestion.changes.forEach((change) => {
      const shape = shapes.find(s => s.id === change.shapeId);
      if (!shape) return;

      const updates: Partial<CanvasShape> = {
        lastModifiedBy: user.id,
        lastModifiedAt: Date.now(),
      };

      // Record old value for history
      const before: any = {};
      const after: any = {};

      // Apply the change based on property
      switch (change.property) {
        case 'x':
        case 'y':
        case 'width':
        case 'height':
        case 'rotation':
          before[change.property] = (shape as any)[change.property];
          after[change.property] = change.newValue;
          (updates as any)[change.property] = change.newValue;
          break;
        case 'color':
          before.color = shape.color;
          after.color = change.newValue as string;
          updates.color = change.newValue as string;
          break;
      }

      historyRecord(change.shapeId, before, after);
      updateShape(change.shapeId, updates);
    });

    historyCommit();
  }, [user, shapes, updateShape, historyBegin, historyRecord, historyCommit]);

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
        {/* Canvas Info Overlay: bottom-left, simple three-line readout */}
        <div className="canvas-info-overlay" aria-live="polite">
          <div>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
          <div>Zoom: {Math.round(viewport.scale * 100)}%</div>
          <div>
            Center: (
            {Math.round((containerSize.width / 2 - viewport.x) / viewport.scale)}, {Math.round((containerSize.height / 2 - viewport.y) / viewport.scale)}
            )
          </div>
        </div>

        <CanvasToolbar
          currentTool={currentTool}
          currentColor={(() => {
            // If a shape is selected, show its color in the toolbar
            if (selectedShapeIds.length === 1) {
              const selectedShape = shapes.find(s => s.id === selectedShapeIds[0]);
              if (selectedShape) {
                return selectedShape.color;
              }
            }
            // Otherwise, show the current default color
            return currentColor;
          })()}
          currentFontSize={(() => {
            // If a single text shape is selected, show its font size in the toolbar
            if (selectedShapeIds.length === 1) {
              const selectedShape = shapes.find(s => s.id === selectedShapeIds[0]);
              if (selectedShape?.type === 'text') {
                return selectedShape.fontSize;
              }
            }
            // Otherwise, show the current default font size
            return currentFontSize;
          })()}
          selectedShapeId={selectedShapeIds[0] || null}
          selectedShapeCount={selectedShapeIds.length}
          onToolChange={setCurrentTool}
          onColorChange={handleColorChange}
          onFontSizeChange={handleFontSizeChange}
          onDuplicate={() => user && duplicateSelectedShapes(user.id)}
          onDelete={handleDeleteSelected}
          onAlignLeft={alignLeft}
          onAlignCenter={alignCenterHorizontal}
          onAlignRight={alignRight}
          onAlignTop={alignTop}
          onAlignBottom={alignBottom}
          onAlignMiddleVertical={alignMiddleVertical}
          onDistributeHorizontally={distributeHorizontally}
          onDistributeVertically={distributeVertically}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSuggestImprovements={() => setShowAISuggestions(true)}
        />
        
        {/* Empty state when no shapes exist */}
        {shapes.length === 0 && (
          <div className="canvas-empty-state-overlay">
            <EmptyCanvas />
          </div>
        )}
        
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
            
            {/* Gray out area outside canvas bounds (centered coordinate system) */}
            {/* Top gray area */}
            <Rect
              x={CANVAS_MIN_X - 10000}
              y={CANVAS_MIN_Y - 10000}
              width={CANVAS_WIDTH + 20000}
              height={10000}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            {/* Bottom gray area */}
            <Rect
              x={CANVAS_MIN_X - 10000}
              y={CANVAS_MAX_Y}
              width={CANVAS_WIDTH + 20000}
              height={10000}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            {/* Left gray area */}
            <Rect
              x={CANVAS_MIN_X - 10000}
              y={CANVAS_MIN_Y}
              width={10000}
              height={CANVAS_HEIGHT}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            {/* Right gray area */}
            <Rect
              x={CANVAS_MAX_X}
              y={CANVAS_MIN_Y}
              width={10000}
              height={CANVAS_HEIGHT}
              fill="rgba(128, 128, 128, 0.5)"
              listening={false}
            />
            
            {/* Canvas boundary rectangle - visual indicator */}
            <Rect
              x={CANVAS_MIN_X}
              y={CANVAS_MIN_Y}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              stroke="#ff0000"
              strokeWidth={2}
              dash={[10, 5]}
              listening={false}
            />
            
            {/* Render all shapes sorted by zIndex (lower zIndex = rendered first = behind) */}
            {[...shapes].sort((a, b) => a.zIndex - b.zIndex).map((shape) => {
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
                // Store initial shape state for history
                dragStartShapeRef.current = { ...shape };
                
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
                  isHighlighted={highlightedShapeIds.has(shape.id)}
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
              rotateEnabled={true}
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
          
          // Get the text node to retrieve its absolute scale and width
          const textNode = editingTextId ? shapeRefs.current.get(editingTextId) : null;
          const scale = textNode ? textNode.getAbsoluteScale().x : viewport.scale;
          
          // Calculate textarea width: for editing existing text, use text node's width scaled
          // For new text, use minimum width
          let textareaWidth: number;
          if (textNode && editingTextId) {
            // Get the text node's width (it should have a width property)
            const nodeWidth = (textNode as any).width ? (textNode as any).width() : 200;
            textareaWidth = Math.max(50, nodeWidth * scale);
          } else {
            // New text creation
            textareaWidth = 200;
          }
          
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
                width: `${textareaWidth}px`,
                height: 'auto',
                fontSize: `${fontSize * scale}px`,
                color: color,
                backgroundColor: 'white',
                border: '1px solid #00bcd4',
                outline: 'none',
                padding: '2px',
                margin: '0',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.2',
                overflow: 'hidden',
                resize: 'none',
                zIndex: 10000,
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
      {/* AI Panel floating dock */}
      {user && (
        <AIPanel
          ref={aiPanelRef}
          userId={user.id}
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
          viewport={viewport}
          containerSize={containerSize}
          defaultCollapsed={true}
          onShapesHighlight={highlightShapes}
        />
      )}
      
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* AI Suggestions Modal */}
      {showAISuggestions && (
        <AISuggestions
          shapes={shapes}
          onApplySuggestion={handleApplySuggestion}
          onClose={() => setShowAISuggestions(false)}
        />
      )}
    </div>
  );
};
