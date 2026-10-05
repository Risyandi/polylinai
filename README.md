# PolylinAI

> High-performance, zero-dependency SVG Region of Interest (ROI) and Polyline drawing library for AI Computer Vision video feeds.

[![CI](https://github.com/risyandi/polylinai/actions/workflows/ci.yml/badge.svg)](https://github.com/risyandi/polylinai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**PolylinAI** enables users to interactively draw, adjust, and configure custom detection zones and directional tripwires over live camera feeds, recorded videos, or static frames. It exports standardized geometric and directional metadata for Computer Vision pipelines (YOLO, OpenCV, Roboflow, Supervision).

---

## Key Features

- **Arbitrary N-Point Polygons & Lines**: No 4-point or rectangular limitations. Draw complex multi-vertex polygons for zone monitoring or open polylines for tripwires.
- **Dynamic Midpoint Vertex Insertion**: Click on any edge segment or midpoint handle to add new vertices dynamically.
- **Directional Counting & Flow Metadata**:
  - **Cardinal Directions**: `NORTH`, `SOUTH`, `EAST`, `WEST`, `NORTH_EAST`, `NORTH_WEST`, `SOUTH_EAST`, `SOUTH_WEST`.
  - **Movement Flows**: `STRAIGHT`, `BIDIRECTIONAL`, `TURN_LEFT`, `TURN_RIGHT`, `INTERSECTION`, `T_JUNCTION`.
  - Visual directional arrows rendered natively on zones.
- **Pure SVG Overlay (Zero Dependencies)**:
  - Ultra-lightweight core (under 6 KB gzipped).
  - No bloated canvas engines (no Fabric.js, no Konva).
  - Resolution-independent SVG `viewBox` locks perfectly to responsive containers and fullscreen streams.
- **Computer Vision Output Ready**:
  - Export to **YOLO** segmentation format (`class_id x1 y1 x2 y2 ...`).
  - Export to **OpenCV** scaled pixel coordinates + ready-to-run Python scripts.
  - Export to **Roboflow / Supervision** JSON format.
- **Undo / Redo Stack**: Built-in immutable history manager.
- **Cross-Platform Pointer Events**: Seamless mouse, stylus, and touch interaction.

---

## Installation

```bash
npm install polylinai
```

Or via yarn / pnpm:

```bash
pnpm add polylinai
```

---

## Quick Start

```html
<div id="video-wrapper" style="position: relative; width: 100%; aspect-ratio: 16/9;">
  <video src="cctv_feed.mp4" autoplay loop muted style="width: 100%; height: 100%;"></video>
</div>
```

```typescript
import { PolylinAI } from 'polylinai';

const wrapper = document.getElementById('video-wrapper')!;

// 1. Initialize PolylinAI
const polylin = new PolylinAI({
  container: wrapper,
  defaultMode: 'polygon',
  snapDistancePx: 16,
  showDirectionArrows: true,
  onChange: (zones) => {
    console.log('Active zones updated:', zones);
  },
  onZoneSelected: (zone) => {
    console.log('Selected zone:', zone);
  },
});

// 2. Start drawing a zone
polylin.startDrawing('polygon', {
  name: 'Parking Inflow Zone',
  color: '#10b981',
});

// 3. Set a directional counting constraint
polylin.setZoneDirection('zone-id', 'NORTH');

// 4. Export for AI Computer Vision
const yoloString = polylin.exportAsYolo();
const openCvData = polylin.exportAsOpenCv(1920, 1080);
const pythonScript = polylin.generateOpenCvPython(1920, 1080);
```

---

## User Interaction Controls

| Action | Gesture / Key |
| --- | --- |
| **Add Vertex** | Click on the video container during drawing mode. |
| **Close Polygon** | Click the initial vertex handle, or double-click anywhere. |
| **Insert Vertex (Edge Split)** | Click the semi-transparent midpoint handle on any segment. |
| **Move Vertex** | Click and drag any solid vertex handle. |
| **Delete Vertex** | Right-click on a vertex handle (enforces min 3 for polygons, 2 for lines). |
| **Complete Drawing** | Press `Enter` or call `finishDrawing()`. |
| **Cancel Drawing** | Press `Escape` or call `cancelDrawing()`. |
| **Undo / Redo** | `polylin.undo()` / `polylin.redo()`. |

---

## Computer Vision Integration

### 1. OpenCV (Python)

Export zones directly to pixel coordinates scaled to your camera's resolution:

```python
import cv2
import numpy as np

# Coordinates generated via polylin.exportAsOpenCv(1920, 1080)
roi_points = np.array([[384, 918], [883, 918], [921, 378], [729, 378]], np.int32)

def process_frame(frame):
    # Draw boundary
    cv2.polylines(frame, [roi_points], isClosed=True, color=(0, 255, 0), thickness=2)
    return frame
```

### 2. YOLO Segmentation

Export normalized polygon coordinates:

```text
0 0.200000 0.850000 0.460000 0.850000 0.480000 0.350000 0.380000 0.350000
```

---

## Configuration Options

```typescript
interface PolylinAiOptions {
  container: HTMLElement;
  videoElement?: HTMLVideoElement;
  defaultMode?: 'polygon' | 'polyline';
  maxZones?: number;
  snapDistancePx?: number;       // default: 16
  strokeWidthPx?: number;        // default: 2.5
  defaultColor?: string;         // default: '#10b981'
  activeColor?: string;          // default: '#3b82f6'
  showDirectionArrows?: boolean; // default: true
  enableEdgeSplit?: boolean;     // default: true
  onChange?: (zones: RoiZone[]) => void;
  onZoneSelected?: (zone: RoiZone | null) => void;
  onDrawComplete?: (zone: RoiZone) => void;
}
```

---

## Running the Demo

Clone the repo and run the local interactive studio:

```bash
npm install
npm run dev
```

Run test suite:

```bash
npm test
```

Build production distribution:

```bash
npm run build
```

---

## License

[MIT](LICENSE) © 2026 Risyandi
