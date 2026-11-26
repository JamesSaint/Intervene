import { describe, it, expect } from 'vitest';
import { dialArcs, stageStates, endsBeyond, progress, handPosition, dash, labelPlacements, fitsLabel, centreWordSize,
} from '../../src/lib/dial-geometry';
import { STAGES } from '../../src/lib/window-model';
import { evaluate, PRESETS, WINDOWS, STAGE_MIN, STAGE_MAX } from '../../src/lib/window-model';

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 10);

describe('intervention dial geometry', () => {
  it('makes angle linear in time: a stage subtends duration / window of a turn', () => {
    const arcs = dialArcs([3, 3, 3, 3], 12);
    expect(arcs).toHaveLength(4);
    arcs.forEach((arc, i) => { expect(arc.ring).toBe('window'); close(arc.from, i * 0.25); close(arc.to, (i + 1) * 0.25); });
  });

  it('ends exactly at twelve o\'clock, with nothing beyond, when the chain equals the window', () => {
    const d = [3, 3, 3, 3];
    const arcs = dialArcs(d, 12);
    close(arcs.at(-1)!.to, 1);
    expect(arcs.some((a) => a.ring === 'beyond')).toBe(false);
    expect(progress(d, 12)).toEqual({ consumed: 1, remaining: 0, beyond: 0 });
    expect(handPosition(d, 12)).toEqual({ ring: 'window', turn: 1 });
    // The model, not the drawing, decides the outcome: equal to the window is not too late.
    expect(evaluate(d, 12).outcome).toBe('narrow');
  });

  it('carries time past the boundary onto the inner ring without resetting it', () => {
    const d = [1, 6, 4, 2];
    const last = dialArcs(d, 12).filter((a) => a.stage === 3);
    expect(last.map((a) => a.ring)).toEqual(['window', 'beyond']);
    close(last[0].from, 11 / 12); close(last[0].to, 1);
    close(last[1].from, 0); close(last[1].to, 1 / 12);
    const p = progress(d, 12);
    close(p.consumed, 1); close(p.remaining, 0); close(p.beyond, 1 / 12);
    // Consumed plus beyond is the whole chain, measured in windows.
    close(p.consumed + p.beyond, 13 / 12);
    expect(handPosition(d, 12).ring).toBe('beyond');
  });

  it('draws a stage that starts after the boundary only on the inner ring', () => {
    const arcs = dialArcs([6, 6, 3, 2], 12).filter((a) => a.stage >= 2);
    expect(arcs.every((a) => a.ring === 'beyond')).toBe(true);
    close(arcs[0].from, 0); close(arcs[0].to, 0.25); close(arcs[1].from, 0.25);
  });

  it('agrees with the scenario model for every preset and every tested window', () => {
    for (const preset of PRESETS) for (const window of Object.values(WINDOWS)) {
      const result = evaluate(preset.durations, window);
      expect(dialArcs(preset.durations, window).some((a) => a.ring === 'beyond')).toBe(result.outcome === 'too-late');
      expect(progress(preset.durations, window).beyond > 0).toBe(result.outcome === 'too-late');
      expect(endsBeyond(preset.durations, window).indexOf(true)).toBe(result.closesDuring ?? -1);
    }
  });

  it('holds at the extremes of the sliders', () => {
    const min = [STAGE_MIN, STAGE_MIN, STAGE_MIN, STAGE_MIN];
    expect(dialArcs(min, WINDOWS.longer).every((a) => a.ring === 'window' && a.to > a.from)).toBe(true);
    close(progress(min, WINDOWS.longer).consumed, 4 / 15);
    close(progress(min, WINDOWS.longer).remaining, 11 / 15);
    const max = [STAGE_MAX, STAGE_MAX, STAGE_MAX, STAGE_MAX];
    // Twenty-four units against nine: the inner ring saturates at one turn, the figure does not.
    const arcs = dialArcs(max, WINDOWS.shorter);
    expect(Math.max(...arcs.filter((a) => a.ring === 'beyond').map((a) => a.to))).toBe(1);
    close(progress(max, WINDOWS.shorter).beyond, 15 / 9);
  });

  it('reveals arcs only as time elapses, and never past the present', () => {
    const d = [2, 3, 6, 2];
    expect(dialArcs(d, 12, 0)).toEqual([]);
    const mid = dialArcs(d, 12, 3.5);
    expect(mid.map((a) => a.stage)).toEqual([0, 1]);
    close(mid[1].to, 3.5 / 12);
    close(progress(d, 12, 3.5).consumed, 3.5 / 12);
    close(progress(d, 12, 3.5).remaining, 1 - 3.5 / 12);
    expect(progress(d, 12, 3.5).beyond).toBe(0);
    expect(handPosition(d, 12, 3.5)).toEqual({ ring: 'window', turn: 3.5 / 12 });
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

  it('sets each stage name along the part of its arc that lies inside the window', () => {
    const places = labelPlacements([1, 6, 4, 2], 12);
    expect(places.map((p) => p.ring)).toEqual(['window', 'window', 'window', 'window']);
    close(places[1].at, 4 / 12);
    // Intervene is split by the boundary: it is named on its part inside the window.
    close(places[3].at, 11.5 / 12);
    // A stage wholly beyond the window is not named on the dial.
    const late = labelPlacements([6, 6, 3, 2], 12);
    expect(late[2].ring).toBe('beyond');
    expect(fitsLabel(STAGES[2], late[2])).toBe(false);
    for (const preset of PRESETS) for (const window of Object.values(WINDOWS)) {
      labelPlacements(preset.durations, window).forEach((p) => expect(p.span).toBeGreaterThan(0));
    }
    // Every stage of the opening scenario carries its name.
    expect(places.map((p, i) => fitsLabel(STAGES[i], p))).toEqual([true, true, true, true]);
  });

  it('gives a stage no name on the dial when it starts past what the inner ring can show', () => {
    const max = [STAGE_MAX, STAGE_MAX, STAGE_MAX, STAGE_MAX];
    const places = labelPlacements(max, WINDOWS.shorter);
    expect(places).toHaveLength(4);
    expect(places[3].span).toBe(0);
    expect(fitsLabel(STAGES[3], places[3])).toBe(false);
    // It is still counted: the stage ends beyond the window and the figure says by how much.
    expect(endsBeyond(max, WINDOWS.shorter)[3]).toBe(true);
  });

  it('turns an arc into stroke-dash values on a unit circle', () => {
    expect(dash({ stage: 1, ring: 'window', from: 0.25, to: 0.75 })).toEqual({ array: '0.5 2', offset: '-0.25' });
    expect(dash({ stage: 1, ring: 'window', from: 0.25, to: 0.75 }, 0.01)).toEqual({ array: '0.49 2', offset: '-0.25' });
    expect(dash(undefined)).toEqual({ array: '0 2', offset: '0' });
  });
});

describe('the word in the dial centre', () => {
  it('is never set wider than the centre can hold, whatever it says', () => {
    // Every word the centre can show: the three outcomes and the four stage names.
    for (const word of ['In time', 'Narrow margin', 'Too late', ...STAGES]) {
      const size = centreWordSize(word);
      const fitted = Number(size.match(/, ([\d.]+)cqw, [\d.]+px\)$/)![1]);
      // At 0.6 of its size per character, the word spans at most 46% of the dial.
      expect(Math.min(11, fitted) * word.length * 0.6).toBeLessThanOrEqual(46);
    }
  });

  it('gives a short word the full size and a long word a smaller one', () => {
    expect(centreWordSize('In time')).toBe('min(11cqw, 10.95cqw, 70.08px)');
    expect(centreWordSize('Too late')).toBe('min(11cqw, 9.58cqw, 61.31px)');
    expect(centreWordSize('Narrow margin')).toBe('min(11cqw, 5.89cqw, 37.69px)');
  });
});
