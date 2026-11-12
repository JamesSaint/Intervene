// The same illustrative model as src/lib/window-model.ts, restated for the prototypes.
export const AXIS = 24, WINDOW = 12;
export const STAGES = ['Detect', 'Escalate', 'Decide', 'Intervene'];
export const PRESETS = [
  { key: 'reach', label: 'Authority out of reach', d: [1, 6, 4, 2], text: 'The signal reaches someone who cannot authorise action.' },
  { key: 'quorum', label: 'Decision needs a quorum', d: [2, 3, 6, 2], text: 'A decision depends on a quorum or approval route that cannot operate in time.' },
  { key: 'signal', label: 'Warning not acted on', d: [6, 2, 3, 2], text: 'A warning exists but does not become an actionable signal.' },
  { key: 'halt', label: 'Halt lands late', d: [2, 2, 3, 6], text: 'An authorised action does not take effect under the relevant operating conditions.' },
  { key: 'margin', label: 'A good day', d: [2, 3, 3, 3], text: 'The chain completes, but within a margin that operational noise can erode.' },
  { key: 'holds', label: 'The chain holds', d: [2, 2, 2, 2], text: 'Detection, escalation and a decision with authority lead to effective intervention before the window closes.' },
];
export function evaluate(d, w = WINDOW) {
  const starts = []; let t = 0; for (const x of d) { starts.push(t); t += x; }
  const outcome = t > w ? 'too-late' : t > w * 0.75 ? 'narrow' : 'in-time';
  const closesDuring = t > w ? d.findIndex((x, i) => starts[i] + x > w) : null;
  return { starts, total: t, outcome, closesDuring };
}
export const LABEL = { 'in-time': 'In time', narrow: 'Narrow margin', 'too-late': 'Too late' };
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
