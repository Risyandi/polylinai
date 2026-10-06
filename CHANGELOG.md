# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] - 2026-10-05

### Initial General Availability (GA) Release

**PolylinAI** is a high-performance, zero-dependency SVG Region of Interest (ROI) and Polyline drawing library for AI Computer Vision video feeds, designed to configure detection zones and directional tripwires with normalized coordinates.

### Added

#### Core Engine & Dynamic Geometry

- **Dynamic N-Point Polygons & Lines**: Support for arbitrary 3-to-N point closed polygon zones and 2-to-N point open tripwire polylines (no 4-point/box limitations).
- **Dynamic Edge Splitting**: Click on any segment edge or semi-transparent midpoint handle to insert a new vertex dynamically.
- **Interactive Vertex Management**: Drag vertices with native pointer capture; right-click on handles to delete vertices (protected by minimum bounds: 3 for polygons, 2 for polylines).
- **Origin Snapping**: Automatic proximity snapping to the origin vertex to quickly close polygon loops.
- **Pure SVG Overlay**: Resolution-independent SVG `viewBox` overlay ensuring seamless zone alignment across responsive containers, letterboxed streams, and fullscreen video with under 6 KB gzipped core.
- **History Manager**: Built-in immutable undo and redo stack for state management.

#### Directional Counting & Flow Vectors

- **Cardinal Direction Metadata**: Support for 8 cardinal directions (`NORTH`, `SOUTH`, `EAST`, `WEST`, `NORTH_EAST`, `NORTH_WEST`, `SOUTH_EAST`, `SOUTH_WEST`).
- **Movement Flows**: Support for 6 traffic/pedestrian behaviors (`STRAIGHT`, `BIDIRECTIONAL`, `TURN_LEFT`, `TURN_RIGHT`, `INTERSECTION`, `T_JUNCTION`).
- **Visual Direction Overlays**: Interactive directional arrows and tripwire crossing normal vectors rendered directly on zones.

#### Computer Vision Exporters

- **YOLO Format**: Exports normalized segmentation polygon coordinates (`class_id x1 y1 x2 y2 ...`).
- **OpenCV Format**: Exports scaled integer pixel coordinates (`np.array(pts, np.int32)`) for any target video resolution (e.g. 1080p, 4K).
- **Python Script Generator**: Generates executable Python scripts with `cv2.polylines()` and `cv2.arrowedLine()` drawing functions.
- **Roboflow Supervision JSON**: Formats zones and tripwires for direct ingestion into `supervision.LineZone` and `supervision.ZoneAnnotator`.

#### Interactive CCTV Studio Playground (`demo/`)

- Simulated CCTV highway camera feed featuring animated vehicle traffic in northbound and southbound lanes.
- **Live Tripwire Object Counting**: Continuous line-segment crossing physics calculating real-time **IN / MASUK**, **OUT / KELUAR**, and **TOTAL** crossing metrics.
- **Theme Toggle**: Full Light Mode and Dark Mode support with verified WCAG AA contrast (≥ 4.5:1) and `localStorage` persistence.
- **Bilingual Localization (i18n)**: Zero-dependency translation system supporting English (`en`) and Bahasa Indonesia (`id`).
- Real-time Normalized Coordinate Tracker HUD (`X: 0.000 | Y: 0.000`).
- Zone Inspector for custom naming, color pickers, and flow direction assignment.
- One-click CV Export previewer and clipboard copy.

#### Packaging & CI Pipeline

- Dual **ESM** (`dist/index.mjs`) and **CJS** (`dist/index.js`) distribution with complete TypeScript definitions (`dist/index.d.ts`).
- GitHub Actions CI matrix workflow testing Node.js 18.x, 20.x, and 22.x.
- 20 unit tests with 100% pass rate in Vitest.
- Strict TypeScript configuration (`tsc --noEmit`).

---

### Author & Credits

Created by **Risyandi** in collaboration with AI.  
Contact: [hello@risyandi.com](mailto:hello@risyandi.com)  
License: [MIT](LICENSE)
