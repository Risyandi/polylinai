# PolylinAI v1.0.0 - Production GA Release 🚀

We are thrilled to announce the **v1.0.0** General Availability release of **PolylinAI** — a lightweight, zero-dependency SVG Region of Interest (ROI) and Polyline drawing library for AI Computer Vision video feeds.

---

## 🌟 Highlights

- **Dynamic N-Point Polygons & Lines**: Draw arbitrary multi-vertex detection zones and open tripwires.
- **Dynamic Midpoint Edge Splitting**: Click on any edge segment or midpoint handle to insert vertices on the fly.
- **Directional Counting & Flow Metadata**: Configure 8 Cardinal directions (`NORTH`, `SOUTH`, `EAST`, `WEST`...) and 6 movement flows (`STRAIGHT`, `TURN_LEFT`, `TURN_RIGHT`...).
- **Computer Vision Output Ready**:
  - Export to **YOLO** segmentation format.
  - Export to **OpenCV** scaled pixel coordinates + ready-to-run Python code generation.
  - Export to **Roboflow / Supervision** JSON schema.
- **Pure SVG Overlay (Zero Dependencies)**: Resolution-independent scaling via standard `viewBox`, under 6 KB gzipped core.
- **Interactive Studio Playground**:
  - Live CCTV simulated highway feed.
  - Real-time tripwire crossing detection with directional vehicle counters (**IN**, **OUT**, **TOTAL**).
  - Light Mode & Dark Mode theme toggle.
  - Bilingual i18n support (**English** & **Bahasa Indonesia**).

---

## 📦 Installation

```bash
npm install polylinai
# or
pnpm add polylinai
# or
yarn add polylinai
```

---

## 🚀 Quick Start

```typescript
import { PolylinAI } from 'polylinai';

const container = document.getElementById('video-wrapper')!;

const polylin = new PolylinAI({
  container,
  defaultMode: 'polygon',
  showDirectionArrows: true,
  onChange: (zones) => {
    console.log('Active zones:', zones);
  },
});

// Start drawing a zone
polylin.startDrawing('polygon', { name: 'Entrance Zone', color: '#10b981' });

// Export for YOLO or OpenCV
const yoloAnnotation = polylin.exportAsYolo();
const pythonScript = polylin.generateOpenCvPython(1920, 1080);
```

---

## 🧪 Quality & Tests
- **TypeScript**: 100% strict typechecking.
- **Test Suite**: 20/20 unit tests passed via Vitest.
- **Distribution**: Dual ESM (`dist/index.mjs`) & CJS (`dist/index.js`) with TypeScript `.d.ts` declaration maps.

---

## 👤 Author & Credits
Created by **Risyandi** in collaboration with AI.  
Contact: [hello@risyandi.com](mailto:hello@risyandi.com)  
License: [MIT](https://opensource.org/licenses/MIT)
