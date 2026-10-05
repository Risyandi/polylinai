/**
 * PolylinAI - 2D Point & Coordinate Transformation Utilities
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import { PixelPoint, RoiPoint } from '../types';

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number = 0.0, max: number = 1.0): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamps a normalized point strictly to [0.0, 1.0].
 */
export function clampPoint(p: RoiPoint): RoiPoint {
  return {
    x: clamp(p.x, 0.0, 1.0),
    y: clamp(p.y, 0.0, 1.0),
  };
}

/**
 * Converts screen/container pixel coordinates to normalized (0.0 to 1.0) coordinates.
 */
export function toNormalized(pixel: PixelPoint, width: number, height: number): RoiPoint {
  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: clamp(pixel.x / width, 0.0, 1.0),
    y: clamp(pixel.y / height, 0.0, 1.0),
  };
}

/**
 * Converts normalized coordinates to pixel coordinates based on dimensions.
 */
export function toPixel(normalized: RoiPoint, width: number, height: number): PixelPoint {
  return {
    x: normalized.x * width,
    y: normalized.y * height,
  };
}

/**
 * Euclidean distance between two points in 2D space.
 */
export function distance(p1: PixelPoint, p2: PixelPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

/**
 * Normalized distance (0.0 to 1.0 space) between two RoiPoints.
 */
export function distanceNormalized(p1: RoiPoint, p2: RoiPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

/**
 * Calculates midpoint between two points.
 */
export function midpoint(p1: RoiPoint, p2: RoiPoint): RoiPoint {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculates perpendicular distance from a point to a line segment [a, b].
 * Returns the distance and the closest projected point on the segment.
 */
export function distanceToSegment(
  p: PixelPoint,
  a: PixelPoint,
  b: PixelPoint
): { distance: number; projection: PixelPoint; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { distance: distance(p, a), projection: { ...a }, t: 0 };
  }

  // Parameter t of projection onto line segment
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projection: PixelPoint = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return {
    distance: distance(p, projection),
    projection,
    t,
  };
}
