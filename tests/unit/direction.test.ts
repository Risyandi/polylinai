/**
 * PolylinAI - Unit Tests: Directional Vectors & Cardinal Angles
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import { describe, expect, it } from 'vitest';
import {
  angleToCardinal,
  buildRoiDirection,
  calculateBearing,
  calculateTripwireNormal,
  CARDINAL_ANGLES,
  createDirectionVector,
} from '../../src/geometry/direction';

describe('Directional Vector & Cardinal Mapping', () => {
  it('correctly maps angles to Cardinal directions', () => {
    expect(angleToCardinal(0)).toBe('NORTH');
    expect(angleToCardinal(360)).toBe('NORTH');
    expect(angleToCardinal(90)).toBe('EAST');
    expect(angleToCardinal(180)).toBe('SOUTH');
    expect(angleToCardinal(270)).toBe('WEST');
    expect(angleToCardinal(42)).toBe('NORTH_EAST');
    expect(angleToCardinal(220)).toBe('SOUTH_WEST');
  });

  it('calculates bearing angle between two points', () => {
    // Upwards movement (North)
    const north = calculateBearing({ x: 0.5, y: 0.8 }, { x: 0.5, y: 0.2 });
    expect(north).toBe(0);

    // Rightwards movement (East)
    const east = calculateBearing({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 });
    expect(east).toBe(90);

    // Downwards movement (South)
    const south = calculateBearing({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 });
    expect(south).toBe(180);

    // Leftwards movement (West)
    const west = calculateBearing({ x: 0.8, y: 0.5 }, { x: 0.2, y: 0.5 });
    expect(west).toBe(270);
  });

  it('builds standard RoiDirection structure with vector', () => {
    const anchor = { x: 0.5, y: 0.5 };
    const dir = buildRoiDirection('NORTH', anchor);

    expect(dir.type).toBe('NORTH');
    expect(dir.angleDeg).toBe(CARDINAL_ANGLES.NORTH);
    expect(dir.vector).toBeDefined();
    // In screen coords, North moves towards negative Y
    expect(dir.vector!.to.y).toBeLessThan(dir.vector!.from.y);
  });

  it('calculates perpendicular tripwire crossing vector', () => {
    // Horizontal tripwire from left to right
    const p1 = { x: 0.2, y: 0.5 };
    const p2 = { x: 0.8, y: 0.5 };

    const normal = calculateTripwireNormal(p1, p2, 0.1);
    expect(normal.from).toBeDefined();
    expect(normal.to).toBeDefined();
    // Normal should cross vertically
    expect(normal.from.x).toBeCloseTo(0.5);
    expect(normal.to.x).toBeCloseTo(0.5);
  });

  it('creates direction vector with custom length', () => {
    const vec = createDirectionVector({ x: 0.5, y: 0.5 }, 90, 0.2);
    // 90 deg is East, so x increases, y stays ~0.5
    expect(vec.from.y).toBeCloseTo(0.5);
    expect(vec.to.y).toBeCloseTo(0.5);
    expect(vec.to.x).toBeGreaterThan(vec.from.x);
  });
});
