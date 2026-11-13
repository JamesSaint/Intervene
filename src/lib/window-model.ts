/**
 * The illustrative intervention-window model behind WindowLab.
 *
 * Four sequential stages spend time against one window. Units are relative:
 * they encode proportion and order, never a measured duration, and nothing
 * here is an AGDA® computation, score or verdict. The model exists to show
 * the assessment question, which is why its outcome labels are plain words
 * and not the three verdict states.
 *
 * Shared by the component's server render and its client script so the
 * first paint and the interactive state cannot disagree.
 */

export const AXIS = 24;
export const STAGE_MIN = 1;
export const STAGE_MAX = 6;

export const STAGES = ['Detect', 'Escalate', 'Decide', 'Intervene'] as const;

/** The window as set, and the same window 25% shorter and 25% longer. */
export const WINDOWS = { shorter: 9, set: 12, longer: 15 } as const;
export type WindowKey = keyof typeof WINDOWS;

export type Outcome = 'in-time' | 'narrow' | 'too-late';

export interface Result {
  /** Where each stage starts, in units from the signal. */
  starts: number[];
  total: number;
  outcome: Outcome;
  /** Index of the stage in progress when the window closes, or null. */
  closesDuring: number | null;
  /** Index of the single longest stage, or null when two or more tie. */
  longest: number | null;
}

export function evaluate(durations: readonly number[], window: number): Result {
  const starts: number[] = [];
  let total = 0;
  for (const d of durations) {
    starts.push(total);
    total += d;
  }
  const closesDuring = total > window
    ? durations.findIndex((d, i) => starts[i] + d > window)
    : null;
  // A narrow margin is one that would not survive the window being 25% shorter.
  const outcome: Outcome = total > window ? 'too-late' : total > window * 0.75 ? 'narrow' : 'in-time';
  const max = Math.max(...durations);
  const longest = durations.filter((d) => d === max).length === 1 ? durations.indexOf(max) : null;
  return { starts, total, outcome, closesDuring, longest };
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  'in-time': 'In time',
  narrow: 'Narrow margin',
  'too-late': 'Too late',
};

export function describe(result: Result): string {
  const longest = result.longest === null ? '' : ` ${STAGES[result.longest]} takes the largest share of the time.`;
  if (result.outcome === 'in-time') return `Intervention takes effect before the window closes.${longest}`;
  if (result.outcome === 'narrow') {
    return `Intervention takes effect before the window closes, but would not if the window were 25% shorter.${longest}`;
  }
  const stage = STAGES[result.closesDuring ?? STAGES.length - 1];
  return `The window closes during ${stage}. Intervention takes effect after it has closed.${longest}`;
}

export interface Preset {
  key: string;
  label: string;
  durations: [number, number, number, number];
  /** What goes wrong, in the wording the stage explanations already use. */
  text: string;
}

export const PRESETS: Preset[] = [
  { key: 'holds', label: 'The chain holds', durations: [2, 2, 2, 2], text: 'Detection, escalation and a decision with authority lead to effective intervention before the window closes.' },
  { key: 'margin', label: 'A good day', durations: [2, 3, 3, 3], text: 'The chain completes, but within a margin that operational noise can erode.' },
  { key: 'reach', label: 'Authority out of reach', durations: [1, 6, 4, 2], text: 'The signal reaches someone who cannot authorise action.' },
  { key: 'quorum', label: 'Decision needs a quorum', durations: [2, 3, 6, 2], text: 'A decision depends on a quorum or approval route that cannot operate in time.' },
  { key: 'signal', label: 'Warning not acted on', durations: [6, 2, 3, 2], text: 'A warning exists but does not become an actionable signal.' },
  { key: 'halt', label: 'Halt lands late', durations: [2, 2, 3, 6], text: 'An authorised action does not take effect under the relevant operating conditions.' },
];

export const DEFAULT_PRESET = 'reach';
export const CUSTOM_TEXT = 'Your own scenario. Move any stage to see where the window closes.';

/** What each stage does, in the methodology's own words for the four steps. */
export const STAGE_ACTIONS = [
  'Recognise the need to act',
  'Reach decision authority',
  'Make the decision',
  'Put it into effect',
] as const;
