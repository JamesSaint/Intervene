/**
 * The constructed retail-credit sample, as data.
 *
 * One source for /sample-report/ and the artefact viewer on the homepage, so
 * the two cannot drift. Everything here is illustrative: no client data, no
 * real organisation, not run as an assessment, not issued and not signed.
 */

export const cover = [
  { k: 'System',    v: 'CRED-MOD-04 · Retail Credit Decisioning' },
  { k: 'Scenario',  v: 'Macro shock · model drift' },
  { k: 'Sample',    v: 'Constructed example · not a client report' },
  { k: 'Issued',    v: 'No. Not an issued assessment' },
  { k: 'Signed',    v: 'No. Illustrative metadata only' },
];

export const systemSpecs = [
  { k: 'System ID',            v: 'CRED-MOD-04',                       u: 'Retail Credit Decisioning' },
  { k: 'Materiality',          v: 'Tier 1',                            u: 'internal taxonomy' },
  { k: 'Decision authority',   v: 'Approve / decline / refer',         u: 'no human override on auto-decline' },
  { k: 'Volume',               v: '~18,000 / day',                     u: 'UK personal lending' },
  { k: 'Trigger scenario',     v: 'Macro shock + model drift',         u: 'simultaneous' },
  { k: 'Intervention window',  v: '~6 hours',                          u: 'illustrative scenario assumption; operational basis not substantiated' },
];

export const controls = [
  { code: 'C-01', name: 'Real-time decision logging',         assessment: 'Production-grade. Timing telemetry from a 2024 outage post-mortem. Detection capability strong; surface latency under 90s.',                rag: 'green', terminal: 'GREEN' },
  { code: 'C-02', name: 'Drift monitoring (PSI / KS)',        assessment: 'Operational in production. Threshold tuning not re-validated since model retrain in 2025-Q3. Confidence constrained under evidence review.',  rag: 'amber', terminal: 'AMBER' },
  { code: 'C-03', name: 'Escalation to MRC',                  assessment: 'Documented in policy. One tabletop in 2024-Q4. Has not run live. Authority pathway terminates at a forum that meets monthly.',     rag: 'red',   terminal: 'RED'   },
  { code: 'C-04', name: 'Halt authority',                     assessment: 'Three named approvers. None authorised to halt unilaterally. Quorum required. No on-call rota. Weekend gap.',                       rag: 'red',   terminal: 'RED'   },
  { code: 'C-05', name: 'Manual override on auto-decline',    assessment: 'Designed-out. No human-in-the-loop on the high-volume decline path. Reversibility limited to next-day reprocessing.',                rag: 'red',   terminal: 'RED'   },
  { code: 'C-06', name: 'Audit trail',                        assessment: 'Immutable, hashed, retained 7 years. Decision rationale captured per inference. Auditable to regulator standard.',                   rag: 'amber', terminal: 'AMBER' },
];

export const stages = [
  { stage: 'Detect',       value: '~12 min',       detail: 'to detect drift above threshold. A further ~38 min for the signal to reach a first responder is recorded separately.', status: 'pass', verdict: 'PRESENT' },
  { stage: 'Escalate',     value: '4 to 96 hours', detail: 'to reach an authority holder. Availability and routing can consume or exceed the window.', status: 'fail', verdict: 'CAN EXCEED WINDOW' },
  { stage: 'Decide',       value: '≥ 7 days',      detail: 'to obtain the required quorum. No out-of-cycle route. This alone exceeds the assumed window.', status: 'fail', verdict: 'EXCEEDS WINDOW' },
  { stage: 'Intervene',    value: '~6 min',        detail: 'to propagate a halt if instructed. No in-window reversal on the auto-decline path.', status: 'fail', verdict: 'NO TIMELY AUTHORITY' },
];

export const gates = [
  { id: 'G-01', desc: 'Drift signal generation latency',          measured: '~12 min',           rag: 'green', verdict: 'PASS' },
  { id: 'G-02', desc: 'Signal surfaces to first responder',       measured: '~38 min',           rag: 'amber', verdict: 'MARGIN' },
  { id: 'G-03', desc: 'First responder reaches authority holder', measured: 'variable · 4 to 96h', rag: 'red',   verdict: 'FAIL' },
  { id: 'G-04', desc: 'Authority holder reaches quorum',          measured: '≥ 7 days',          rag: 'red',   verdict: 'FAIL' },
  { id: 'G-05', desc: 'Quorum decision recorded',                 measured: 'monthly cadence',   rag: 'red',   verdict: 'FAIL' },
  { id: 'G-06', desc: 'Halt instruction propagated to system',    measured: '~6 min (if instructed)', rag: 'green', verdict: 'PASS' },
];

