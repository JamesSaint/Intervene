/**
 * Intervention Readiness Snapshot: question set.
 *
 * This file is the single source of truth for question ids, option
 * values and labels. `scripts/generate-question-manifest.mjs` derives
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
 *    never derived from array position, so options may be reordered
 *    or relabelled without changing meaning. Changing a `value`, or
 *    adding or removing a question or option, requires a
 *    QUESTION_SET_VERSION bump and the release order in the plan:
 *    deploy the Worker with the new manifest first, then the site.
 */

export const QUESTION_SET_VERSION = 'qs-1.0';

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
  screen: 1 | 2 | 3 | 4 | 5 | 6;
  area: SnapshotArea;
  legend: string;
  helper?: string;
  options: SnapshotOption[];
}

export interface SnapshotScreen {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  helper?: string;
}

export const screens: SnapshotScreen[] = [
  {
    index: 1,
    title: 'Operating context',
    helper:
      'Five quick questions to place your answers in context. None of this identifies you or your organisation.',
  },
  { index: 2, title: 'Detect', helper: 'Whether the organisation would know.' },
  { index: 3, title: 'Escalate', helper: 'Whether the signal reaches someone who can act.' },
  { index: 4, title: 'Decide', helper: 'Whether someone can authorise the action.' },
  { index: 5, title: 'Intervene', helper: 'Whether the action would actually work.' },
  {
    index: 6,
    title: 'Basis of confidence',
    helper: 'One question. It changes how the rest should be read.',
  },
];

