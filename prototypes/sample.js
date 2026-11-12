// The constructed retail-credit sample, restated from src/lib/sample-report.ts
// and FindingChain. `stage` on each record is NOT in the published sample: it
// is this prototype's reading of which stage a record bears on, and needs
// confirming before it is published.
export const STAGES = [
  { key: 'detect', name: 'Detect', value: '~12 min', rel: 'within', relText: 'Within the window', note: 'Drift identified above threshold.', lo: 12, hi: 12 },
  { key: 'escalate', name: 'Escalate', value: '4 to 96 hours', rel: 'may', relText: 'May consume or exceed the window', note: 'To reach a person with authority to halt.', lo: 240, hi: 5760 },
  { key: 'decide', name: 'Decide', value: '≥ 7 days', rel: 'exceeds', relText: 'Exceeds the window on its own', note: 'To obtain the quorum that person needs. No out-of-cycle route.', lo: 10080, hi: null },
  { key: 'intervene', name: 'Intervene', value: 'Not assessed', rel: 'after', relText: 'Preceding delay already exceeds the window', note: 'The source assumes about six minutes to propagate a halt if instructed; no duration is assessed here.', lo: null, hi: null },
];
export const EVIDENCE = [
  { id: 'E-02', stage: 'detect', type: 'Operational', desc: 'Production drift monitoring runtime logs (12 months).', open: 'A source for detection timing, subject to coverage, provenance and scenario relevance.' },
  { id: 'E-01', stage: 'detect', type: 'Incident', desc: '2024 outage post-mortem with timing telemetry.', open: 'A source for performance under those conditions. Transfer to the present scenario needs justification.' },
  { id: 'E-04', stage: 'escalate', type: 'Exercise', desc: 'Tabletop exercise minutes, 2024-Q4.', open: 'Evidence of the described exercise only. Not a live event.' },
  { id: 'E-12', stage: 'decide', type: 'Verbal', desc: '"On-call halt authority exists." Stated in interview, no document.', open: 'A claim requiring corroboration. It does not establish available authority.' },
  { id: 'E-08', stage: 'decide', type: 'Document', desc: 'MRC charter naming halt authority.', open: 'Documented allocation of authority. It does not establish that the required quorum can be reached in time.' },
  { id: 'E-06', stage: null, type: 'Record', desc: 'Hashed audit log sample, regulator-format export.', open: 'Evidence of recorded activity. It does not establish regulatory acceptance or the integrity of every operational record.' },
];
export const WINDOW_MIN = 360;
export const CONCLUSION = {
  state: 'After impact',
  body: 'The required route to an authorised intervention cannot complete within the assumed six-hour window. Faster detection cannot by itself resolve that constraint.',
  constraint: 'Authority, not detection.',
  decision: 'Can the affected pathway continue operating under its present authority arrangements?',
};
export const STATUS = 'Constructed illustration · Not issued · Not signed';