export const evidence = [
  { id: 'E-12', desc: '"On-call halt authority exists." Stated in interview, no document.', type: 'Verbal',      open: 'A claim requiring corroboration. It does not establish available authority.' },
  { id: 'E-08', desc: 'MRC charter naming halt authority.',                                  type: 'Document',    open: 'Documented allocation of authority. It does not establish that the required quorum can be reached in time.' },
  { id: 'E-04', desc: 'Tabletop exercise minutes, 2024-Q4.',                                 type: 'Exercise',    open: 'Evidence of the described exercise only. Not a live event.' },
  { id: 'E-02', desc: 'Production drift monitoring runtime logs (12 months).',               type: 'Operational', open: 'A source for detection timing, subject to coverage, provenance and scenario relevance.' },
  { id: 'E-01', desc: '2024 outage post-mortem with timing telemetry.',                      type: 'Incident',    open: 'A source for performance under those conditions. Transfer to the present scenario needs justification.' },
  { id: 'E-06', desc: 'Hashed audit log sample, regulator-format export.',                   type: 'Record',      open: 'Evidence of recorded activity. It does not establish regulatory acceptance or the integrity of every operational record.' },
];

/** Proposed priorities for the scenario. They claim no implementation and no favourable reassessment. */
export const priorities = [
  { lead: 'Define who may authorise an intervention', rest: 'and the circumstances in which that authority can be exercised.' },
  { lead: 'Establish an available decision route', rest: ', including out-of-hours cover and any required delegation.' },
  { lead: 'Confirm how a halt, redirection or containment action takes effect', rest: 'and what happens to decisions already made.' },
  { lead: 'Exercise the complete response', rest: ', record timing and evidence, then reassess the identified constraint.' },
];

export const DECISION_QUESTION = 'Can the affected pathway continue operating under its present authority arrangements?';
export const PRIORITIES_NOTE =
  'These are proposed priorities for the scenario. They do not claim that remediation has been implemented or that it will produce a favourable reassessment.';
export const SAMPLE_LIMITS =
  'One pathway and one scenario. Nothing here is a conclusion about any institution, other systems or legal conformity.';

/* ------------------------------------------------------------------
   The homepage finding, as data. Values and wording are the constructed
   sample's own, as previously drawn by FindingChain. Intervals are stated as
   text, not drawn to scale, and nothing is added to anything else.
   ------------------------------------------------------------------ */

/** The window is a scenario assumption: "about six hours". */
export const WINDOW_LABEL = 'about six hours';

export interface FindingStage {
  key: 'detect' | 'escalate' | 'decide' | 'intervene';
  name: string;
  value: string;
  /** How the stage stands against the window on its own. */
  rel: 'within' | 'may' | 'exceeds' | 'after';
  relText: string;
  note: string;
}

export const findingStages: FindingStage[] = [
  { key: 'detect', name: 'Detect', value: '~12 min', rel: 'within', relText: 'Within the window', note: 'Drift identified above threshold.' },
  { key: 'escalate', name: 'Escalate', value: '4 to 96 hours', rel: 'may', relText: 'May consume or exceed the window', note: 'To reach a person with authority to halt.' },
  { key: 'decide', name: 'Decide', value: '≥ 7 days', rel: 'exceeds', relText: 'Exceeds the window on its own', note: 'To obtain the quorum that person needs. No out-of-cycle route.' },
  { key: 'intervene', name: 'Intervene', value: 'Not assessed', rel: 'after', relText: 'Preceding delay already exceeds the window', note: 'The source assumes about six minutes to propagate a halt if instructed; no duration is assessed here, and decisions already made are reprocessed next day.' },
];

export const DECISIVE_CONSTRAINT =
  'Authority, not detection. The route to a person with authority may itself exceed the window, and the quorum that person needs exceeds it on its own. Faster detection cannot change that. Naming this constraint does not show that the other stages are adequate.';

export const FINDING_FOOTNOTE =
  'Constructed illustration: no client result, issued assessment or verified outcome. Intervals are separate illustrative facts, not to scale and not added together. Their endpoints and any overlap are not established; no total response time is computed.';

/* Which stage a record bears on. Only links the sample itself supports are
   drawn, and `basis` quotes the wording that supports each one. Where the
   sample ties a record to a control but not to a single stage, `stage` is
   null and the record is shown unattached, with the reason. These are
   readings of a constructed example, not assessment findings. */
export interface RecordLink { id: string; stage: FindingStage['key'] | null; basis: string }

export const recordLinks: RecordLink[] = [
  { id: 'E-02', stage: 'detect', basis: 'The register describes it as "a source for detection timing".' },
  { id: 'E-01', stage: 'detect', basis: 'Control C-01 cites "timing telemetry from a 2024 outage post-mortem" for detection capability.' },
  { id: 'E-04', stage: 'escalate', basis: 'Control C-03, escalation to MRC, cites "one tabletop in 2024-Q4".' },
  { id: 'E-08', stage: 'decide', basis: 'The register says it "does not establish that the required quorum can be reached in time"; Decide is the time to obtain that quorum.' },
  { id: 'E-12', stage: null, basis: 'It concerns halt authority (control C-04). The sample does not tie it to a single stage.' },
  { id: 'E-06', stage: null, basis: 'It concerns the audit trail (control C-06), not a stage timing.' },
];

export const ILLUSTRATIVE_CONCLUSION = {
  state: 'After impact',
  lead: 'Authority, not detection.',
  body: 'The required route to an authorised intervention cannot complete within the assumed six-hour window. Faster detection cannot by itself resolve that constraint.',
};

export const SAMPLE_SCOPE = ['CRED-MOD-04', 'Retail credit decisioning', 'Auto-decline pathway', 'Macro shock with model drift'];
