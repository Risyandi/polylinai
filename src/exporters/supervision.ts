/**
 * PolylinAI - Roboflow Supervision Exporter
 * Formats ROI zones and tripwires for use with Supervision LineZone and ZoneAnnotator.
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import { RoiZone } from '../types';

export interface SupervisionExportOptions {
  frameResolution?: { width: number; height: number };
}

/**
 * Exports zones formatted for Roboflow / Supervision Python ecosystem.
 */
export function exportToSupervision(
  zones: RoiZone[],
  options?: SupervisionExportOptions
): object {
  const width = options?.frameResolution?.width ?? 1920;
  const height = options?.frameResolution?.height ?? 1080;

  return {
    version: '1.0',
    generator: 'PolylinAI',
    frame_resolution: { width, height },
    zones: zones
      .filter((z) => z.type === 'polygon' && z.points.length >= 3)
      .map((z) => ({
        id: z.id,
        name: z.name,
        color: z.color,
        polygon: z.points.map((p) => [Math.round(p.x * width), Math.round(p.y * height)]),
        normalized_polygon: z.points.map((p) => [p.x, p.y]),
        direction: z.direction?.type ?? null,
      })),
    line_zones: zones
      .filter((z) => z.type === 'polyline' && z.points.length >= 2)
      .map((z) => ({
        id: z.id,
        name: z.name,
        color: z.color,
        line: z.points.map((p) => [Math.round(p.x * width), Math.round(p.y * height)]),
        normalized_line: z.points.map((p) => [p.x, p.y]),
        trigger_direction: z.direction?.type ?? 'BIDIRECTIONAL',
        trigger_vector: z.direction?.vector
          ? {
              start: [
                Math.round(z.direction.vector.from.x * width),
                Math.round(z.direction.vector.from.y * height),
              ],
              end: [
                Math.round(z.direction.vector.to.x * width),
                Math.round(z.direction.vector.to.y * height),
              ],
            }
          : null,
      })),
  };
}
