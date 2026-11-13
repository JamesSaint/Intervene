import { describe, it, expect } from 'vitest';
import { scenarioChain, chainTotals, totalsText } from '../../src/lib/scenario-chain';
import { PRESETS, WINDOWS, evaluate } from '../../src/lib/window-model';

const preset = (key: string) => PRESETS.find((p) => p.key === key)!.durations;

describe('the dial scenario read stage by stage', () => {
  it('gives each stage its share of the window', () => {
    const chain = scenarioChain(preset('reach'), WINDOWS.set);
    expect(chain.map((s) => s.percent)).toEqual(['8%', '50%', '33%', '17%']);
    expect(chain.map((s) => s.share)).toEqual([1 / 12, 6 / 12, 4 / 12, 2 / 12]);
  });

  it('marks where the window closes, and how far through that stage', () => {
    const chain = scenarioChain(preset('reach'), WINDOWS.set);
    expect(chain.map((s) => s.state)).toEqual(['completed', 'completed', 'completed', 'closes']);
    // Detect 1 + Escalate 6 + Decide 4 = 11 of 12: the window closes halfway through Intervene's 2.
    expect(chain[3].boundary).toBe(0.5);
    expect(chain.slice(0, 3).every((s) => s.boundary === null)).toBe(true);
  });

  it('marks stages that start after the window has closed', () => {
    const chain = scenarioChain([6, 6, 3, 2], WINDOWS.shorter);
    expect(chain.map((s) => s.state)).toEqual(['completed', 'closes', 'after', 'after']);
    expect(chain[1].boundary).toBe(0.5);
  });

  it('treats a chain that ends exactly on the boundary as inside it, as the model does', () => {
    const chain = scenarioChain([3, 3, 3, 3], WINDOWS.set);
    expect(chain.every((s) => s.state === 'completed' && s.boundary === null)).toBe(true);
    expect(evaluate([3, 3, 3, 3], WINDOWS.set).outcome).toBe('narrow');
  });

  it('never disagrees with the model about the outcome or the longest stage', () => {
    for (const p of PRESETS) for (const w of Object.values(WINDOWS)) {
      const result = evaluate(p.durations, w);
      const chain = scenarioChain(p.durations, w);
      expect(chain.some((s) => s.state !== 'completed')).toBe(result.outcome === 'too-late');
      expect(chain.findIndex((s) => s.state === 'closes')).toBe(result.closesDuring ?? -1);
      expect(chain.findIndex((s) => s.longest)).toBe(result.longest ?? -1);
    }
  });

  it('pairs each failing preset with the stage whose failure it describes', () => {
    // The preset wording is the stage's own "possible failure" wording, so the pairing is by text, not by inference.
    const longest = (key: string) => scenarioChain(preset(key), WINDOWS.set).findIndex((s) => s.longest);
    expect([longest('signal'), longest('reach'), longest('quorum'), longest('halt')]).toEqual([0, 1, 2, 3]);
  });

  it('keeps a stage\'s duration apart from the elapsed time at which it completes', () => {
    const chain = scenarioChain(preset('reach'), WINDOWS.set);
    // Durations: 1, 6, 4, 2 of a window of 12.
    expect(chain.map((s) => s.percent)).toEqual(['8%', '50%', '33%', '17%']);
    // Elapsed at completion is cumulative: 1, 7, 11, 13 of 12.
    expect(chain.map((s) => s.endPercent)).toEqual(['8%', '58%', '92%', '108%']);
    expect(chain.map((s) => s.start * 12)).toEqual([0, 1, 7, 11]);
    for (const s of chain) expect(s.end - s.start).toBeCloseTo(s.share, 12);
  });

  it('states elapsed time above 100% as it is, and never clamps it', () => {
    // The longest chain against the shortest window: 24 units against 9.
    const chain = scenarioChain([6, 6, 6, 6], WINDOWS.shorter);
    expect(chain.map((s) => s.endPercent)).toEqual(['67%', '133%', '200%', '267%']);
    const totals = chainTotals([6, 6, 6, 6], WINDOWS.shorter);
    expect(totalsText(totals)).toEqual({ total: '267%', remaining: '0%', beyond: '167%' });
    expect(totals.scale).toBeCloseTo(24 / 9, 12);
  });

  it('accounts for the window exactly: used plus remaining is the window, and beyond is what is left over', () => {
    for (const p of PRESETS) for (const w of Object.values(WINDOWS)) {
      const t = chainTotals(p.durations, w);
      const result = evaluate(p.durations, w);
      expect(t.total).toBeCloseTo(result.total / w, 12);
      expect(Math.min(t.total, 1) + t.remaining).toBeCloseTo(1, 12);
      expect(t.beyond).toBeCloseTo(Math.max(0, t.total - 1), 12);
      expect(t.remaining === 0 || t.beyond === 0).toBe(true);
      expect(t.beyond > 0).toBe(result.outcome === 'too-late');
      expect(t.scale).toBe(Math.max(1, t.total));
    }
  });

  it('agrees with the dial\'s own meter for every preset and window', async () => {
    const { progress, percent } = await import('../../src/lib/dial-geometry');
    for (const p of PRESETS) for (const w of Object.values(WINDOWS)) {
      const meter = progress(p.durations, w);
      const text = totalsText(chainTotals(p.durations, w));
      expect(text.remaining).toBe(percent(meter.remaining));
      expect(text.beyond).toBe(percent(meter.beyond));
    }
  });
});
