import { describe, expect, it } from 'vitest';
import {
  clamp,
  clampPoint,
  distance,
  distanceNormalized,
  distanceToSegment,
  midpoint,
  toNormalized,
  toPixel,
} from '../../src/geometry/point';
import {
  findClosestEdge,
  getBoundingBox,
  getPolygonCentroid,
  insertVertex,
  isPointInPolygon,
  removeVertex,
} from '../../src/geometry/polygon';
import { RoiPoint } from '../../src/types';

describe('Point Utilities', () => {
  it('clamps numbers and points strictly between 0 and 1', () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(1.5)).toBe(1);
    expect(clamp(0.42)).toBe(0.42);

    const clampedPt = clampPoint({ x: -0.2, y: 1.8 });
    expect(clampedPt).toEqual({ x: 0, y: 1 });
  });

  it('converts pixel coordinates to normalized 0..1 coordinates', () => {
    const norm = toNormalized({ x: 960, y: 540 }, 1920, 1080);
    expect(norm.x).toBeCloseTo(0.5);
    expect(norm.y).toBeCloseTo(0.5);

    const px = toPixel({ x: 0.5, y: 0.5 }, 1920, 1080);
    expect(px.x).toBe(960);
    expect(px.y).toBe(540);
  });

  it('calculates Euclidean distance and midpoint', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(distance(p1, p2)).toBe(5);

    expect(distanceNormalized({ x: 0, y: 0 }, { x: 0.3, y: 0.4 })).toBeCloseTo(0.5);

    const mid = midpoint({ x: 0.2, y: 0.4 }, { x: 0.4, y: 0.8 });
    expect(mid.x).toBeCloseTo(0.3);
    expect(mid.y).toBeCloseTo(0.6);
  });

  it('calculates distance to line segment correctly', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 100, y: 0 };
    const p = { x: 50, y: 25 };

    const { distance: d, projection, t } = distanceToSegment(p, a, b);
    expect(d).toBe(25);
    expect(projection).toEqual({ x: 50, y: 0 });
    expect(t).toBeCloseTo(0.5);
  });
});

describe('Polygon Utilities & Dynamic N-Point Editing', () => {
  const square: RoiPoint[] = [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.8, y: 0.8 },
    { x: 0.2, y: 0.8 },
  ];

  it('determines if a point is inside a polygon using ray casting', () => {
    expect(isPointInPolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
    expect(isPointInPolygon({ x: 0.1, y: 0.1 }, square)).toBe(false);
    expect(isPointInPolygon({ x: 0.9, y: 0.5 }, square)).toBe(false);
  });

  it('computes accurate polygon centroid', () => {
    const centroid = getPolygonCentroid(square);
    expect(centroid.x).toBeCloseTo(0.5);
    expect(centroid.y).toBeCloseTo(0.5);
  });

  it('calculates bounding box', () => {
    const bbox = getBoundingBox(square);
    expect(bbox.minX).toBeCloseTo(0.2);
    expect(bbox.maxX).toBeCloseTo(0.8);
    expect(bbox.width).toBeCloseTo(0.6);
  });

  it('inserts a new vertex at edge segment (dynamic splitting)', () => {
    const newPt: RoiPoint = { x: 0.5, y: 0.2 };
    // Insert on top edge (between vertex 0 and 1)
    const updated = insertVertex(square, 0, newPt);
    expect(updated.length).toBe(5);
    expect(updated[1]).toEqual(newPt);
  });

  it('removes vertex respecting minimum point constraints', () => {
    // Square has 4 points. Can remove one down to 3.
    const triangle = removeVertex(square, 0, true);
    expect(triangle).not.toBeNull();
    expect(triangle!.length).toBe(3);

    // Triangle has 3 points. Closed polygon cannot be reduced below 3.
    const invalid = removeVertex(triangle!, 0, true);
    expect(invalid).toBeNull();

    // Polyline with 2 points cannot be reduced below 2.
    const line: RoiPoint[] = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.9 },
    ];
    expect(removeVertex(line, 0, false)).toBeNull();
  });

  it('detects closest edge for dynamic insertion', () => {
    const pixelPoints = [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 300 },
      { x: 100, y: 300 },
    ];

    const clickPoint = { x: 200, y: 105 }; // Close to top edge
    const result = findClosestEdge(clickPoint, pixelPoints, true, 20);

    expect(result).not.toBeNull();
    expect(result!.segmentIndex).toBe(0);
    expect(result!.insertedPoint.x).toBeCloseTo(200);
    expect(result!.insertedPoint.y).toBeCloseTo(100);
  });
});
