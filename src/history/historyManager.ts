import type { CanvasShape } from '../types/canvas.types';
import type { ActionType } from '../types/history.types';

export type ShapePartial = Partial<CanvasShape>;

export interface Change {
  shapeId: string;
  before: ShapePartial | null; // null => did not exist
  after: ShapePartial | null;  // null => deleted
}

export type ChangeSet = Record<string, Change>;

export interface HistoryCommand {
  id: string;
  type: ActionType;
  changes: ChangeSet;
  timestamp: number;
  meta?: Record<string, unknown>;
}

type ApplyDirection = 'undo' | 'redo';

type ApplyChangeSet = (changes: ChangeSet, direction: ApplyDirection) => Promise<void>;

interface PendingTx {
  type: ActionType;
  changes: ChangeSet;
  meta?: Record<string, unknown>;
}

interface CoalesceEntry extends PendingTx {
  timer: ReturnType<typeof setTimeout> | null;
}

export class HistoryManager {
  private undoStack: HistoryCommand[] = [];
  private redoStack: HistoryCommand[] = [];
  private currentTx: PendingTx | null = null;
  private coalesceMap: Map<string, CoalesceEntry> = new Map();
  private readonly apply: ApplyChangeSet;
  private readonly onStacksChange?: (canUndo: boolean, canRedo: boolean) => void;

  constructor(apply: ApplyChangeSet, onStacksChange?: (canUndo: boolean, canRedo: boolean) => void) {
    this.apply = apply;
    this.onStacksChange = onStacksChange;
  }

  // Public state
  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  hasOpenTx(): boolean { return this.currentTx !== null; }

  private notifyStacks() {
    if (this.onStacksChange) {
      this.onStacksChange(this.canUndo(), this.canRedo());
    }
  }

  // Transactions
  begin(type: ActionType, meta?: Record<string, unknown>): void {
    if (this.currentTx) {
      // Nested begin is not supported; commit previous implicitly to avoid lost changes
      this.commit();
    }
    this.currentTx = { type, changes: {}, meta };
  }

  record(shapeId: string, before: ShapePartial | null, after: ShapePartial | null): void {
    if (!this.currentTx) {
      throw new Error('[HistoryManager] record() called without an active transaction');
    }

    const existing = this.currentTx.changes[shapeId];
    if (!existing) {
      this.currentTx.changes[shapeId] = { shapeId, before, after };
      return;
    }

    // Merge with existing change: preserve original before; update after
    const mergedAfter: ShapePartial | null = after === null
      ? null
      : { ...(existing.after ?? {}), ...(after ?? {}) };

    this.currentTx.changes[shapeId] = {
      shapeId,
      before: existing.before,
      after: mergedAfter,
    };
  }

  commit(): void {
    if (!this.currentTx) return;
    // If no actual changes, drop
    const hasChanges = Object.keys(this.currentTx.changes).length > 0;
    if (!hasChanges) {
      this.currentTx = null;
      return;
    }

    const command: HistoryCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: this.currentTx.type,
      changes: this.currentTx.changes,
      timestamp: Date.now(),
      meta: this.currentTx.meta,
    };

    // New command invalidates redo stack (standard behavior)
    this.redoStack = [];
    this.undoStack.push(command);
    this.currentTx = null;
    this.notifyStacks();
  }

  cancel(): void {
    this.currentTx = null;
  }

  async run(type: ActionType, builder: () => Promise<void> | void, meta?: Record<string, unknown>): Promise<void> {
    this.begin(type, meta);
    await builder();
    this.commit();
  }

  // Coalescing by idle window. Builder should call record() and perform real updates immediately.
  coalesce(key: string, type: ActionType, builder: () => void, idleMs = 250, meta?: Record<string, unknown>): void {
    let entry = this.coalesceMap.get(key);
    if (!entry) {
      entry = { type, changes: {}, meta: meta ?? {}, timer: null };
      this.coalesceMap.set(key, entry);
    }

    // Temporarily set currentTx to the coalesced entry to reuse record()
    const prevTx = this.currentTx;
    this.currentTx = entry;
    try {
      builder();
    } finally {
      this.currentTx = prevTx;
    }

    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      // On idle, finalize to a single command
      const hasChanges = Object.keys(entry!.changes).length > 0;
      if (hasChanges) {
        const command: HistoryCommand = {
          id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: entry!.type,
          changes: entry!.changes,
          timestamp: Date.now(),
          meta: entry!.meta,
        };
        // New command invalidates redo stack
        this.redoStack = [];
        this.undoStack.push(command);
        this.notifyStacks();
      }
      this.coalesceMap.delete(key);
    }, idleMs);
  }

  async undo(): Promise<void> {
    if (!this.canUndo()) return;
    const cmd = this.undoStack.pop()!;
    await this.apply(cmd.changes, 'undo');
    this.redoStack.push(cmd);
    this.notifyStacks();
  }

  async redo(): Promise<void> {
    if (!this.canRedo()) return;
    const cmd = this.redoStack.pop()!;
    await this.apply(cmd.changes, 'redo');
    this.undoStack.push(cmd);
    this.notifyStacks();
  }
}


