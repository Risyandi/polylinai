/**
 * PolylinAI - Studio Playground Application
 * Interactive simulated CCTV interface with live coordinate tracking and export inspector.
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import {
  DirectionType,
  PolylinAI,
  RoiZone,
} from '../src/index';

// Initialize mock CCTV video stream on HTML5 Canvas
const canvas = document.getElementById('mock-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let carOffset = 0;
function renderMockCctv() {
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Road surface
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(300, 720);
  ctx.lineTo(500, 200);
  ctx.lineTo(780, 200);
  ctx.lineTo(980, 720);
  ctx.closePath();
  ctx.fill();

  // Lane dividers
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 25]);
  ctx.beginPath();
  ctx.moveTo(640, 200);
  ctx.lineTo(640, 720);
  ctx.stroke();
  ctx.setLineDash([]);

  // Moving vehicles simulation
  carOffset = (carOffset + 2) % 600;
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(450, 650 - carOffset, 60, 100);

  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(720, 180 + carOffset, 55, 90);

  // CCTV HUD Overlay
  ctx.fillStyle = '#22c55e';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`CAM-04 [HIGHWAY INTERSECTION] - ${new Date().toISOString()}`, 20, 30);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(canvas.width - 30, 25, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('REC', canvas.width - 70, 30);

  requestAnimationFrame(renderMockCctv);
}
requestAnimationFrame(renderMockCctv);

// Elements
const videoWrapper = document.getElementById('video-wrapper') as HTMLElement;
const btnDrawPolygon = document.getElementById('btn-draw-polygon') as HTMLButtonElement;
const btnDrawPolyline = document.getElementById('btn-draw-polyline') as HTMLButtonElement;
const btnFinishDrawing = document.getElementById('btn-finish-drawing') as HTMLButtonElement;
const btnCancelDrawing = document.getElementById('btn-cancel-drawing') as HTMLButtonElement;
const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
const btnRedo = document.getElementById('btn-redo') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const zonesContainer = document.getElementById('zones-container') as HTMLElement;
const zoneCount = document.getElementById('zone-count') as HTMLElement;
const inspectorContent = document.getElementById('inspector-content') as HTMLElement;
const exportFormat = document.getElementById('export-format') as HTMLSelectElement;
const exportPreview = document.getElementById('export-preview') as HTMLElement;
const btnCopyExport = document.getElementById('btn-copy-export') as HTMLButtonElement;
const btnLoadSample = document.getElementById('btn-load-sample') as HTMLButtonElement;
const cursorCoords = document.getElementById('cursor-coords') as HTMLElement;

// Initialize PolylinAI
const polylin = new PolylinAI({
  container: videoWrapper,
  defaultMode: 'polygon',
  snapDistancePx: 18,
  activeColor: '#3b82f6',
  showDirectionArrows: true,
  enableEdgeSplit: true,
  onChange: () => {
    updateZonesList();
    updateExport();
  },
  onZoneSelected: (zone) => {
    updateInspector(zone);
    updateZonesList();
  },
  onDrawComplete: () => {
    setDrawingModeUI(false);
  },
});

// Cursor Tracking in Normalized Space
videoWrapper.addEventListener('pointermove', (e) => {
  const rect = videoWrapper.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  cursorCoords.textContent = `X: ${x.toFixed(3)} | Y: ${y.toFixed(3)} (Normalized)`;
});

function setDrawingModeUI(isDrawing: boolean) {
  btnDrawPolygon.style.display = isDrawing ? 'none' : 'inline-flex';
  btnDrawPolyline.style.display = isDrawing ? 'none' : 'inline-flex';
  btnFinishDrawing.style.display = isDrawing ? 'inline-flex' : 'none';
  btnCancelDrawing.style.display = isDrawing ? 'inline-flex' : 'none';
}

btnDrawPolygon.addEventListener('click', () => {
  polylin.startDrawing('polygon');
  setDrawingModeUI(true);
});

btnDrawPolyline.addEventListener('click', () => {
  polylin.startDrawing('polyline');
  setDrawingModeUI(true);
});

btnFinishDrawing.addEventListener('click', () => {
  polylin.finishDrawing();
  setDrawingModeUI(false);
});

btnCancelDrawing.addEventListener('click', () => {
  polylin.cancelDrawing();
  setDrawingModeUI(false);
});

btnUndo.addEventListener('click', () => polylin.undo());
btnRedo.addEventListener('click', () => polylin.redo());
btnClear.addEventListener('click', () => {
  if (confirm('Clear all drawn zones?')) {
    polylin.clearAllZones();
  }
});

// Inspector UI
function updateInspector(zone: RoiZone | null) {
  if (!zone) {
    inspectorContent.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        Select a zone from the list or click directly on a zone to edit its attributes.
      </p>
    `;
    return;
  }

  const directionTypes: DirectionType[] = [
    'NORTH',
    'SOUTH',
    'EAST',
    'WEST',
    'NORTH_EAST',
    'NORTH_WEST',
    'SOUTH_EAST',
    'SOUTH_WEST',
    'STRAIGHT',
    'BIDIRECTIONAL',
    'TURN_LEFT',
    'TURN_RIGHT',
    'INTERSECTION',
    'T_JUNCTION',
  ];

  inspectorContent.innerHTML = `
    <div class="form-group">
      <label>Zone Name</label>
      <input type="text" id="edit-zone-name" value="${zone.name}" />
    </div>

    <div class="form-group">
      <label>Zone Color</label>
      <input type="color" id="edit-zone-color" value="${zone.color}" style="height: 38px; cursor: pointer;" />
    </div>

    <div class="form-group">
      <label>Counting Flow Direction</label>
      <select id="edit-zone-direction">
        <option value="NONE" ${!zone.direction ? 'selected' : ''}>None (Omnidirectional Alert)</option>
        ${directionTypes
          .map(
            (dir) =>
              `<option value="${dir}" ${zone.direction?.type === dir ? 'selected' : ''}>${dir}</option>`
          )
          .join('')}
      </select>
    </div>

    <div style="display: flex; gap: 8px; margin-top: 8px;">
      <button id="btn-delete-zone" class="btn-danger" style="flex: 1;">Delete Zone</button>
    </div>
  `;

  const nameInput = document.getElementById('edit-zone-name') as HTMLInputElement;
  const colorInput = document.getElementById('edit-zone-color') as HTMLInputElement;
  const dirSelect = document.getElementById('edit-zone-direction') as HTMLSelectElement;
  const btnDelete = document.getElementById('btn-delete-zone') as HTMLButtonElement;

  nameInput.addEventListener('change', () => {
    polylin.updateZone({ ...zone, name: nameInput.value });
  });

  colorInput.addEventListener('change', () => {
    polylin.updateZone({ ...zone, color: colorInput.value });
  });

  dirSelect.addEventListener('change', () => {
    const val = dirSelect.value;
    if (val === 'NONE') {
      polylin.removeZoneDirection(zone.id);
    } else {
      polylin.setZoneDirection(zone.id, val as DirectionType);
    }
  });

  btnDelete.addEventListener('click', () => {
    polylin.deleteZone(zone.id);
  });
}

// Zone List UI
function updateZonesList() {
  const zones = polylin.getZones();
  const selected = polylin.getSelectedZone();
  zoneCount.textContent = `${zones.length}`;

  if (zones.length === 0) {
    zonesContainer.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 12px 0;">No active zones.</p>
    `;
    return;
  }

  zonesContainer.innerHTML = zones
    .map((z) => {
      const isSelected = selected?.id === z.id;
      return `
        <div class="zone-item ${isSelected ? 'is-selected' : ''}" data-id="${z.id}">
          <div class="zone-info">
            <span class="color-swatch" style="background: ${z.color};"></span>
            <strong>${z.name}</strong>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="status-badge">${z.closed ? 'Polygon' : 'Tripwire'}</span>
            ${z.direction ? `<span class="status-badge" style="color: #38bdf8;">${z.direction.type}</span>` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  zonesContainer.querySelectorAll('.zone-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = (item as HTMLElement).dataset.id;
      const targetZone = polylin.getZones().find((z) => z.id === id) ?? null;
      polylin.setSelectedZone(targetZone);
    });
  });
}

// Export UI
function updateExport() {
  const format = exportFormat.value;
  let text = '';

  switch (format) {
    case 'yolo':
      text = polylin.exportAsYolo();
      break;
    case 'opencv':
      text = JSON.stringify(polylin.exportAsOpenCv(1920, 1080), null, 2);
      break;
    case 'python':
      text = polylin.generateOpenCvPython(1920, 1080);
      break;
    case 'supervision':
      text = JSON.stringify(polylin.exportAsSupervision(), null, 2);
      break;
    case 'native':
    default:
      text = JSON.stringify(polylin.getZones(), null, 2);
      break;
  }

  exportPreview.textContent = text || '// No active zones drawn yet.';
}

exportFormat.addEventListener('change', updateExport);

btnCopyExport.addEventListener('click', () => {
  navigator.clipboard.writeText(exportPreview.textContent ?? '');
  const prev = btnCopyExport.textContent;
  btnCopyExport.textContent = 'Copied!';
  setTimeout(() => {
    btnCopyExport.textContent = prev;
  }, 1500);
});

// Load Pre-configured Realistic Sample
btnLoadSample.addEventListener('click', () => {
  const sampleZones: RoiZone[] = [
    {
      id: 'sample-zone-inflow',
      name: 'Northbound Traffic Lane',
      type: 'polygon',
      points: [
        { x: 0.28, y: 0.85 },
        { x: 0.46, y: 0.85 },
        { x: 0.48, y: 0.35 },
        { x: 0.38, y: 0.35 },
      ],
      color: '#10b981',
      closed: true,
      direction: {
        type: 'NORTH',
        angleDeg: 0,
        vector: {
          from: { x: 0.40, y: 0.70 },
          to: { x: 0.40, y: 0.45 },
        },
      },
    },
    {
      id: 'sample-tripwire-stop',
      name: 'Stop Line Tripwire',
      type: 'polyline',
      points: [
        { x: 0.25, y: 0.55 },
        { x: 0.50, y: 0.55 },
      ],
      color: '#f59e0b',
      closed: false,
      direction: {
        type: 'STRAIGHT',
        angleDeg: 0,
        vector: {
          from: { x: 0.375, y: 0.60 },
          to: { x: 0.375, y: 0.50 },
        },
      },
    },
    {
      id: 'sample-turn-left',
      name: 'Left Turn Inflow',
      type: 'polygon',
      points: [
        { x: 0.52, y: 0.65 },
        { x: 0.68, y: 0.65 },
        { x: 0.60, y: 0.35 },
        { x: 0.50, y: 0.35 },
      ],
      color: '#3b82f6',
      closed: true,
      direction: {
        type: 'TURN_LEFT',
        angleDeg: 270,
        vector: {
          from: { x: 0.60, y: 0.50 },
          to: { x: 0.45, y: 0.50 },
        },
      },
    },
  ];

  polylin.loadZones(sampleZones);
});
