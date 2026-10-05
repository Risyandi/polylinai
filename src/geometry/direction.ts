import { CardinalDirection, DirectionType, RoiDirection, RoiPoint } from '../types';
import { clampPoint } from './point';

/**
 * Degrees mapped to Cardinal directions.
 * 0° / 360° is North (pointing up / negative Y in screen coordinates).
 * 90° is East (positive X).
 * 180° is South (positive Y).
 * 270° is West (negative X).
 */
export const CARDINAL_ANGLES: Record<CardinalDirection, number> = {
  NORTH: 0,
  NORTH_EAST: 45,
  EAST: 90,
  SOUTH_EAST: 135,
  SOUTH: 180,
  SOUTH_WEST: 225,
  WEST: 270,
  NORTH_WEST: 315,
};

/**
 * Converts an angle (in degrees) into the closest Cardinal Direction.
 */
export function angleToCardinal(angleDeg: number): CardinalDirection {
  const normalizedAngle = ((angleDeg % 360) + 360) % 360;
  const sectors: Array<{ dir: CardinalDirection; angle: number }> = [
    { dir: 'NORTH', angle: 0 },
    { dir: 'NORTH_EAST', angle: 45 },
    { dir: 'EAST', angle: 90 },
    { dir: 'SOUTH_EAST', angle: 135 },
    { dir: 'SOUTH', angle: 180 },
    { dir: 'SOUTH_WEST', angle: 225 },
    { dir: 'WEST', angle: 270 },
    { dir: 'NORTH_WEST', angle: 315 },
    { dir: 'NORTH', angle: 360 },
  ];

  let closest = sectors[0].dir;
  let minDiff = Infinity;

  for (const item of sectors) {
    const diff = Math.abs(normalizedAngle - item.angle);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item.dir;
    }
  }

  return closest;
}

/**
 * Computes bearing angle in degrees between two normalized points.
 * 0° points UP (North, dy < 0), 90° points RIGHT (East, dx > 0).
 */
export function calculateBearing(from: RoiPoint, to: RoiPoint): number {
  const dx = to.x - from.x;
  // Screen Y is inverted (0 is top, 1 is bottom)
  const dy = -(to.y - from.y);

  // Math.atan2 returns angle in radians from positive X axis counterclockwise
  let theta = Math.atan2(dx, dy); // note: atan2(x, y) gives angle from positive Y (North)
  let degrees = (theta * 180) / Math.PI;
  if (degrees < 0) {
    degrees += 360;
  }
  return Math.round(degrees);
}

/**
 * Calculates a direction vector centered at an anchor point with given angle and length.
 * Length is in normalized coordinates (e.g. 0.08 of screen).
 */
export function createDirectionVector(
  anchor: RoiPoint,
  angleDeg: number,
  lengthNormalized: number = 0.08
): { from: RoiPoint; to: RoiPoint } {
  const rad = (angleDeg * Math.PI) / 180;
  // In screen space:
  // dx = sin(angle) * length
  // dy = -cos(angle) * length (because Y points down)
  const dx = Math.sin(rad) * lengthNormalized;
  const dy = -Math.cos(rad) * lengthNormalized;

  return {
    from: clampPoint({
      x: anchor.x - dx / 2,
      y: anchor.y - dy / 2,
    }),
    to: clampPoint({
      x: anchor.x + dx / 2,
      y: anchor.y + dy / 2,
    }),
  };
}

/**
 * Builds standard RoiDirection metadata from a DirectionType.
 */
export function buildRoiDirection(
  type: DirectionType,
  anchor: RoiPoint,
  customAngle?: number
): RoiDirection {
  let angle = customAngle;
  if (angle === undefined) {
    if (type in CARDINAL_ANGLES) {
      angle = CARDINAL_ANGLES[type as CardinalDirection];
    } else {
      switch (type) {
        case 'STRAIGHT':
          angle = 0; // North / Forward by default
          break;
        case 'TURN_LEFT':
          angle = 270;
          break;
        case 'TURN_RIGHT':
          angle = 90;
          break;
        default:
          angle = 0;
      }
    }
  }

  const vector = createDirectionVector(anchor, angle);

  return {
    type,
    angleDeg: angle,
    vector,
  };
}

/**
 * Calculates the perpendicular crossing vector for a tripwire segment.
 */
export function calculateTripwireNormal(
  p1: RoiPoint,
  p2: RoiPoint,
  lengthNormalized: number = 0.06
): { from: RoiPoint; to: RoiPoint; angleDeg: number } {
  const mid: RoiPoint = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);

  if (len === 0) {
    return {
      from: mid,
      to: mid,
      angleDeg: 0,
    };
  }

  // Normal vector: (-dy, dx)
  const nx = -dy / len;
  const ny = dx / len;

  const to: RoiPoint = clampPoint({
    x: mid.x + nx * lengthNormalized,
    y: mid.y + ny * lengthNormalized,
  });

  const from: RoiPoint = clampPoint({
    x: mid.x - nx * lengthNormalized,
    y: mid.y - ny * lengthNormalized,
  });

  const angleDeg = calculateBearing(from, to);

  return { from, to, angleDeg };
}
