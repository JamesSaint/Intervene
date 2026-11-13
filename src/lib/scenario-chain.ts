/**
 * The dial's illustrative scenario, read stage by stage for the SEDI chain.
 *
 * It restates what src/lib/window-model.ts already decides, in the form the
 * chain draws: each stage's share of the window, whether it completes inside
 * the window, and how far through a stage the window closes. Nothing here
 * decides an outcome. The states are interface states of the illustrative
 * model, not AGDA® assessment states or verdicts.
 */
import { evaluate } from './window-model';

export type ChainState = 'completed' | 'closes' | 'after';

export interface ChainStage {
  /** This stage's duration as a fraction of the window (may exceed 1). */
  share: number;
  percent: string;
  state: ChainState;
  text: string;
  /** How far through this stage the window closes (0 to 1), or null. */
  boundary: number | null;
  /** The single longest stage, as the model reports it. */
  longest: boolean;
}

export const CHAIN_TEXT: Record<ChainState, string> = {
  completed: 'Inside the window',
  closes: 'Window closes here',
  after: 'After the window',
};

export function scenarioChain(durations: readonly number[], window: number): ChainStage[] {
  const result = evaluate(durations, window);
  return durations.map((d, i) => {
    const start = result.starts[i];
    const state: ChainState = start + d <= window ? 'completed' : start >= window ? 'after' : 'closes';
    return {
      share: d / window,
      percent: `${Math.round((d / window) * 100)}%`,
      state,
      text: CHAIN_TEXT[state],
      boundary: state === 'closes' ? (window - start) / d : null,
      longest: result.longest === i,
    };
  });
}
