/**
 * Geometry for the intervention dial. Presentation only: every quantity here
 * is derived from the scenario model (window-model.ts), which remains the
 * single place an outcome is decided.
 *
 * The time model, stated once:
 *
 *   - One revolution of the outer ring is the intervention window. Angle is
 *     linear in time: a stage of duration d subtends d / window of a turn.
 *   - Time starts at twelve o'clock and runs clockwise. Twelve o'clock is
 *     therefore both the signal and, one turn later, the moment the window
 *     closes.
 *   - Time does not reset at the boundary. Anything after it is drawn on a
 *     separate inner ring, starting again from twelve o'clock at the same
 *     angular rate. The inner ring means "beyond the window" and nothing else.
 *   - A chain that ends exactly on the boundary ends at twelve o'clock on the
 *     outer ring and draws nothing on the inner ring, matching the model, in
 *     which only total > window is too late.
 *   - The inner ring holds one further window's worth of time. A chain that
 *     runs longer is clamped there, and `progress().beyond` still reports the
 *     true figure, so the numbers stay truthful where the drawing saturates.
 */

export type Ring = 'window' | 'beyond';
export type StageState = 'pending' | 'active' | 'completed';

export interface DialArc {
  stage: number;
  ring: Ring;
  /** Start and end, as fractions of one revolution clockwise from twelve o'clock. */
  from: number;
  to: number;
}

const startsOf = (durations: readonly number[]): number[] => {
  const out: number[] = [];
  let t = 0;
  for (const d of durations) { out.push(t); t += d; }
  return out;
};
const totalOf = (durations: readonly number[]) => durations.reduce((a, b) => a + b, 0);

/** The arcs to draw once `elapsed` units have passed. Omit `elapsed` for the finished chain. */
export function dialArcs(durations: readonly number[], window: number, elapsed = Infinity): DialArc[] {
  const arcs: DialArc[] = [];
  startsOf(durations).forEach((start, stage) => {
    const end = Math.min(start + durations[stage], Math.max(start, elapsed));
    if (end <= start) return;
    if (start < window) arcs.push({ stage, ring: 'window', from: start / window, to: Math.min(end, window) / window });
    if (end > window) {
      const from = (Math.max(start, window) - window) / window;
      if (from < 1) arcs.push({ stage, ring: 'beyond', from, to: Math.min((end - window) / window, 1) });
    }
  });
  return arcs;
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
  /** Time past the boundary, as a share of the window. Not clamped. */
  beyond: number;
}

export function progress(durations: readonly number[], window: number, elapsed = Infinity): Progress {
  const t = Math.min(totalOf(durations), Math.max(0, elapsed));
  const consumed = Math.min(t, window) / window;
  return { consumed, remaining: 1 - consumed, beyond: Math.max(0, t - window) / window };
}

/** Where the moving marker sits: which ring, and how far round it. */
export function handPosition(durations: readonly number[], window: number, elapsed = Infinity): { ring: Ring; turn: number } {
  const t = Math.min(totalOf(durations), Math.max(0, elapsed));
  return t <= window ? { ring: 'window', turn: t / window } : { ring: 'beyond', turn: Math.min((t - window) / window, 1) };
}

/** Stroke-dash values for an arc on a circle whose pathLength is 1. `gap` separates stages. */
export function dash(arc: DialArc | undefined, gap = 0): { array: string; offset: string } {
  if (!arc) return { array: '0 2', offset: '0' };
  return { array: `${Math.max(0, arc.to - arc.from - gap)} 2`, offset: String(-arc.from) };
}

export const percent = (share: number): string => `${Math.round(share * 100)}%`;

/**
 * The size of the word in the dial's centre, as a CSS length in units of
 * the dial's own width. At most 11% of that width, and less for a longer
 * word, so the word always sits inside the inner ring: a character of the
 * display face is taken as 0.6 of its size, and the word is given 46% of
 * the dial across. Written as a whole declaration, not through a custom
 * property, so the server render and the script write the same thing.
 */
export const centreWordSize = (word: string): string => `min(11cqw, ${(Math.floor((46 / (Math.max(word.length, 1) * 0.6)) * 100) / 100).toFixed(2)}cqw)`;

export interface LabelPlacement {
  ring: Ring;
  /** Mid-point of the part of the stage the name is set along, as a turn. */
  at: number;
  /** Length of that part, as a turn. */
  span: number;
}

/**
 * Where each stage's name is set along its own arc. Names are set on the
 * outer ring only, which is wide enough to carry them: a stage with any part
 * inside the window is named on that part. A stage wholly beyond the window
 * has no name on the dial; the stage list beside it carries the name.
 */
export function labelPlacements(durations: readonly number[], window: number): LabelPlacement[] {
  const arcs = dialArcs(durations, window);
  return durations.map((_, stage) => {
    const parts = arcs.filter((a) => a.stage === stage);
    // A stage that starts more than a full window late is past what the inner
    // ring can show. It has no arc, so its name is not set on the dial; the
    // stage list and the figures still account for it.
    if (!parts.length) return { ring: 'beyond', at: 1, span: 0 };
    const best = parts.find((a) => a.ring === 'window') ?? parts[0];
    return { ring: best.ring, at: (best.from + best.to) / 2, span: best.to - best.from };
  });
}

/** Radii of the two rings in the dial's 600-unit drawing, and the room a name needs. */
/* The outer ring is the wide one: it is the window. The inner ring is
   narrow and close inside it, so time beyond the window reads as an
   overrun of the same track, not as a second dial. */
export const RADIUS: Record<Ring, number> = { window: 238, beyond: 204 };
export const STROKE: Record<Ring, number> = { window: 30, beyond: 12 };
export const fitsLabel = (name: string, placement: LabelPlacement): boolean =>
  placement.ring === 'window' && placement.span * 2 * Math.PI * RADIUS.window >= name.length * 9 + 14;
