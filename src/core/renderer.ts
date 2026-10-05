import { PolylinAiOptions, RoiPoint, RoiZone } from '../types';
import { pointsToSvgString } from '../geometry/polygon';
import { toPixel } from '../geometry/point';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const VIRTUAL_COORD_SIZE = 1000;

export class SvgRenderer {
  public svg: SVGSVGElement;
  private defs: SVGDefsElement;
  private zonesGroup: SVGGElement;
  private activeGroup: SVGGElement;
  private options: PolylinAiOptions;

  constructor(container: HTMLElement, options: PolylinAiOptions) {
    this.options = options;

    // Ensure container has relative/absolute positioning
    const computedPos = window.getComputedStyle(container).position;
    if (computedPos === 'static') {
      container.style.position = 'relative';
    }

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'polylinai-svg-overlay');
    this.svg.setAttribute('viewBox', `0 0 ${VIRTUAL_COORD_SIZE} ${VIRTUAL_COORD_SIZE}`);
    this.svg.setAttribute('preserveAspectRatio', 'none');
    Object.assign(this.svg.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'auto',
      userSelect: 'none',
      touchAction: 'none',
    });

    this.defs = document.createElementNS(SVG_NS, 'defs');
    this.setupDefs();
    this.svg.appendChild(this.defs);

    this.zonesGroup = document.createElementNS(SVG_NS, 'g');
    this.zonesGroup.setAttribute('class', 'polylinai-zones-layer');
    this.svg.appendChild(this.zonesGroup);

    this.activeGroup = document.createElementNS(SVG_NS, 'g');
    this.activeGroup.setAttribute('class', 'polylinai-active-layer');
    this.svg.appendChild(this.activeGroup);

    container.appendChild(this.svg);
  }

  private setupDefs(): void {
    // Arrow marker for direction vector
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'polylinai-dir-arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M 0 1 L 10 5 L 0 9 z');
    path.setAttribute('fill', '#ffffff');
    marker.appendChild(path);

    this.defs.appendChild(marker);
  }

  public renderZones(zones: RoiZone[], selectedZoneId: string | null): void {
    while (this.zonesGroup.firstChild) {
      this.zonesGroup.removeChild(this.zonesGroup.firstChild);
    }

    zones.forEach((zone) => {
      const isSelected = zone.id === selectedZoneId;
      const zoneGroup = document.createElementNS(SVG_NS, 'g');
      zoneGroup.setAttribute('class', `polylinai-zone-item ${isSelected ? 'is-selected' : ''}`);
      zoneGroup.dataset.zoneId = zone.id;

      const strokeColor = isSelected ? (this.options.activeColor ?? '#3b82f6') : zone.color;
      const fillColor = zone.closed ? strokeColor : 'none';
      const fillOpacity = zone.closed ? (isSelected ? '0.28' : `${zone.opacity ?? 0.16}`) : '0';

      const pointsStr = pointsToSvgString(zone.points, VIRTUAL_COORD_SIZE, VIRTUAL_COORD_SIZE);

      if (zone.closed) {
        const poly = document.createElementNS(SVG_NS, 'polygon');
        poly.setAttribute('points', pointsStr);
        poly.setAttribute('fill', fillColor);
        poly.setAttribute('fill-opacity', fillOpacity);
        poly.setAttribute('stroke', strokeColor);
        poly.setAttribute('stroke-width', isSelected ? '3.5' : '2.5');
        poly.setAttribute('stroke-linejoin', 'round');
        poly.setAttribute('stroke-linecap', 'round');
        poly.style.cursor = 'pointer';
        zoneGroup.appendChild(poly);
      } else {
        const poly = document.createElementNS(SVG_NS, 'polyline');
        poly.setAttribute('points', pointsStr);
        poly.setAttribute('fill', 'none');
        poly.setAttribute('stroke', strokeColor);
        poly.setAttribute('stroke-width', isSelected ? '4' : '3');
        poly.setAttribute('stroke-linecap', 'round');
        poly.setAttribute('stroke-linejoin', 'round');
        poly.style.cursor = 'pointer';
        zoneGroup.appendChild(poly);
      }

      // Render Direction vector arrow if configured
      if (zone.direction && (this.options.showDirectionArrows ?? true)) {
        this.renderDirectionArrow(zoneGroup, zone, strokeColor);
      }

      // Render zone label tag
      if (zone.points.length > 0) {
        this.renderZoneLabel(zoneGroup, zone, isSelected);
      }

      // Render vertex drag handles and edge split points if selected
      if (isSelected) {
        this.renderZoneHandles(zoneGroup, zone);
      }

      this.zonesGroup.appendChild(zoneGroup);
    });
  }

  private renderDirectionArrow(group: SVGGElement, zone: RoiZone, color: string): void {
    if (!zone.direction?.vector) return;

    const from = toPixel(zone.direction.vector.from, VIRTUAL_COORD_SIZE, VIRTUAL_COORD_SIZE);
    const to = toPixel(zone.direction.vector.to, VIRTUAL_COORD_SIZE, VIRTUAL_COORD_SIZE);

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', `${from.x}`);
    line.setAttribute('y1', `${from.y}`);
    line.setAttribute('x2', `${to.x}`);
    line.setAttribute('y2', `${to.y}`);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('marker-end', 'url(#polylinai-dir-arrow)');
    line.setAttribute('stroke-linecap', 'round');

    const circleAnchor = document.createElementNS(SVG_NS, 'circle');
    circleAnchor.setAttribute('cx', `${from.x}`);
    circleAnchor.setAttribute('cy', `${from.y}`);
    circleAnchor.setAttribute('r', '4');
    circleAnchor.setAttribute('fill', color);

    group.appendChild(line);
    group.appendChild(circleAnchor);
  }

  private renderZoneLabel(group: SVGGElement, zone: RoiZone, isSelected: boolean): void {
    const firstPt = zone.points[0];
    const px = firstPt.x * VIRTUAL_COORD_SIZE;
    const py = Math.max(25, firstPt.y * VIRTUAL_COORD_SIZE - 12);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', `${px}`);
    text.setAttribute('y', `${py}`);
    text.setAttribute('fill', isSelected ? (this.options.activeColor ?? '#60a5fa') : '#ffffff');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', 'ui-sans-serif, system-ui, -apple-system, sans-serif');
    text.setAttribute('text-anchor', 'start');
    text.setAttribute('filter', 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))');
    text.style.pointerEvents = 'none';

    let labelContent = zone.name;
    if (zone.direction?.type) {
      labelContent += ` [${zone.direction.type}]`;
    }
    text.textContent = labelContent;

    group.appendChild(text);
  }

  private renderZoneHandles(group: SVGGElement, zone: RoiZone): void {
    // 1. Vertex drag handles
    zone.points.forEach((pt, index) => {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', `${pt.x * VIRTUAL_COORD_SIZE}`);
      circle.setAttribute('cy', `${pt.y * VIRTUAL_COORD_SIZE}`);
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', '#ffffff');
      circle.setAttribute('stroke', this.options.activeColor ?? '#3b82f6');
      circle.setAttribute('stroke-width', '2.5');
      circle.setAttribute('class', 'polylinai-handle-vertex');
      circle.dataset.zoneId = zone.id;
      circle.dataset.vertexIndex = `${index}`;
      circle.style.cursor = 'grab';
      group.appendChild(circle);
    });

    // 2. Midpoint handles for dynamic edge splitting (inserting vertex)
    if (this.options.enableEdgeSplit ?? true) {
      const numSegments = zone.closed ? zone.points.length : zone.points.length - 1;
      for (let i = 0; i < numSegments; i++) {
        const p1 = zone.points[i];
        const p2 = zone.points[(i + 1) % zone.points.length];
        const midX = ((p1.x + p2.x) / 2) * VIRTUAL_COORD_SIZE;
        const midY = ((p1.y + p2.y) / 2) * VIRTUAL_COORD_SIZE;

        const midCircle = document.createElementNS(SVG_NS, 'circle');
        midCircle.setAttribute('cx', `${midX}`);
        midCircle.setAttribute('cy', `${midY}`);
        midCircle.setAttribute('r', '4.5');
        midCircle.setAttribute('fill', '#ffffff');
        midCircle.setAttribute('fill-opacity', '0.7');
        midCircle.setAttribute('stroke', this.options.activeColor ?? '#3b82f6');
        midCircle.setAttribute('stroke-width', '1.5');
        midCircle.setAttribute('class', 'polylinai-handle-midpoint');
        midCircle.dataset.zoneId = zone.id;
        midCircle.dataset.segmentIndex = `${i}`;
        midCircle.style.cursor = 'copy';
        group.appendChild(midCircle);
      }
    }
  }

  public renderActiveDrawing(
    points: RoiPoint[],
    cursorPoint: RoiPoint | null,
    isPolygonMode: boolean,
    canSnapToFirst: boolean
  ): void {
    while (this.activeGroup.firstChild) {
      this.activeGroup.removeChild(this.activeGroup.firstChild);
    }

    if (points.length === 0) return;

    const activeColor = this.options.activeColor ?? '#3b82f6';

    // Render polyline of points placed so far
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', pointsToSvgString(points, VIRTUAL_COORD_SIZE, VIRTUAL_COORD_SIZE));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', activeColor);
    poly.setAttribute('stroke-width', '2.5');
    poly.setAttribute('stroke-dasharray', '4 3');
    this.activeGroup.appendChild(poly);

    // Rubber band line to current cursor
    if (cursorPoint && points.length > 0) {
      const last = points[points.length - 1];
      const target = canSnapToFirst ? points[0] : cursorPoint;

      const rubberBand = document.createElementNS(SVG_NS, 'line');
      rubberBand.setAttribute('x1', `${last.x * VIRTUAL_COORD_SIZE}`);
      rubberBand.setAttribute('y1', `${last.y * VIRTUAL_COORD_SIZE}`);
      rubberBand.setAttribute('x2', `${target.x * VIRTUAL_COORD_SIZE}`);
      rubberBand.setAttribute('y2', `${target.y * VIRTUAL_COORD_SIZE}`);
      rubberBand.setAttribute('stroke', canSnapToFirst ? '#10b981' : activeColor);
      rubberBand.setAttribute('stroke-width', '2');
      rubberBand.setAttribute('stroke-dasharray', '3 3');
      this.activeGroup.appendChild(rubberBand);
    }

    // Render handles on placed vertices
    points.forEach((pt, index) => {
      const circle = document.createElementNS(SVG_NS, 'circle');
      const isFirst = index === 0;
      const snapHighlight = isFirst && canSnapToFirst && isPolygonMode;

      circle.setAttribute('cx', `${pt.x * VIRTUAL_COORD_SIZE}`);
      circle.setAttribute('cy', `${pt.y * VIRTUAL_COORD_SIZE}`);
      circle.setAttribute('r', snapHighlight ? '10' : '6');
      circle.setAttribute('fill', snapHighlight ? '#10b981' : '#ffffff');
      circle.setAttribute('stroke', snapHighlight ? '#ffffff' : activeColor);
      circle.setAttribute('stroke-width', '2.5');
      this.activeGroup.appendChild(circle);
    });
  }

  public clearActiveDrawing(): void {
    while (this.activeGroup.firstChild) {
      this.activeGroup.removeChild(this.activeGroup.firstChild);
    }
  }

  public destroy(): void {
    if (this.svg.parentElement) {
      this.svg.parentElement.removeChild(this.svg);
    }
  }
}
