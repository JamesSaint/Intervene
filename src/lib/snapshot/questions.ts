/**
 * Intervention Readiness Snapshot: question set.
 *
 * Single source of truth for question ids, option values and labels.
 * `scripts/generate-question-manifest.mjs` derives
 * `public/question-manifest.json` from it, and the Worker validates
 * incoming answers against that manifest.
 *
 * Two rules govern this file.
 *
 * 1. It must never contain ordinal values, thresholds, bands or any
 *    part of the Snapshot Response Model. Those live only in the
 *    private Worker repository. Anything here is public.
 *
 * 2. Option `value` identifiers are semantic and stable. Ordering is
 *    never derived from array position, so options may be reordered or
 *    relabelled without changing meaning. Changing a `value`, or adding
 *    or removing a question, requires a QUESTION_SET_VERSION bump and
 *    the staged release order in the plan.
 *
 * qs-2.0 reduced the set from fifteen questions to nine. qs-3.0
 * restored the decision-conflict question, bringing it to ten.
 *
 * Sector and organisation size were removed. Neither creates curiosity,
 * builds trust or moves the visitor forward; they were a toll charged
 * before any value was delivered. They are collected later, from people
 * who have chosen to engage. Role was removed because the follow-up
 * form already asks for it.
 *
 * What remains is the seven questions that produce the realisation the
 * page exists for, plus two that establish the stakes and one that
 * forces the reckoning.
 *
 * Decide carries three questions rather than two. Authority, then
 * whether it has ever been used, then whose call it is when using it
 * costs money. That third question is where halt authority stops being
 * an abstraction, so it sits last in the sequence.
 */

export const QUESTION_SET_VERSION = 'qs-3.0';

export type SnapshotArea =
  | 'context'
  | 'detect'
  | 'escalate'
  | 'decide'
  | 'intervene'
  | 'confidence';

export interface SnapshotOption {
  value: string;
  label: string;
}

export interface SnapshotQuestion {
  id: string;
  screen: 1 | 2 | 3 | 4 | 5;
  area: SnapshotArea;
  legend: string;
  helper?: string;
  options: SnapshotOption[];
}

export interface SnapshotScreen {
  index: 1 | 2 | 3 | 4 | 5;
  label: string;
  heading: string;
}

/**
 * Screen headings are questions, not explanations. They orient without
 * describing what the page is doing, and they double as the focus
 * target on each transition.
 */
export const screens: SnapshotScreen[] = [
  { index: 1, label: 'The system', heading: 'Start with one system.' },
  { index: 2, label: 'Detect · Escalate', heading: 'Would you know, and would it reach anyone?' },
  { index: 3, label: 'Decide', heading: 'Could anyone authorise it?' },
  { index: 4, label: 'Intervene', heading: 'Would the action work?' },
  { index: 5, label: 'Confidence', heading: 'One last question.' },
];

export const questions: SnapshotQuestion[] = [
  {
    id: 'q01_systems',
    screen: 1,
    area: 'context',
    legend: 'How many systems make decisions in production without a human approving each one?',
    options: [
      { value: 'none', label: 'None yet' },
      { value: '1_3', label: 'One to three' },
      { value: '4_10', label: 'Four to ten' },
      { value: '11_50', label: 'Eleven to fifty' },
      { value: '50_plus', label: 'More than fifty' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q02_criticality',
    screen: 1,
    area: 'context',
    legend: 'If the most consequential one ran wrong for a day, what would that cost you?',
    options: [
      { value: 'contained', label: 'Awkward internally. Nobody outside notices' },
      { value: 'noticeable', label: 'Customers feel it. Recoverable' },
      { value: 'serious', label: 'Material financial, safety or service harm' },
      { value: 'severe', label: 'Harm that could not be undone' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q03_detect',
    screen: 2,
    area: 'detect',
    legend: 'If it started behaving badly right now, how would you find out?',
    options: [
      { value: 'automated_named_team', label: 'Monitoring alerts a named team within minutes' },
      { value: 'monitoring_passive', label: 'Monitoring exists, if someone is looking' },
      { value: 'downstream_report', label: 'A downstream report, within a day or so' },
      { value: 'external_party', label: 'A customer, a regulator, or the press' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q04_escalate',
    screen: 2,
    area: 'escalate',
    legend: 'At 2am on a Sunday, who does that alert reach?',
    options: [
      { value: 'staffed_rota_path', label: 'A staffed rota, with a route to someone who can act' },
      { value: 'oncall_needs_senior', label: 'An engineer who would have to find someone senior' },
      { value: 'single_named_person', label: 'One person, if they answer' },
      { value: 'inbox_next_day', label: 'An inbox. Monday' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q05_authority',
    screen: 3,
    area: 'decide',
    legend: 'Who can stop it without asking anyone?',
    options: [
      { value: 'documented_standing', label: 'A named role, in writing, available at all times' },
      { value: 'implied_authority', label: 'A named role, but it is understood rather than written' },
      { value: 'requires_convening', label: 'A committee, an executive, or legal' },
      { value: 'nobody', label: 'Nobody' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q06_exercised',
    screen: 3,
    area: 'decide',
    legend: 'When did they last do it?',
    options: [
      { value: 'live_or_simulation_recent', label: 'Within the last year, live or in a full simulation' },
      { value: 'historic_or_tabletop', label: 'At some point, or in a tabletop exercise' },
      { value: 'never', label: 'Never' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q07_conflict',
    screen: 3,
    area: 'decide',
    legend: 'If stopping it caused significant commercial or operational harm, whose decision is it?',
    options: [
      { value: 'assigned_written', label: 'Assigned in advance, in writing' },
      { value: 'assigned_contested', label: 'Assigned in principle, contested in practice' },
      { value: 'resolved_in_moment', label: 'It would be resolved in the moment' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q08_capability',
    screen: 4,
    area: 'intervene',
    legend: 'What can you actually do to it today, without a code release?',
    options: [
      { value: 'full_range', label: 'Stop, isolate, restrict and reverse' },
      { value: 'stop_no_reverse', label: 'Stop and isolate, but not undo the effects' },
      { value: 'throttle_only', label: 'Throttle or restrict' },
      { value: 'requires_release_or_vendor', label: 'Nothing without a release or a vendor' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q09_tested',
    screen: 4,
    area: 'intervene',
    legend: 'When did you last do that on purpose, in production?',
    options: [
      { value: 'tested_recent_recorded', label: 'Within the last year, and we recorded the result' },
      { value: 'tested_historic', label: 'At some point' },
      { value: 'lower_environment_only', label: 'Only in a lower environment' },
      { value: 'design_or_vendor_assurance', label: 'Never. We rely on design or vendor assurance' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q10_confidence',
    screen: 5,
    area: 'confidence',
    legend: 'Taking all of that together, what is it based on?',
    options: [
      { value: 'tested', label: 'Tested under realistic conditions, with evidence kept' },
      { value: 'documented', label: 'Written down, not realistically tested' },
      { value: 'assumed', label: 'Policy, design intent or vendor assurance' },
      { value: 'unknown', label: 'Honestly, I am not certain' },
    ],
  },
];

/** Questions that offer a `not_known` option. The confidence question does not. */
export const questionsWithNotKnown = questions
  .filter((q) => q.options.some((o) => o.value === 'not_known'))
  .map((q) => q.id);

export const questionsByScreen = (screen: number) =>
  questions.filter((q) => q.screen === screen);

export const totalQuestions = questions.length;
