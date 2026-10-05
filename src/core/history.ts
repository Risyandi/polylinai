import { RoiZone } from '../types';

export class HistoryManager {
  private undoStack: RoiZone[][] = [];
  private redoStack: RoiZone[][] = [];
  private maxDepth: number;

  constructor(maxDepth: number = 30) {
    this.maxDepth = maxDepth;
  }

  public push(state: RoiZone[]): void {
    // Clone state deeply to prevent mutation
    const snapshot = JSON.parse(JSON.stringify(state));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public undo(currentState: RoiZone[]): RoiZone[] | null {
    if (this.undoStack.length === 0) return null;
    const previous = this.undoStack.pop()!;
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    return previous;
  }

  public redo(currentState: RoiZone[]): RoiZone[] | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    return next;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
