/**
 * Geometry and progress for the intervention scene. Presentation only: every
 * quantity is derived from the scenario model (window-model.ts), which
 * remains the single place an outcome is decided.
 *
 * The time model, stated once:
 *
 *   - One straight axis. Position is linear in time: the signal is at the
 *     start and a stage of duration d occupies d / axis of its length.
 *   - The window and the response share that axis, so the boundary where the
 *     window closes falls at window / axis for both.
 *   - Time does not stop or reset at the boundary. The response simply
 *     continues past it, into the region marked irreversible.
 *   - A chain that ends exactly on the boundary ends exactly at that mark and
 *     puts nothing beyond it, matching the model, in which only
 *     total > window is too late.
 *   - The axis is long enough to show the whole chain and the whole window,
 *     and never shorter than sixteen units, so common scenarios share one
 *     scale and the boundary does not move when a preset changes.
 */

export type StageState = 'pending' | 'active' | 'completed';

const MIN_AXIS = 16;

const startsOf = (durations: readonly number[]): number[] => {
  const out: number[] = [];
  let t = 0;
  for (const d of durations) { out.push(t); t += d; }
  return out;
};
const totalOf = (durations: readonly number[]) => durations.reduce((a, b) => a + b, 0);

/** Length of the drawn axis, in model units. */
export function axisLength(durations: readonly number[], window: number): number {
  return Math.max(MIN_AXIS, window + 1, totalOf(durations) + 1);
}

export interface Segment {
  /** Left edge and width, as fractions of the axis. */
  start: number;
  length: number;
  /** Share of this stage that falls inside the window, 0 to 1. */
  inside: number;
}

export function segments(durations: readonly number[], window: number): Segment[] {
  const axis = axisLength(durations, window);
  return startsOf(durations).map((start, i) => ({
    start: start / axis,
    length: durations[i] / axis,
    inside: Math.min(1, Math.max(0, (window - start) / durations[i])),
  }));
}

/** Where the window closes, as a fraction of the axis. */
export function boundary(durations: readonly number[], window: number): number {
  return window / axisLength(durations, window);
}

/** Where the present moment sits. Omit `elapsed` for the finished chain. */
export function now(durations: readonly number[], window: number, elapsed = Infinity): number {
  return Math.min(totalOf(durations), Math.max(0, elapsed)) / axisLength(durations, window);
}

/** A stage is completed only once its whole duration has elapsed. */
export function stageStates(durations: readonly number[], elapsed = Infinity): StageState[] {
  return startsOf(durations).map((start, i) => (
    elapsed >= start + durations[i] ? 'completed' : elapsed > start || (i === 0 && elapsed === 0) ? 'active' : 'pending'
  ));
}

/** Whether a stage ends after the window has closed. */
export function endsBeyond(durations: readonly number[], window: number): boolean[] {
  return startsOf(durations).map((start, i) => start + durations[i] > window);
}

export interface Progress {
  /** Share of the window used so far, 0 to 1. */
  consumed: number;
  /** Share of the window still open, 0 to 1. */
  remaining: number;
  /** Time past the boundary, as a share of the window. */
  beyond: number;
}

export function progress(durations: readonly number[], window: number, elapsed = Infinity): Progress {
  const t = Math.min(totalOf(durations), Math.max(0, elapsed));
  const consumed = Math.min(t, window) / window;
  return { consumed, remaining: 1 - consumed, beyond: Math.max(0, t - window) / window };
}

export const percent = (share: number): string => `${Math.round(share * 100)}%`;
