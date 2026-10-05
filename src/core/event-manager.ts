/**
 * PolylinAI - Pointer & Keyboard Event Manager
 * Manages drawing interactions, pointer capture, vertex dragging, and keyboard shortcuts.
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import { DrawingState, PixelPoint, PolylinAiOptions, RoiPoint, RoiZone } from '../types';
import { clampPoint, distance, toNormalized, toPixel } from '../geometry/point';
import { SvgRenderer } from './renderer';
import { insertVertex, removeVertex } from '../geometry/polygon';

export interface EventManagerDelegate {
  getState(): DrawingState;
  setState(state: DrawingState): void;
  getActivePoints(): RoiPoint[];
  setActivePoints(points: RoiPoint[]): void;
  getDrawingMode(): 'polygon' | 'polyline';
  finishDrawing(): RoiZone | null;
  cancelDrawing(): void;
  getSelectedZone(): RoiZone | null;
  setSelectedZone(zone: RoiZone | null): void;
  getZones(): RoiZone[];
  updateZone(zone: RoiZone, saveHistory?: boolean): void;
  notifyChange(): void;
}

export class EventManager {
  private renderer: SvgRenderer;
  private delegate: EventManagerDelegate;
  private options: PolylinAiOptions;

  // Dragging vertex state
  private draggingVertex: {
    zoneId: string;
    vertexIndex: number;
    pointerId: number;
  } | null = null;

  // Bound event handlers for clean removal
  private handlePointerDownBound: (e: PointerEvent) => void;
  private handlePointerMoveBound: (e: PointerEvent) => void;
  private handlePointerUpBound: (e: PointerEvent) => void;
  private handleDblClickBound: (e: MouseEvent) => void;
  private handleContextMenuBound: (e: MouseEvent) => void;
  private handleKeyDownBound: (e: KeyboardEvent) => void;

  constructor(
    _container: HTMLElement,
    renderer: SvgRenderer,
    delegate: EventManagerDelegate,
    options: PolylinAiOptions
  ) {
    this.renderer = renderer;
    this.delegate = delegate;
    this.options = options;

    this.handlePointerDownBound = this.handlePointerDown.bind(this);
    this.handlePointerMoveBound = this.handlePointerMove.bind(this);
    this.handlePointerUpBound = this.handlePointerUp.bind(this);
    this.handleDblClickBound = this.handleDblClick.bind(this);
    this.handleContextMenuBound = this.handleContextMenu.bind(this);
    this.handleKeyDownBound = this.handleKeyDown.bind(this);

    this.attach();
  }

  private attach(): void {
    const svg = this.renderer.svg;
    svg.addEventListener('pointerdown', this.handlePointerDownBound);
    window.addEventListener('pointermove', this.handlePointerMoveBound);
    window.addEventListener('pointerup', this.handlePointerUpBound);
    window.addEventListener('pointercancel', this.handlePointerUpBound);
    svg.addEventListener('dblclick', this.handleDblClickBound);
    svg.addEventListener('contextmenu', this.handleContextMenuBound);
    window.addEventListener('keydown', this.handleKeyDownBound);
  }

  public detach(): void {
    const svg = this.renderer.svg;
    svg.removeEventListener('pointerdown', this.handlePointerDownBound);
    window.removeEventListener('pointermove', this.handlePointerMoveBound);
    window.removeEventListener('pointerup', this.handlePointerUpBound);
    window.removeEventListener('pointercancel', this.handlePointerUpBound);
    svg.removeEventListener('dblclick', this.handleDblClickBound);
    svg.removeEventListener('contextmenu', this.handleContextMenuBound);
    window.removeEventListener('keydown', this.handleKeyDownBound);
  }

  /**
   * Translates client pointer coordinates into normalized (0.0 - 1.0) space.
   */
  private getEventNormalizedPoint(e: MouseEvent | PointerEvent): RoiPoint {
    const rect = this.renderer.svg.getBoundingClientRect();
    const pixel: PixelPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    return toNormalized(pixel, rect.width, rect.height);
  }

  /**
   * Translates client pointer coordinates into container pixel space.
   */
  private getEventPixelPoint(e: MouseEvent | PointerEvent): PixelPoint {
    const rect = this.renderer.svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    // Only primary button triggers down
    if (e.button !== 0) return;

    const target = e.target as SVGElement;
    const state = this.delegate.getState();

    // 1. Handling click while in DRAWING mode
    if (state === 'drawing') {
      const normPt = this.getEventNormalizedPoint(e);
      const points = this.delegate.getActivePoints();
      const isPolygon = this.delegate.getDrawingMode() === 'polygon';
      const snapDist = this.options.snapDistancePx ?? 16;
      const rect = this.renderer.svg.getBoundingClientRect();

      // Check if clicking near the first point to close polygon
      if (isPolygon && points.length >= 3) {
        const firstPixel = toPixel(points[0], rect.width, rect.height);
        const currentPixel = this.getEventPixelPoint(e);
        if (distance(firstPixel, currentPixel) <= snapDist) {
          this.delegate.finishDrawing();
          return;
        }
      }

      // Append new point
      this.delegate.setActivePoints([...points, normPt]);
      this.renderer.renderActiveDrawing(this.delegate.getActivePoints(), normPt, isPolygon, false);
      return;
    }

    // 2. Handling clicks on Vertex Handles (Dragging)
    if (target.classList.contains('polylinai-handle-vertex')) {
      const zoneId = target.dataset.zoneId;
      const vertexIndex = parseInt(target.dataset.vertexIndex ?? '-1', 10);
      if (zoneId && vertexIndex >= 0) {
        this.draggingVertex = {
          zoneId,
          vertexIndex,
          pointerId: e.pointerId,
        };
        target.setPointerCapture(e.pointerId);
        target.style.cursor = 'grabbing';
        this.delegate.setState('dragging_vertex');
        e.stopPropagation();
        return;
      }
    }

    // 3. Handling clicks on Midpoint Handles (Dynamic Edge Split / Vertex Insertion)
    if (target.classList.contains('polylinai-handle-midpoint')) {
      const zoneId = target.dataset.zoneId;
      const segmentIndex = parseInt(target.dataset.segmentIndex ?? '-1', 10);
      const selected = this.delegate.getSelectedZone();

      if (selected && selected.id === zoneId && segmentIndex >= 0) {
        const p1 = selected.points[segmentIndex];
        const p2 = selected.points[(segmentIndex + 1) % selected.points.length];
        const newPoint = clampPoint({
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        });

        const updatedPoints = insertVertex(selected.points, segmentIndex, newPoint);
        const updatedZone = { ...selected, points: updatedPoints };
        this.delegate.updateZone(updatedZone, true);

        // Immediately start dragging the newly created vertex
        this.draggingVertex = {
          zoneId,
          vertexIndex: segmentIndex + 1,
          pointerId: e.pointerId,
        };
        this.delegate.setState('dragging_vertex');
        e.stopPropagation();
        return;
      }
    }

    // 4. Selecting a Zone
    const zoneItem = target.closest('.polylinai-zone-item') as SVGElement | null;
    if (zoneItem && zoneItem.dataset.zoneId) {
      const zoneId = zoneItem.dataset.zoneId;
      const zone = this.delegate.getZones().find((z) => z.id === zoneId) ?? null;
      this.delegate.setSelectedZone(zone);
      e.stopPropagation();
      return;
    }

    // 5. Clicking background deselects
    this.delegate.setSelectedZone(null);
  }

  private handlePointerMove(e: PointerEvent): void {
    const state = this.delegate.getState();

    // Rubber band rendering during active drawing
    if (state === 'drawing') {
      const normPt = this.getEventNormalizedPoint(e);
      const points = this.delegate.getActivePoints();
      const isPolygon = this.delegate.getDrawingMode() === 'polygon';
      const snapDist = this.options.snapDistancePx ?? 16;
      const rect = this.renderer.svg.getBoundingClientRect();

      let canSnap = false;
      if (isPolygon && points.length >= 3) {
        const firstPixel = toPixel(points[0], rect.width, rect.height);
        const currentPixel = this.getEventPixelPoint(e);
        canSnap = distance(firstPixel, currentPixel) <= snapDist;
      }

      this.renderer.renderActiveDrawing(points, normPt, isPolygon, canSnap);
      return;
    }

    // Dragging an existing vertex
    if (this.draggingVertex && state === 'dragging_vertex') {
      const normPt = this.getEventNormalizedPoint(e);
      const zone = this.delegate.getZones().find((z) => z.id === this.draggingVertex!.zoneId);
      if (zone) {
        const newPoints = [...zone.points];
        newPoints[this.draggingVertex.vertexIndex] = normPt;
        const updatedZone = { ...zone, points: newPoints };
        // Don't flood history stack on every move frame
        this.delegate.updateZone(updatedZone, false);
      }
    }
  }

  private handlePointerUp(_e: PointerEvent): void {
    if (this.draggingVertex) {
      // Commit final position to history
      const zone = this.delegate.getZones().find((z) => z.id === this.draggingVertex!.zoneId);
      if (zone) {
        this.delegate.updateZone(zone, true);
      }

      this.draggingVertex = null;
      this.delegate.setState('editing');
    }
  }

  private handleDblClick(e: MouseEvent): void {
    if (this.delegate.getState() === 'drawing') {
      e.preventDefault();
      this.delegate.finishDrawing();
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    const target = e.target as SVGElement;

    // Right-clicking a vertex handle deletes that vertex
    if (target.classList.contains('polylinai-handle-vertex')) {
      e.preventDefault();
      const zoneId = target.dataset.zoneId;
      const vertexIndex = parseInt(target.dataset.vertexIndex ?? '-1', 10);
      const zone = this.delegate.getZones().find((z) => z.id === zoneId);

      if (zone && vertexIndex >= 0) {
        const updatedPoints = removeVertex(zone.points, vertexIndex, zone.closed);
        if (updatedPoints) {
          const updatedZone = { ...zone, points: updatedPoints };
          this.delegate.updateZone(updatedZone, true);
        } else {
          // Warning/Alert: cannot delete below min vertices
          console.warn(`[PolylinAI] Cannot remove vertex: minimum ${zone.closed ? 3 : 2} points required.`);
        }
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.delegate.getState() === 'drawing') {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.delegate.finishDrawing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.delegate.cancelDrawing();
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const selected = this.delegate.getSelectedZone();
      if (selected && document.activeElement === document.body) {
        // Can optionally delete selected zone or handle via engine
      }
    }
  }
}
