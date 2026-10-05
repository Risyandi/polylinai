import { RoiZone } from '../types';

export interface OpenCvExportOptions {
  /** Target video/image native width (e.g., 1920) */
  targetWidth: number;
  /** Target video/image native height (e.g., 1080) */
  targetHeight: number;
}

export interface OpenCvZoneData {
  id: string;
  name: string;
  type: 'polygon' | 'polyline';
  closed: boolean;
  points: Array<[number, number]>;
  direction?: {
    type: string;
    angleDeg?: number;
    vectorPx?: { from: [number, number]; to: [number, number] };
  };
}

/**
 * Exports zones as pixel coordinate arrays scaled to target video resolution.
 * Suitable for direct ingestion into `np.array(pts, np.int32)` and `cv2.polylines()`.
 */
export function exportToOpenCv(
  zones: RoiZone[],
  options: OpenCvExportOptions
): OpenCvZoneData[] {
  const { targetWidth, targetHeight } = options;

  return zones.map((zone) => {
    const points: Array<[number, number]> = zone.points.map((p) => [
      Math.round(p.x * targetWidth),
      Math.round(p.y * targetHeight),
    ]);

    let directionData: OpenCvZoneData['direction'] = undefined;
    if (zone.direction) {
      directionData = {
        type: zone.direction.type,
        angleDeg: zone.direction.angleDeg,
      };

      if (zone.direction.vector) {
        directionData.vectorPx = {
          from: [
            Math.round(zone.direction.vector.from.x * targetWidth),
            Math.round(zone.direction.vector.from.y * targetHeight),
          ],
          to: [
            Math.round(zone.direction.vector.to.x * targetWidth),
            Math.round(zone.direction.vector.to.y * targetHeight),
          ],
        };
      }
    }

    return {
      id: zone.id,
      name: zone.name,
      type: zone.type,
      closed: zone.closed,
      points,
      direction: directionData,
    };
  });
}

/**
 * Generates ready-to-run Python OpenCV script snippet.
 */
export function generateOpenCvPythonSnippet(
  zones: RoiZone[],
  options: OpenCvExportOptions
): string {
  const data = exportToOpenCv(zones, options);

  return `import cv2
import numpy as np

# PolylinAI Export for OpenCV (Target: ${options.targetWidth}x${options.targetHeight})
ROIS = ${JSON.stringify(data, null, 2)}

def draw_polylinai_zones(frame):
    for roi in ROIS:
        pts = np.array(roi["points"], np.int32).reshape((-1, 1, 2))
        is_closed = roi["closed"]
        color = (0, 255, 0) if is_closed else (0, 165, 255)
        cv2.polylines(frame, [pts], isClosed=is_closed, color=color, thickness=2)
        
        # Draw label
        if len(roi["points"]) > 0:
            first_pt = roi["points"][0]
            cv2.putText(frame, roi["name"], (first_pt[0], max(20, first_pt[1] - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)
                        
        # Draw direction vector if defined
        if "direction" in roi and roi["direction"] and "vectorPx" in roi["direction"]:
            vec = roi["direction"]["vectorPx"]
            pt1 = tuple(vec["from"])
            pt2 = tuple(vec["to"])
            cv2.arrowedLine(frame, pt1, pt2, (0, 0, 255), 2, tipLength=0.3)
            
    return frame
`;
}
