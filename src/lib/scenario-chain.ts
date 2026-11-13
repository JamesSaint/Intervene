/**
 * The dial's illustrative scenario, read stage by stage for the SEDI chain.
 *
 * It restates what src/lib/window-model.ts already decides, in the form the
 * chain draws. Nothing here decides an outcome. The states are interface
 * states of the illustrative model, not AGDA® assessment states or verdicts.
 *
 * Five quantities are kept apart, all as fractions of the window:
 *   duration   how long one stage takes (`share`);
 *   elapsed    time from the signal to the end of a stage (`end`), which is
 *              cumulative and may exceed 1;
 *   window     the available intervention window, always 1;
 *   remaining  window left when the chain completes, never below 0;
 *   beyond     time the chain runs past the window, never below 0.
 */
import { evaluate } from './window-model';

export type ChainState = 'completed' | 'closes' | 'after';

export interface ChainStage {
  /** This stage's own duration as a fraction of the window. */
  share: number;
  /** The same, as text: "50%". */
  percent: string;
  /** Elapsed time when this stage starts and ends, as fractions of the window. */
  start: number;
  end: number;
  /** Cumulative elapsed time at the end of this stage, as text. May exceed 100%. */
  endPercent: string;
  state: ChainState;
  text: string;
  /** How far through this stage the window closes (0 to 1), or null. */
  boundary: number | null;
  /** The single longest stage, as the model reports it. */
  longest: boolean;
}

export interface ChainTotals {
  /** The whole chain as a fraction of the window. May exceed 1. */
  total: number;
  remaining: number;
  beyond: number;
  /** The length the chain's tracks are drawn to: the window, or the chain if longer. */
  scale: number;
}

export const CHAIN_TEXT: Record<ChainState, string> = {
  completed: 'Inside the window',
  closes: 'Window closes here',
  after: 'After the window',
};

const pct = (fraction: number) => `${Math.round(fraction * 100)}%`;

export function scenarioChain(durations: readonly number[], window: number): ChainStage[] {
  const result = evaluate(durations, window);
  return durations.map((d, i) => {
    const start = result.starts[i];
    const state: ChainState = start + d <= window ? 'completed' : start >= window ? 'after' : 'closes';
    return {
      share: d / window,
      percent: pct(d / window),
      start: start / window,
      end: (start + d) / window,
      endPercent: pct((start + d) / window),
      state,
      text: CHAIN_TEXT[state],
      boundary: state === 'closes' ? (window - start) / d : null,
      longest: result.longest === i,
    };
  });
}

export function chainTotals(durations: readonly number[], window: number): ChainTotals {
  const total = evaluate(durations, window).total / window;
  return { total, remaining: Math.max(0, 1 - total), beyond: Math.max(0, total - 1), scale: Math.max(1, total) };
}

/** The totals as the chain states them. Percentages above 100% are stated as they are. */
export const totalsText = (t: ChainTotals) => ({ total: pct(t.total), remaining: pct(t.remaining), beyond: pct(t.beyond) });
