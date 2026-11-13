import { describe, it, expect } from 'vitest';
import { axisLength, segments, boundary, now, stageStates, endsBeyond, progress } from '../../src/lib/race-geometry';
import { evaluate, PRESETS, WINDOWS, STAGE_MIN, STAGE_MAX } from '../../src/lib/window-model';

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 10);

describe('intervention scene geometry', () => {
  it('makes position linear in time on one shared axis', () => {
    const d = [1, 6, 4, 2];
    const axis = axisLength(d, 12);
    const segs = segments(d, 12);
    close(segs[0].start, 0);
    segs.forEach((s, i) => close(s.length, d[i] / axis));
    // Stages are contiguous: each starts where the one before ended.
    segs.slice(1).forEach((s, i) => close(s.start, segs[i].start + segs[i].length));
    close(boundary(d, 12), 12 / axis);
  });

  it('keeps one scale for the common scenarios, so the boundary does not move between presets', () => {
    const marks = new Set(PRESETS.map((p) => boundary(p.durations, WINDOWS.set)));
    expect(marks.size).toBe(1);
    expect(axisLength([6, 6, 6, 6], WINDOWS.set)).toBe(25);   // always room for the whole chain
    expect(axisLength([1, 1, 1, 1], WINDOWS.longer)).toBe(16); // and for the whole window
  });

  it('ends exactly on the boundary, with nothing beyond, when the chain equals the window', () => {
    const d = [3, 3, 3, 3];
    const last = segments(d, 12).at(-1)!;
    close(last.start + last.length, boundary(d, 12));
    expect(last.inside).toBe(1);
    expect(endsBeyond(d, 12)).toEqual([false, false, false, false]);
    expect(progress(d, 12)).toEqual({ consumed: 1, remaining: 0, beyond: 0 });
    // The model, not the drawing, decides the outcome: equal to the window is not too late.
    expect(evaluate(d, 12).outcome).toBe('narrow');
  });

  it('splits the stage that is running when the window closes, and continues past it', () => {
    const d = [1, 6, 4, 2];
    const segs = segments(d, 12);
    expect(segs.map((s) => s.inside)).toEqual([1, 1, 1, 0.5]);
    const p = progress(d, 12);
    close(p.consumed, 1); close(p.remaining, 0); close(p.beyond, 1 / 12);
    // Consumed plus beyond is the whole chain, measured in windows: time never resets.
    close(p.consumed + p.beyond, 13 / 12);
  });

  it('puts a stage that starts after the boundary wholly beyond it', () => {
    expect(segments([6, 6, 3, 2], 12).map((s) => s.inside)).toEqual([1, 1, 0, 0]);
  });

  it('agrees with the scenario model for every preset and every tested window', () => {
    for (const preset of PRESETS) for (const window of Object.values(WINDOWS)) {
      const result = evaluate(preset.durations, window);
      expect(progress(preset.durations, window).beyond > 0).toBe(result.outcome === 'too-late');
      expect(endsBeyond(preset.durations, window).indexOf(true)).toBe(result.closesDuring ?? -1);
      expect(segments(preset.durations, window).some((s) => s.inside < 1)).toBe(result.outcome === 'too-late');
    }
  });

  it('holds at the extremes of the sliders', () => {
    const min = [STAGE_MIN, STAGE_MIN, STAGE_MIN, STAGE_MIN];
    close(progress(min, WINDOWS.longer).consumed, 4 / 15);
    close(progress(min, WINDOWS.longer).remaining, 11 / 15);
    const max = [STAGE_MAX, STAGE_MAX, STAGE_MAX, STAGE_MAX];
    close(progress(max, WINDOWS.shorter).beyond, 15 / 9);
    const segs = segments(max, WINDOWS.shorter);
    close(segs.at(-1)!.start + segs.at(-1)!.length, 24 / 25);   // still on the axis
  });

  it('advances the present moment with elapsed time and never past the end of the chain', () => {
    const d = [2, 3, 6, 2];
    const axis = axisLength(d, 12);
    expect(now(d, 12, 0)).toBe(0);
    close(now(d, 12, 3.5), 3.5 / axis);
    close(now(d, 12), 13 / axis);
    close(now(d, 12, 99), 13 / axis);
    close(progress(d, 12, 3.5).consumed, 3.5 / 12);
    close(progress(d, 12, 3.5).remaining, 1 - 3.5 / 12);
    expect(progress(d, 12, 3.5).beyond).toBe(0);
  });

  it('marks a stage completed only when its whole duration has elapsed', () => {
    const d = [2, 3, 6, 2];
    expect(stageStates(d, 0)).toEqual(['active', 'pending', 'pending', 'pending']);
    expect(stageStates(d, 1.99)).toEqual(['active', 'pending', 'pending', 'pending']);
    expect(stageStates(d, 2)).toEqual(['completed', 'pending', 'pending', 'pending']);
    expect(stageStates(d, 2.01)).toEqual(['completed', 'active', 'pending', 'pending']);
    expect(stageStates(d, 12.9)).toEqual(['completed', 'completed', 'completed', 'active']);
    expect(stageStates(d)).toEqual(['completed', 'completed', 'completed', 'completed']);
  });
});
