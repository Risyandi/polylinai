/**
 * PolylinAI - Studio Playground Application
 * Interactive simulated CCTV interface with live coordinate tracking,
 * light/dark theme toggle, i18n localization, and tripwire vehicle counting.
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
import { getLocale, setLocale, SupportedLocale, t } from './i18n';

// --- Theme Management ---
const btnTheme = document.getElementById('btn-theme') as HTMLButtonElement;
let currentTheme = localStorage.getItem('polylinai-theme') || 'dark';

function applyTheme(theme: string) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('polylinai-theme', theme);
  btnTheme.textContent = theme === 'dark' ? '🌙' : '☀️';
  btnTheme.title = theme === 'dark' ? t('themeDark') : t('themeLight');
}

btnTheme.addEventListener('click', () => {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});
applyTheme(currentTheme);

// --- i18n Localization Management ---
const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
langSelect.value = getLocale();

function updateAllTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Update dynamic option texts in export select
  const exportFormat = document.getElementById('export-format') as HTMLSelectElement;
  if (exportFormat) {
    exportFormat.options[0].text = t('yoloOption');
    exportFormat.options[1].text = t('opencvOption');
    exportFormat.options[2].text = t('pythonOption');
    exportFormat.options[3].text = t('supervisionOption');
    exportFormat.options[4].text = t('nativeOption');
  }

  btnTheme.title = currentTheme === 'dark' ? t('themeDark') : t('themeLight');
  updateZonesList();
  updateInspector(polylin.getSelectedZone());
  updateTripwireStatsUI();
  updateExport();
}

langSelect.addEventListener('change', () => {
  setLocale(langSelect.value as SupportedLocale);
  updateAllTranslations();
});

// --- Simulated CCTV Feed & Vehicle Physics ---
const canvas = document.getElementById('mock-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

interface Vehicle {
  id: number;
  x: number;
  y: number;
  prevY: number;
  width: number;
  height: number;
  speed: number;
  direction: 'up' | 'down';
  color: string;
}

const vehicles: Vehicle[] = [
  { id: 1, x: 440, y: 700, prevY: 700, width: 44, height: 75, speed: 2.8, direction: 'up', color: '#38bdf8' },
  { id: 2, x: 540, y: 720, prevY: 720, width: 48, height: 80, speed: 3.4, direction: 'up', color: '#10b981' },
  { id: 3, x: 740, y: 190, prevY: 190, width: 46, height: 78, speed: 3.1, direction: 'down', color: '#f43f5e' },
  { id: 4, x: 840, y: 220, prevY: 220, width: 52, height: 85, speed: 2.6, direction: 'down', color: '#f59e0b' },
];

// Tripwire crossing state
interface TripwireCounter {
  in: number;
  out: number;
  total: number;
}
const tripwireCounts: Record<string, TripwireCounter> = {};
// Set of vehicleId-zoneId to prevent duplicate counting in same pass
const recentCrossings = new Set<string>();

function checkLineIntersection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) =>
    (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

function processTripwireCrossings() {
  const zones = polylin.getZones();
  const tripwires = zones.filter((z) => z.type === 'polyline' && z.points.length >= 2);

  vehicles.forEach((veh) => {
    const vehTrajStart = { x: veh.x, y: veh.prevY };
    const vehTrajEnd = { x: veh.x, y: veh.y };

    tripwires.forEach((tw) => {
      if (!tripwireCounts[tw.id]) {
        tripwireCounts[tw.id] = { in: 0, out: 0, total: 0 };
      }

      // Check crossing with each line segment of the tripwire
      for (let i = 0; i < tw.points.length - 1; i++) {
        const segStart = { x: tw.points[i].x * canvas.width, y: tw.points[i].y * canvas.height };
        const segEnd = { x: tw.points[i + 1].x * canvas.width, y: tw.points[i + 1].y * canvas.height };

        const crossed = checkLineIntersection(vehTrajStart, vehTrajEnd, segStart, segEnd);
        const crossingKey = `${veh.id}-${tw.id}-${i}`;

        if (crossed && !recentCrossings.has(crossingKey)) {
          recentCrossings.add(crossingKey);
          setTimeout(() => recentCrossings.delete(crossingKey), 1200);

          if (veh.direction === 'up') {
            tripwireCounts[tw.id].in++;
          } else {
            tripwireCounts[tw.id].out++;
          }
          tripwireCounts[tw.id].total++;

          updateTripwireStatsUI();
        }
      }
    });
  });
}

function renderMockCctv() {
  // Road & background
  ctx.fillStyle = currentTheme === 'dark' ? '#1e293b' : '#334155';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Road surface
  ctx.fillStyle = currentTheme === 'dark' ? '#0f172a' : '#1e293b';
  ctx.beginPath();
  ctx.moveTo(260, 720);
  ctx.lineTo(480, 180);
  ctx.lineTo(820, 180);
  ctx.lineTo(1040, 720);
  ctx.closePath();
  ctx.fill();

  // Lane dividers
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([18, 22]);
  ctx.beginPath();
  ctx.moveTo(640, 180);
  ctx.lineTo(640, 720);
  ctx.stroke();
  ctx.setLineDash([]);

  // Lane guidelines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(450, 720);
  ctx.lineTo(560, 180);
  ctx.moveTo(850, 720);
  ctx.lineTo(740, 180);
  ctx.stroke();

  // Move & render vehicles
  vehicles.forEach((veh) => {
    veh.prevY = veh.y;
    if (veh.direction === 'up') {
      veh.y -= veh.speed;
      if (veh.y < 160) {
        veh.y = 730;
        veh.prevY = 730;
      }
    } else {
      veh.y += veh.speed;
      if (veh.y > 740) {
        veh.y = 170;
        veh.prevY = 170;
      }
    }

    // Vehicle body
    ctx.fillStyle = veh.color;
    ctx.fillRect(veh.x - veh.width / 2, veh.y - veh.height / 2, veh.width, veh.height);

    // AI bounding box effect
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(veh.x - veh.width / 2 - 2, veh.y - veh.height / 2 - 2, veh.width + 4, veh.height + 4);

    // Windshield & lights
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const wsY = veh.direction === 'up' ? veh.y - 12 : veh.y + 2;
    ctx.fillRect(veh.x - veh.width / 2 + 6, wsY, veh.width - 12, 16);
  });

  // Calculate crossings with tripwires
  processTripwireCrossings();

  // CCTV HUD Overlay
  ctx.fillStyle = '#22c55e';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`CAM-04 [HIGHWAY INTERSECTION] - ${new Date().toISOString()}`, 16, 26);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(canvas.width - 32, 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('REC', canvas.width - 66, 26);

  requestAnimationFrame(renderMockCctv);
}
requestAnimationFrame(renderMockCctv);

// --- UI Elements ---
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
const countIn = document.getElementById('count-in') as HTMLElement;
const countOut = document.getElementById('count-out') as HTMLElement;
const countTotal = document.getElementById('count-total') as HTMLElement;
const activeTripwiresSummary = document.getElementById('active-tripwires-summary') as HTMLElement;
const btnResetCounts = document.getElementById('btn-reset-counts') as HTMLButtonElement;

// --- Initialize PolylinAI Library ---
const polylin = new PolylinAI({
  container: videoWrapper,
  defaultMode: 'polygon',
  snapDistancePx: 18,
  activeColor: '#3b82f6',
  showDirectionArrows: true,
  enableEdgeSplit: true,
  onChange: () => {
    updateZonesList();
    updateTripwireStatsUI();
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
  if (confirm(t('confirmClear'))) {
    polylin.clearAllZones();
    Object.keys(tripwireCounts).forEach((k) => delete tripwireCounts[k]);
    updateTripwireStatsUI();
  }
});

btnResetCounts.addEventListener('click', () => {
  Object.keys(tripwireCounts).forEach((k) => {
    tripwireCounts[k] = { in: 0, out: 0, total: 0 };
  });
  updateTripwireStatsUI();
});

// Update Live Tripwire Analytics Dashboard
function updateTripwireStatsUI() {
  const zones = polylin.getZones();
  const tripwires = zones.filter((z) => z.type === 'polyline');

  let totalIn = 0;
  let totalOut = 0;
  let totalCount = 0;

  tripwires.forEach((tw) => {
    const stats = tripwireCounts[tw.id] || { in: 0, out: 0, total: 0 };
    totalIn += stats.in;
    totalOut += stats.out;
    totalCount += stats.total;
  });

  countIn.textContent = `${totalIn}`;
  countOut.textContent = `${totalOut}`;
  countTotal.textContent = `${totalCount}`;

  if (tripwires.length === 0) {
    activeTripwiresSummary.innerHTML = `<p style="font-style: italic;">${t('noTripwiresActive')}</p>`;
  } else {
    activeTripwiresSummary.innerHTML = tripwires
      .map((tw) => {
        const stats = tripwireCounts[tw.id] || { in: 0, out: 0, total: 0 };
        return `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-top: 1px dashed var(--border);">
            <span><strong style="color: ${tw.color};">●</strong> ${tw.name}</span>
            <span><strong>${t('inflow')}: ${stats.in}</strong> | <strong>${t('outflow')}: ${stats.out}</strong></span>
          </div>
        `;
      })
      .join('');
  }
}

// Inspector UI
function updateInspector(zone: RoiZone | null) {
  if (!zone) {
    inspectorContent.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        ${t('zoneConfigPlaceholder')}
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
      <label>${t('zoneName')}</label>
      <input type="text" id="edit-zone-name" value="${zone.name}" />
    </div>

    <div class="form-group">
      <label>${t('zoneColor')}</label>
      <input type="color" id="edit-zone-color" value="${zone.color}" style="height: 38px; cursor: pointer;" />
    </div>

    <div class="form-group">
      <label>${t('countingFlow')}</label>
      <select id="edit-zone-direction">
        <option value="NONE" ${!zone.direction ? 'selected' : ''}>${t('noneOmnidirectional')}</option>
        ${directionTypes
          .map(
            (dir) =>
              `<option value="${dir}" ${zone.direction?.type === dir ? 'selected' : ''}>${dir}</option>`
          )
          .join('')}
      </select>
    </div>

    <div style="display: flex; gap: 8px; margin-top: 8px;">
      <button id="btn-delete-zone" class="btn-danger" style="flex: 1;">${t('deleteZone')}</button>
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
    delete tripwireCounts[zone.id];
    polylin.deleteZone(zone.id);
    updateTripwireStatsUI();
  });
}

// Zone List UI
function updateZonesList() {
  const zones = polylin.getZones();
  const selected = polylin.getSelectedZone();
  zoneCount.textContent = `${zones.length}`;

  if (zones.length === 0) {
    zonesContainer.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 12px 0;">${t('noActiveZones')}</p>
    `;
    return;
  }

  zonesContainer.innerHTML = zones
    .map((z) => {
      const isSelected = selected?.id === z.id;
      const typeLabel = z.closed ? t('polygonType') : t('tripwireType');
      const counts = tripwireCounts[z.id];
      const countBadge = counts ? `[${counts.total}]` : '';

      return `
        <div class="zone-item ${isSelected ? 'is-selected' : ''}" data-id="${z.id}">
          <div class="zone-info">
            <span class="color-swatch" style="background: ${z.color};"></span>
            <strong>${z.name} ${countBadge}</strong>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="status-badge">${typeLabel}</span>
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
  btnCopyExport.textContent = t('copied');
  setTimeout(() => {
    btnCopyExport.textContent = t('copyClipboard');
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
        { x: 0.75, y: 0.55 },
      ],
      color: '#f59e0b',
      closed: false,
      direction: {
        type: 'STRAIGHT',
        angleDeg: 0,
        vector: {
          from: { x: 0.50, y: 0.60 },
          to: { x: 0.50, y: 0.50 },
        },
      },
    },
    {
      id: 'sample-turn-left',
      name: 'Southbound Highway Lane',
      type: 'polygon',
      points: [
        { x: 0.52, y: 0.70 },
        { x: 0.74, y: 0.70 },
        { x: 0.64, y: 0.30 },
        { x: 0.50, y: 0.30 },
      ],
      color: '#3b82f6',
      closed: true,
      direction: {
        type: 'SOUTH',
        angleDeg: 180,
        vector: {
          from: { x: 0.62, y: 0.40 },
          to: { x: 0.62, y: 0.60 },
        },
      },
    },
  ];

  polylin.loadZones(sampleZones);
  updateTripwireStatsUI();
});

// Initialize translations
updateAllTranslations();
