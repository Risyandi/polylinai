/**
 * PolylinAI - TypeScript Type Definitions
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

export interface RoiPoint {
  /** Normalized X coordinate between 0.0 and 1.0 */
  x: number;
  /** Normalized Y coordinate between 0.0 and 1.0 */
  y: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export type CardinalDirection =
  | 'NORTH'
  | 'SOUTH'
  | 'EAST'
  | 'WEST'
  | 'NORTH_EAST'
  | 'NORTH_WEST'
  | 'SOUTH_EAST'
  | 'SOUTH_WEST';

export type MovementFlow =
  | 'STRAIGHT'
  | 'BIDIRECTIONAL'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'INTERSECTION'
  | 'T_JUNCTION';

export type DirectionType = CardinalDirection | MovementFlow;

export interface RoiDirection {
  type: DirectionType;
  /** Angle in degrees (0 = North / pointing up, 90 = East / right, 180 = South, 270 = West) */
  angleDeg?: number;
  /** Explicit directional vector in normalized coordinates (from -> to) */
  vector?: { from: RoiPoint; to: RoiPoint };
  customLabel?: string;
}

export interface RoiZone {
  id: string;
  name: string;
  type: 'polygon' | 'polyline';
  /** Array of normalized points (0.0 to 1.0) */
  points: RoiPoint[];
  /** Optional directional flow constraint for counting/alerts */
  direction?: RoiDirection;
  /** Hex or CSS color string for stroke and fill */
  color: string;
  /** Whether the zone boundary is closed (polygon) or open (polyline/tripwire) */
  closed: boolean;
  opacity?: number;
}

export interface PolylinAiOptions {
  /** The container HTMLElement to which the SVG overlay is mounted */
  container: HTMLElement;
  /** Optional HTMLVideoElement to automatically sync aspect ratio and native resolution */
  videoElement?: HTMLVideoElement;
  /** Default drawing mode when starting to draw without explicit parameter */
  defaultMode?: 'polygon' | 'polyline';
  /** Maximum number of zones allowed simultaneously (defaults to unlimited) */
  maxZones?: number;
  /** Proximity in pixels to snap to the origin vertex to close a polygon (default: 16) */
  snapDistancePx?: number;
  /** Stroke width in pixels (default: 2.5) */
  strokeWidthPx?: number;
  /** Default color for completed zones */
  defaultColor?: string;
  /** Highlight color for the zone currently being edited or selected */
  activeColor?: string;
  /** Whether to visually render direction arrows for zones with direction metadata */
  showDirectionArrows?: boolean;
  /** Allow clicking on any segment edge to insert a new vertex (default: true) */
  enableEdgeSplit?: boolean;
  /** Callback fired whenever zones are added, modified, deleted, or loaded */
  onChange?: (zones: RoiZone[]) => void;
  /** Callback fired when a zone is selected or deselected */
  onZoneSelected?: (zone: RoiZone | null) => void;
  /** Callback fired when a user completes drawing a new zone */
  onDrawComplete?: (zone: RoiZone) => void;
}

export type DrawingState = 'idle' | 'drawing' | 'dragging_vertex' | 'editing';