export const questions: SnapshotQuestion[] = [
  {
    id: 'q01_sector',
    screen: 1,
    area: 'context',
    legend: 'In which sector does the organisation operate?',
    options: [
      { value: 'banking', label: 'Banking and capital markets' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'other_finserv', label: 'Other financial services' },
      { value: 'health', label: 'Healthcare and life sciences' },
      { value: 'cni', label: 'Critical national infrastructure' },
      { value: 'public', label: 'Public sector' },
      { value: 'tech_telecoms', label: 'Technology and telecoms' },
      { value: 'prof_services', label: 'Professional services' },
      { value: 'retail', label: 'Retail and consumer' },
      { value: 'industrials', label: 'Manufacturing and industrials' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'q02_size',
    screen: 1,
    area: 'context',
    legend: 'Roughly how many people does the organisation employ?',
    options: [
      { value: 'lt_250', label: 'Fewer than 250' },
      { value: '250_999', label: '250 to 999' },
      { value: '1k_4999', label: '1,000 to 4,999' },
      { value: '5k_19999', label: '5,000 to 19,999' },
      { value: '20k_plus', label: '20,000 or more' },
    ],
  },
  {
    id: 'q03_role',
    screen: 1,
    area: 'context',
    legend: 'Which best describes your role?',
    options: [
      { value: 'board', label: 'Board or committee member' },
      { value: 'exec', label: 'Executive leadership (CRO, CISO, CTO, CAIO, CDO)' },
      {
        value: 'function_head',
        label: 'Function head (risk, resilience, model risk, AI governance, security)',
      },
      { value: 'internal_audit', label: 'Internal audit' },
      { value: 'practitioner', label: 'Practitioner or specialist' },
      { value: 'adviser', label: 'Adviser or assurance provider' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'q04_systems',
    screen: 1,
    area: 'context',
    legend:
      'How many AI or automated decision systems are in production and materially affecting outcomes?',
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
    id: 'q05_criticality',
    screen: 1,
    area: 'context',
    legend:
      'If the most consequential of those systems behaved unexpectedly for a full working day, what would the effect be?',
    options: [
      { value: 'contained', label: 'Contained. Internal inconvenience, no external effect' },
      {
        value: 'noticeable',
        label: 'Noticeable. Customers or operations affected, recoverable',
      },
      { value: 'serious', label: 'Serious. Material financial, safety or service harm' },
      { value: 'severe', label: 'Severe. Harm that could not be undone' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q06_detect_signal',
    screen: 2,
    area: 'detect',
    legend: 'If that system began behaving abnormally right now, how would you find out?',
    options: [
      {
        value: 'automated_named_team',
        label: 'Automated monitoring would alert a named team within minutes',
      },
      {
        value: 'monitoring_passive',
        label: 'Monitoring exists, but someone would need to be looking',
      },
      {
        value: 'downstream_report',
        label: 'A downstream process or report would surface it within a day or so',
      },
      { value: 'external_party', label: 'A customer, regulator or third party would tell us' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q07_detect_measured',
    screen: 2,
    area: 'detect',
    legend:
      'Has the time between a system going wrong and someone noticing ever been measured?',
    options: [
      {
        value: 'measured_recent',
        label: 'Yes, measured and evidenced in the last twelve months',
      },
      { value: 'measured_historic', label: 'Measured at some point, not recently' },
      { value: 'estimated', label: 'We have an estimate, not a measurement' },
      { value: 'never', label: 'No' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q08_escalate_outofhours',
    screen: 3,
    area: 'escalate',
    legend: 'At 2am on a Sunday, who does that alert reach?',
    options: [
      {
        value: 'staffed_rota_path',
        label: 'A staffed rota with a defined onward path to an authorised decision maker',
      },
      {
        value: 'oncall_needs_senior',
        label: 'An on-call engineer who would need to find someone more senior',
      },
      {
        value: 'single_named_person',
        label: 'A named individual, and the path depends on them being reachable',
      },
      { value: 'inbox_next_day', label: 'An inbox seen the next working day' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q09_escalate_dependency',
    screen: 3,
    area: 'escalate',
    legend: 'Does the escalation path depend on any single person being available?',
    options: [
      { value: 'tested_alternates', label: 'No, every step has a tested alternate' },
      {
        value: 'named_untested_alternates',
        label: 'Alternates are named, but have not been exercised',
      },
      { value: 'single_point', label: 'Yes, at least one step has no alternate' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q10_decide_authority',
    screen: 4,
    area: 'decide',
    legend:
      'Who can authorise stopping or restricting that system, without seeking further approval?',
    options: [
      {
        value: 'documented_standing',
        label: 'A named role with written standing authority, available at all times',
      },
      {
        value: 'implied_authority',
        label: 'A named role, but the authority is implied rather than documented',
      },
      {
        value: 'requires_convening',
        label: 'It would require a committee, an executive convening, or legal sign-off',
      },
      { value: 'nobody', label: 'Nobody has that authority' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q11_decide_exercised',
    screen: 4,
    area: 'decide',
    legend:
      'Has anyone actually exercised that authority, in a live event or a realistic exercise?',
    options: [
      {
        value: 'live_or_simulation_recent',
        label: 'Yes, in a live event or a full simulation within the last twelve months',
      },
      { value: 'historic_or_tabletop', label: 'Yes, at some point, or in a tabletop exercise' },
      { value: 'documented_never_used', label: 'It has been documented but never exercised' },
      { value: 'never', label: 'No' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q12_decide_conflict',
    screen: 4,
    area: 'decide',
    legend:
      'If stopping the system caused significant commercial or operational harm, whose decision is it?',
    options: [
      { value: 'assigned_written', label: 'Clearly assigned in advance, in writing' },
      { value: 'assigned_contested', label: 'Assigned in principle, contested in practice' },
      { value: 'resolved_in_moment', label: 'It would be resolved in the moment' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q13_intervene_capability',
    screen: 5,
    area: 'intervene',
    legend: 'What can you actually do to that system, today, without a code release?',
    options: [
      { value: 'full_range', label: 'Stop, isolate, restrict and reverse, all available' },
      { value: 'stop_no_reverse', label: 'Stop and isolate, but not reverse the effects' },
      { value: 'throttle_only', label: 'Restrict or throttle only' },
      { value: 'requires_release_or_vendor', label: 'Nothing without a release or a vendor' },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q14_intervene_tested',
    screen: 5,
    area: 'intervene',
    legend:
      'Has that intervention been technically tested in production or a production-equivalent environment?',
    options: [
      {
        value: 'tested_recent_recorded',
        label: 'Yes, within the last twelve months, with the result recorded',
      },
      { value: 'tested_historic', label: 'Yes, at some point' },
      { value: 'lower_environment_only', label: 'Tested in a lower environment only' },
      {
        value: 'design_or_vendor_assurance',
        label: 'No, we rely on design or vendor assurance',
      },
      { value: 'not_known', label: 'Not known' },
    ],
  },
  {
    id: 'q15_confidence_basis',
    screen: 6,
    area: 'confidence',
    legend: 'Taking your answers as a whole, what are they based on?',
    helper:
      'Be exact rather than optimistic. The basis of confidence determines how the rest of your answers should be interpreted.',
    options: [
      { value: 'tested', label: 'Tested. Exercised under realistic conditions, with evidence retained' },
      { value: 'documented', label: 'Documented. Written down, not realistically tested' },
      { value: 'assumed', label: 'Assumed. Based on policy, design intent or vendor assurance' },
      { value: 'unknown', label: 'Unknown. Honestly, I am not certain' },
    ],
  },
];

/** Questions that offer a `not_known` option. Q1, Q2, Q3 and Q15 do not. */
export const questionsWithNotKnown = questions
  .filter((q) => q.options.some((o) => o.value === 'not_known'))
  .map((q) => q.id);

export const questionsByScreen = (screen: number) =>
  questions.filter((q) => q.screen === screen);

export const totalQuestions = questions.length;
