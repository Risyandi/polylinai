/**
 * PolylinAI - Unit Tests: History Manager (Undo / Redo)
 *
 * Created by Risyandi in collaboration with AI.
 * Contact: hello@risyandi.com
 * Licensed under the MIT License.
 */

import { describe, expect, it } from 'vitest';
import { HistoryManager } from '../../src/core/history';
import { RoiZone } from '../../src/types';

describe('HistoryManager (Undo/Redo)', () => {
  const zoneA: RoiZone = {
    id: 'z1',
    name: 'Zone 1',
    type: 'polygon',
    points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    color: '#000',
    closed: true,
  };

  const zoneB: RoiZone = {
    id: 'z2',
    name: 'Zone 2',
    type: 'polyline',
    points: [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.8 }],
    color: '#fff',
    closed: false,
  };

  it('manages undo and redo stacks without mutating state snapshots', () => {
    const history = new HistoryManager(10);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);

    // Initial state: empty
    const state0: RoiZone[] = [];
    history.push(state0);

    // State 1: zoneA added
    const state1: RoiZone[] = [zoneA];
    history.push(state1);

    // State 2: zoneB added
    const state2: RoiZone[] = [zoneA, zoneB];

    expect(history.canUndo()).toBe(true);

    // Undo from state 2 back to state 1
    const undone1 = history.undo(state2);
    expect(undone1).toEqual(state1);
    expect(history.canRedo()).toBe(true);

    // Undo back to state 0
    const undone0 = history.undo(undone1!);
    expect(undone0).toEqual(state0);

    // Redo back to state 1
    const redone1 = history.redo(undone0!);
    expect(redone1).toEqual(state1);
  });
});
