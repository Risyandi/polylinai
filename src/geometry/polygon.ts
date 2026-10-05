import { PixelPoint, RoiPoint } from '../types';
import { distanceToSegment, midpoint } from './point';

/**
 * Checks if a point is inside a polygon using ray casting algorithm.
 */
export function isPointInPolygon(point: RoiPoint, polygon: RoiPoint[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.x;
  const y = point.y;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Computes polygon centroid (center of mass).
 */
export function getPolygonCentroid(points: RoiPoint[]): RoiPoint {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  if (points.length === 1) return { ...points[0] };
  if (points.length === 2) return midpoint(points[0], points[1]);

  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = points[i];
    const p2 = points[j];
    const factor = p1.x * p2.y - p2.x * p1.y;
    area += factor;
    cx += (p1.x + p2.x) * factor;
    cy += (p1.y + p2.y) * factor;
  }

  area /= 2;
  if (Math.abs(area) < 1e-6) {
    // Fallback to simple average if degenerate polygon
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    return { x: sumX / n, y: sumY / n };
  }

  cx /= 6 * area;
  cy /= 6 * area;

  return { x: cx, y: cy };
}

/**
 * Computes bounding box of points in normalized space.
 */
export function getBoundingBox(points: RoiPoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Finds the closest edge segment to a pixel point.
 * Useful for clicking on an edge to dynamically insert a new vertex.
 */
export function findClosestEdge(
  p: PixelPoint,
  points: PixelPoint[],
  isClosed: boolean,
  thresholdPx: number = 16
): { segmentIndex: number; insertedPoint: PixelPoint; distance: number } | null {
  if (points.length < 2) return null;

  let bestDist = Infinity;
  let bestIndex = -1;
  let bestProj: PixelPoint | null = null;

  const numSegments = isClosed ? points.length : points.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];

    const { distance: dist, projection, t } = distanceToSegment(p, a, b);

    // Only consider points strictly within the interior of the segment (not endpoints)
    if (t > 0.05 && t < 0.95 && dist < bestDist && dist <= thresholdPx) {
      bestDist = dist;
      bestIndex = i;
      bestProj = projection;
    }
  }

  if (bestIndex !== -1 && bestProj) {
    return {
      segmentIndex: bestIndex,
      insertedPoint: bestProj,
      distance: bestDist,
    };
  }

  return null;
}

/**
 * Inserts a vertex at the specified edge segment index.
 */
export function insertVertex(points: RoiPoint[], segmentIndex: number, newPoint: RoiPoint): RoiPoint[] {
  const result = [...points];
  result.splice(segmentIndex + 1, 0, newPoint);
  return result;
}

/**
 * Removes a vertex at the specified index, respecting minimum point constraints.
 */
export function removeVertex(points: RoiPoint[], index: number, isClosed: boolean): RoiPoint[] | null {
  const minPoints = isClosed ? 3 : 2;
  if (points.length <= minPoints) {
    return null; // Cannot remove below minimum constraint
  }
  const result = [...points];
  result.splice(index, 1);
  return result;
}

/**
 * Serializes points to an SVG points attribute string based on coordinate dimensions.
 */
export function pointsToSvgString(points: RoiPoint[], width: number, height: number): string {
  return points.map((p) => `${(p.x * width).toFixed(2)},${(p.y * height).toFixed(2)}`).join(' ');
}
