// Core Engine
export { PolylinAI } from './core/engine';

// Types
export type {
  RoiPoint,
  PixelPoint,
  RoiDirection,
  RoiZone,
  DirectionType,
  CardinalDirection,
  MovementFlow,
  PolylinAiOptions,
  DrawingState,
} from './types';

// Geometry & Vector Math
export {
  clamp,
  clampPoint,
  toNormalized,
  toPixel,
  distance,
  distanceNormalized,
  midpoint,
  distanceToSegment,
} from './geometry/point';

export {
  isPointInPolygon,
  getPolygonCentroid,
  getBoundingBox,
  findClosestEdge,
  insertVertex,
  removeVertex,
  pointsToSvgString,
} from './geometry/polygon';

export {
  CARDINAL_ANGLES,
  angleToCardinal,
  calculateBearing,
  createDirectionVector,
  buildRoiDirection,
  calculateTripwireNormal,
} from './geometry/direction';

// Computer Vision Exporters
export { exportToYolo, type YoloExportOptions } from './exporters/yolo';
export {
  exportToOpenCv,
  generateOpenCvPythonSnippet,
  type OpenCvExportOptions,
  type OpenCvZoneData,
} from './exporters/opencv';
export {
  exportToSupervision,
  type SupervisionExportOptions,
} from './exporters/supervision';
