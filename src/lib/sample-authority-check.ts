/**
 * A constructed sample of the Authority Check's one-page finding.
 *
 * It reads the same constructed retail-credit scenario as the sample verdict
 * (src/lib/sample-report.ts) and answers only the Authority Check's four
 * questions about it. Everything is illustrative: no client data, no real
 * organisation, not issued. It is not an AGDA® verdict, SEDI result or score.
 *
 * Each answer separates three things: what the scenario's records document,
 * what they do not evidence, and the conclusion drawn. Every statement
 * restates the scenario's own controls, stages and evidence register, so
 * this page cannot say more than the sample verdict does. In particular the
 * scenario contains no live call-out, so none is reported here.
 */
import { controls, evidence } from './sample-report';

const control = (code: string) => controls.find((c) => c.code === code)!;
const record = (id: string) => evidence.find((e) => e.id === id)!;
const controlRef = (code: string) => `${code}, ${control(code).name.charAt(0).toLowerCase()}${control(code).name.slice(1)}`;
const recordRef = (id: string) => `${id}, ${record(id).type.toLowerCase()}`;

export const CHECK_SAMPLE_SYSTEM = 'CRED-MOD-04 · Retail Credit Decisioning';

/** The finding, in one line and one sentence. */
export const CHECK_SAMPLE_FINDING = {
  lead: 'Retail credit:',
  tail: 'intervention authority is not demonstrably established.',
  body: 'A charter names who holds authority to halt. The records in the scenario do not show that the authority can be used: no named approver may act alone, the quorum they need has no out-of-cycle route, and no on-call rota is documented.',
};

/** The Authority Check's four questions, answered from the scenario. */
export const checkAnswers = [
  {
    q: 'Who may halt it, and under which delegation',
    documented: 'The MRC charter names halt authority, and the halt authority control records three named approvers.',
    missing: 'That the required quorum can be reached in time.',
    conclusion: 'Authority is allocated on paper. Its availability is not established.',
    basis: `${recordRef('E-08')}; ${controlRef('C-04')}.`,
  },
  {
    q: 'Whether they can decide alone or need a quorum',
    documented: 'None of the three is authorised to halt alone. A quorum is required, and the escalation pathway ends at a forum that meets monthly.',
    missing: 'Any out-of-cycle route to a quorum.',
    conclusion: 'On these records, a decision to halt waits for the forum.',
    basis: `${controlRef('C-04')}; ${controlRef('C-03')}.`,
  },
  {
    q: 'How they are reached out of hours',
    documented: 'The halt authority control records no on-call rota and a weekend gap. An interview stated that on-call halt authority exists.',
    missing: 'Any document supporting the interview statement.',
    conclusion: 'The evidence does not establish that an authorised person can be reached outside normal operating hours.',
    basis: `${controlRef('C-04')}; ${recordRef('E-12')}.`,
  },
  {
    q: 'Where the halt takes effect',
    documented: 'A halt is propagated to the system by instruction. The auto-decline path has no manual override, by design, and decisions already made are reprocessed the next day.',
    missing: 'How long a halt takes to propagate. The source assumes about six minutes; no duration was assessed.',
    conclusion: 'A halt takes effect only once instructed, and it does not reverse decisions already made.',
    basis: `${controlRef('C-05')}.`,
  },
];

export const checkGaps = [
  'No named approver may halt the system alone.',
  'The required quorum has no out-of-cycle route; the forum meets monthly.',
  'No on-call rota is documented, and the scenario records a weekend gap.',
  'The statement that on-call halt authority exists is verbal only.',
  'No manual override on the auto-decline path.',
];

/**
 * Out-of-hours reach. The first two sentences are the approved wording. The
 * note keeps the illustration from implying a call-out was run: an actual
 * Authority Check tests reach once, and this scenario holds no such test.
 */
export const CHECK_OUT_OF_HOURS = {
  finding: 'The scenario identifies no documented on-call rota or reliable weekend escalation arrangement.',
  conclusion: 'The available evidence does not establish that an authorised individual could be reached and an intervention executed outside normal operating hours.',
  note: 'An Authority Check tests out-of-hours reach once, with a live call-out. This constructed illustration contains no call-out and reports no result from one.',
};
