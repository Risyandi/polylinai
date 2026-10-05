/**
 * PolylinAI - Core Engine Controller
 * Manages Region of Interest (ROI) drawing lifecycle, zones, and exports.
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import {
  DirectionType,
  DrawingState,
  PolylinAiOptions,
  RoiDirection,
  RoiPoint,
  RoiZone,
} from '../types';
import { SvgRenderer } from './renderer';
import { EventManager, EventManagerDelegate } from './event-manager';
import { HistoryManager } from './history';
import { buildRoiDirection } from '../geometry/direction';
import { getPolygonCentroid } from '../geometry/polygon';
import { exportToYolo, YoloExportOptions } from '../exporters/yolo';
import {
  exportToOpenCv,
  generateOpenCvPythonSnippet,
  OpenCvZoneData,
} from '../exporters/opencv';
import { exportToSupervision, SupervisionExportOptions } from '../exporters/supervision';

export class PolylinAI implements EventManagerDelegate {
  private container: HTMLElement;
  private options: PolylinAiOptions;
  private renderer: SvgRenderer;
  private eventManager: EventManager;
  private history: HistoryManager;

  private state: DrawingState = 'idle';
  private drawingMode: 'polygon' | 'polyline' = 'polygon';
  private activePoints: RoiPoint[] = [];
  private activeZoneConfig: Partial<RoiZone> = {};

  private zones: RoiZone[] = [];
  private selectedZoneId: string | null = null;

  constructor(options: PolylinAiOptions) {
    this.options = {
      defaultMode: 'polygon',
      snapDistancePx: 16,
      strokeWidthPx: 2.5,
      defaultColor: '#10b981',
      activeColor: '#3b82f6',
      showDirectionArrows: true,
      enableEdgeSplit: true,
      ...options,
    };

    this.container = options.container;
    this.history = new HistoryManager();
    this.renderer = new SvgRenderer(this.container, this.options);
    this.eventManager = new EventManager(this.container, this.renderer, this, this.options);

    this.render();
  }

  // --- Delegate Methods for EventManager ---

  public getState(): DrawingState {
    return this.state;
  }

  public setState(state: DrawingState): void {
    this.state = state;
    this.updateCursor();
  }

  public getActivePoints(): RoiPoint[] {
    return this.activePoints;
  }

  public setActivePoints(points: RoiPoint[]): void {
    this.activePoints = points;
  }

  public getDrawingMode(): 'polygon' | 'polyline' {
    return this.drawingMode;
  }

  public getSelectedZone(): RoiZone | null {
    return this.zones.find((z) => z.id === this.selectedZoneId) ?? null;
  }

  public setSelectedZone(zone: RoiZone | null): void {
    this.selectedZoneId = zone?.id ?? null;
    this.render();
    if (this.options.onZoneSelected) {
      this.options.onZoneSelected(zone);
    }
  }

  public getZones(): RoiZone[] {
    return [...this.zones];
  }

  public updateZone(updatedZone: RoiZone, saveHistory: boolean = true): void {
    const idx = this.zones.findIndex((z) => z.id === updatedZone.id);
    if (idx !== -1) {
      if (saveHistory) {
        this.history.push(this.zones);
      }
      this.zones[idx] = updatedZone;
      this.render();
      this.notifyChange();
    }
  }

  public notifyChange(): void {
    if (this.options.onChange) {
      this.options.onChange(this.getZones());
    }
  }

  // --- Public API ---

  /**
   * Starts drawing a new Zone (polygon or tripwire polyline).
   */
  public startDrawing(mode?: 'polygon' | 'polyline', config?: Partial<RoiZone>): void {
    if (this.options.maxZones && this.zones.length >= this.options.maxZones) {
      console.warn(`[PolylinAI] Maximum zones (${this.options.maxZones}) reached.`);
      return;
    }

    this.setSelectedZone(null);
    this.drawingMode = mode ?? this.options.defaultMode ?? 'polygon';
    this.activePoints = [];
    this.activeZoneConfig = config ?? {};
    this.state = 'drawing';
    this.updateCursor();
  }

  /**
   * Finishes the zone currently being drawn and commits it to the zones list.
   */
  public finishDrawing(): RoiZone | null {
    if (this.state !== 'drawing') return null;

    const minPoints = this.drawingMode === 'polygon' ? 3 : 2;
    if (this.activePoints.length < minPoints) {
      this.cancelDrawing();
      return null;
    }

    this.history.push(this.zones);

    const isClosed = this.drawingMode === 'polygon';
    const zoneId = this.activeZoneConfig.id ?? `roi-${Date.now().toString(36)}`;
    const zoneName =
      this.activeZoneConfig.name ??
      (isClosed ? `Zone ${this.zones.length + 1}` : `Tripwire ${this.zones.length + 1}`);
    const color = this.activeZoneConfig.color ?? this.options.defaultColor ?? '#10b981';

    const newZone: RoiZone = {
      id: zoneId,
      name: zoneName,
      type: this.drawingMode,
      points: [...this.activePoints],
      color,
      closed: isClosed,
      opacity: this.activeZoneConfig.opacity ?? 0.16,
      direction: this.activeZoneConfig.direction,
    };

    // If direction was not preset, initialize default flow if requested
    if (!newZone.direction && this.activeZoneConfig.direction) {
      newZone.direction = this.activeZoneConfig.direction;
    }

    this.zones.push(newZone);
    this.activePoints = [];
    this.activeZoneConfig = {};
    this.state = 'idle';
    this.renderer.clearActiveDrawing();
    this.selectedZoneId = newZone.id;
    this.updateCursor();

    this.render();
    this.notifyChange();

    if (this.options.onDrawComplete) {
      this.options.onDrawComplete(newZone);
    }

    return newZone;
  }

  /**
   * Cancels the current drawing in progress.
   */
  public cancelDrawing(): void {
    this.activePoints = [];
    this.activeZoneConfig = {};
    this.state = 'idle';
    this.renderer.clearActiveDrawing();
    this.updateCursor();
  }

  /**
   * Deletes a zone by ID.
   */
  public deleteZone(id: string): boolean {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return false;

    this.history.push(this.zones);
    this.zones.splice(idx, 1);
    if (this.selectedZoneId === id) {
      this.setSelectedZone(null);
    } else {
      this.render();
    }
    this.notifyChange();
    return true;
  }

  /**
   * Clears all zones.
   */
  public clearAllZones(): void {
    if (this.zones.length === 0) return;
    this.history.push(this.zones);
    this.zones = [];
    this.setSelectedZone(null);
    this.notifyChange();
  }

  /**
   * Sets or updates directional flow metadata for a zone.
   */
  public setZoneDirection(id: string, directionType: DirectionType, customAngle?: number): void {
    const zone = this.zones.find((z) => z.id === id);
    if (!zone) return;

    const anchor = getPolygonCentroid(zone.points);
    const direction: RoiDirection = buildRoiDirection(directionType, anchor, customAngle);

    this.updateZone({ ...zone, direction }, true);
  }

  /**
   * Removes directional metadata from a zone.
   */
  public removeZoneDirection(id: string): void {
    const zone = this.zones.find((z) => z.id === id);
    if (!zone) return;

    const updated = { ...zone };
    delete updated.direction;
    this.updateZone(updated, true);
  }

  /**
   * Bulk loads zones (replaces current zones).
   */
  public loadZones(zones: RoiZone[]): void {
    this.history.push(this.zones);
    this.zones = JSON.parse(JSON.stringify(zones));
    this.setSelectedZone(null);
    this.render();
    this.notifyChange();
  }

  /**
   * Undo last zone modification.
   */
  public undo(): boolean {
    const prev = this.history.undo(this.zones);
    if (prev) {
      this.zones = prev;
      this.setSelectedZone(null);
      this.render();
      this.notifyChange();
      return true;
    }
    return false;
  }

  /**
   * Redo last undone modification.
   */
  public redo(): boolean {
    const next = this.history.redo(this.zones);
    if (next) {
      this.zones = next;
      this.setSelectedZone(null);
      this.render();
      this.notifyChange();
      return true;
    }
    return false;
  }

  // --- Computer Vision Exporters ---

  /**
   * Exports polygon zones in YOLO segmentation format.
   */
  public exportAsYolo(options?: YoloExportOptions): string {
    return exportToYolo(this.zones, options);
  }

  /**
   * Exports zones as scaled pixel coordinates for OpenCV.
   */
  public exportAsOpenCv(width: number, height: number): OpenCvZoneData[] {
    return exportToOpenCv(this.zones, { targetWidth: width, targetHeight: height });
  }

  /**
   * Generates a ready-to-run Python script with OpenCV drawing functions.
   */
  public generateOpenCvPython(width: number, height: number): string {
    return generateOpenCvPythonSnippet(this.zones, { targetWidth: width, targetHeight: height });
  }

  /**
   * Exports zones formatted for Roboflow Supervision.
   */
  public exportAsSupervision(options?: SupervisionExportOptions): object {
    return exportToSupervision(this.zones, options);
  }

  // --- Internal Rendering & Lifecycle ---

  private render(): void {
    this.renderer.renderZones(this.zones, this.selectedZoneId);
  }

  private updateCursor(): void {
    if (this.state === 'drawing') {
      this.renderer.svg.style.cursor = 'crosshair';
    } else {
      this.renderer.svg.style.cursor = 'default';
    }
  }

  /**
   * Cleans up event listeners and removes SVG DOM element.
   */
  public destroy(): void {
    this.eventManager.detach();
    this.renderer.destroy();
  }
}
