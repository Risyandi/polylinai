/**
 * PolylinAI - YOLO Segmentation Exporter
 * Formats normalized polygon coordinates into standard YOLO segmentation annotation format.
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import { RoiZone } from '../types';

export interface YoloExportOptions {
  /** Default class ID if not specified on the zone (default: 0) */
  defaultClassId?: number;
  /** Function to map zone to a class ID */
  classIdMapper?: (zone: RoiZone, index: number) => number;
  /** Coordinate decimal precision (default: 6) */
  precision?: number;
}

/**
 * Exports zones as YOLO segmentation format strings.
 * Each line follows the format: `<class_id> <x1> <y1> <x2> <y2> ... <xn> <yn>`
 * All coordinates are normalized (0.0 to 1.0).
 */
export function exportToYolo(zones: RoiZone[], options?: YoloExportOptions): string {
  const defaultClassId = options?.defaultClassId ?? 0;
  const precision = options?.precision ?? 6;

  return zones
    .filter((zone) => zone.points.length >= 3)
    .map((zone, index) => {
      const classId = options?.classIdMapper
        ? options.classIdMapper(zone, index)
        : defaultClassId;

      const coords = zone.points
        .map((p) => `${p.x.toFixed(precision)} ${p.y.toFixed(precision)}`)
        .join(' ');

      return `${classId} ${coords}`;
    })
    .join('\n');
}
