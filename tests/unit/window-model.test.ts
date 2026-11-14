import { describe, it, expect } from 'vitest';
import {
  AXIS, STAGE_MAX, STAGE_MIN, WINDOWS, PRESETS, DEFAULT_PRESET, OUTCOME_LABEL,
  evaluate, describe as describeResult,
} from '../../src/lib/window-model';

describe('illustrative intervention-window model', () => {
  it('runs the stages in sequence and totals them', () => {
    const r = evaluate([1, 6, 4, 2], WINDOWS.set);
    expect(r.starts).toEqual([0, 1, 7, 11]);
    expect(r.total).toBe(13);
  });

  it('is too late only when the chain ends after the window', () => {
    expect(evaluate([3, 3, 3, 3], 12).outcome).not.toBe('too-late');
    expect(evaluate([3, 3, 3, 4], 12).outcome).toBe('too-late');
  });

  it('calls a margin narrow when a window 25% shorter would be missed', () => {
    expect(evaluate([2, 2, 2, 3], 12).outcome).toBe('in-time');
    expect(evaluate([2, 2, 3, 3], 12).outcome).toBe('narrow');
    // The same chain, tested against the shorter window, is too late.
    expect(evaluate([2, 2, 3, 3], WINDOWS.shorter).outcome).toBe('too-late');
  });

  it('names the stage in progress when the window closes', () => {
    expect(evaluate([6, 6, 6, 6], 12).closesDuring).toBe(2);
    expect(evaluate([1, 6, 4, 2], 12).closesDuring).toBe(3);
    expect(evaluate([2, 2, 2, 2], 12).closesDuring).toBeNull();
  });

  it('names a longest stage only when one stage is uniquely longest', () => {
    expect(evaluate([1, 6, 4, 2], 12).longest).toBe(1);
    expect(evaluate([2, 2, 2, 2], 12).longest).toBeNull();
  });

  it('keeps every preset inside the slider range and on the axis', () => {
    for (const p of PRESETS) {
      for (const d of p.durations) {
        expect(d).toBeGreaterThanOrEqual(STAGE_MIN);
        expect(d).toBeLessThanOrEqual(STAGE_MAX);
      }
    }
    expect(STAGE_MAX * 4).toBeLessThanOrEqual(AXIS);
    expect(PRESETS.some((p) => p.key === DEFAULT_PRESET)).toBe(true);
  });

  it('covers all three outcomes across the presets, and opens on a failure', () => {
    const outcomes = new Set(PRESETS.map((p) => evaluate(p.durations, WINDOWS.set).outcome));
    expect(outcomes).toEqual(new Set(['in-time', 'narrow', 'too-late']));
    const opening = PRESETS.find((p) => p.key === DEFAULT_PRESET)!;
    expect(evaluate(opening.durations, WINDOWS.set).outcome).toBe('too-late');
  });

  it('never borrows the verdict states or claims a measurement', () => {
    const words = [...Object.values(OUTCOME_LABEL), ...PRESETS.map((p) => p.label), ...PRESETS.map((p) => p.text)].join(' ');
    expect(words).not.toMatch(/Before impact|At risk|After impact/);
    expect(words).not.toMatch(/\d+\s?(min|minutes|hours|days|%)/);
    for (const p of PRESETS) {
      expect(describeResult(evaluate(p.durations, WINDOWS.set))).not.toMatch(/verdict|AGDA/);
    }
  });
});
