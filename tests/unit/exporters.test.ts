import { describe, expect, it } from 'vitest';
import { exportToYolo } from '../../src/exporters/yolo';
import { exportToOpenCv, generateOpenCvPythonSnippet } from '../../src/exporters/opencv';
import { exportToSupervision } from '../../src/exporters/supervision';
import { RoiZone } from '../../src/types';

describe('Computer Vision Exporters', () => {
  const mockZones: RoiZone[] = [
    {
      id: 'zone-1',
      name: 'Parking Lot',
      type: 'polygon',
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.6 },
        { x: 0.1, y: 0.6 },
      ],
      closed: true,
      color: '#10b981',
      direction: {
        type: 'NORTH',
        angleDeg: 0,
        vector: { from: { x: 0.3, y: 0.5 }, to: { x: 0.3, y: 0.3 } },
      },
    },
    {
      id: 'tripwire-1',
      name: 'Entry Line',
      type: 'polyline',
      points: [
        { x: 0.0, y: 0.8 },
        { x: 1.0, y: 0.8 },
      ],
      closed: false,
      color: '#ef4444',
      direction: {
        type: 'SOUTH',
        angleDeg: 180,
      },
    },
  ];

  it('exports polygon to YOLO segmentation format string', () => {
    const yolo = exportToYolo(mockZones, { defaultClassId: 0 });
    const lines = yolo.split('\n');

    // Only closed polygon with >= 3 points is included in YOLO segmentation
    expect(lines.length).toBe(1);
    expect(lines[0].startsWith('0 0.100000 0.200000 0.500000 0.200000')).toBe(true);
  });

  it('exports zones to scaled OpenCV integer pixel coordinates', () => {
    const opencvData = exportToOpenCv(mockZones, { targetWidth: 1920, targetHeight: 1080 });

    expect(opencvData.length).toBe(2);
    const poly = opencvData[0];
    expect(poly.name).toBe('Parking Lot');
    // First point (0.1, 0.2) in 1920x1080 -> [192, 216]
    expect(poly.points[0]).toEqual([192, 216]);
    expect(poly.direction?.type).toBe('NORTH');
    expect(poly.direction?.vectorPx?.from).toEqual([576, 540]);
  });

  it('generates executable Python OpenCV snippet', () => {
    const snippet = generateOpenCvPythonSnippet(mockZones, { targetWidth: 1920, targetHeight: 1080 });

    expect(snippet).toContain('import cv2');
    expect(snippet).toContain('import numpy as np');
    expect(snippet).toContain('cv2.polylines');
    expect(snippet).toContain('cv2.arrowedLine');
  });

  it('exports zones to Roboflow Supervision JSON format', () => {
    const supervisionData = exportToSupervision(mockZones, {
      frameResolution: { width: 1920, height: 1080 },
    }) as any;

    expect(supervisionData.version).toBe('1.0');
    expect(supervisionData.zones.length).toBe(1);
    expect(supervisionData.zones[0].name).toBe('Parking Lot');
    expect(supervisionData.line_zones.length).toBe(1);
    expect(supervisionData.line_zones[0].trigger_direction).toBe('SOUTH');
  });
});
