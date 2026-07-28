/**
 * PHASE 1 ONLY. DELETE IN PHASE 2.
 *
 * The static prototype needs a result to render so the copy and design
 * can be reviewed before any backend exists. Selection is by explicit
 * query parameter, never computed from the answers, and must not be
 * extended to do so.
 *
 * What this file must never contain: ordinal values, area values,
 * thresholds, bands, or any logic that picks a result from what the
 * visitor said.
 *
 * copy-2.0 cut this from roughly 1,650 words to under 900.
 *
 * The largest single saving was deleting "One hypothesis worth testing
 * is that" from the front of all sixteen hypotheses. The section is
 * already labelled, so the framing was throat-clearing repeated
 * sixteen times. The rest went by asking of every sentence whether it
 * creates curiosity, builds trust, or moves the reader forward.
 *
 * copy-3.0 restored two things copy-2.0 cut too far: the eight
 * headlines that had started asserting capability rather than
 * restating it, and the sentence naming the area the visitor described
 * most confidently. The second buys the permission to deliver the
 * first, which is why it is worth one line.
 */

export type Area = 'detect' | 'escalate' | 'decide' | 'intervene';
export type ConfidenceBasis = 'tested' | 'documented' | 'assumed' | 'unknown';

export const AREAS: Area[] = ['detect', 'escalate', 'decide', 'intervene'];
export const BASES: ConfidenceBasis[] = ['tested', 'documented', 'assumed', 'unknown'];

export const RESPONSE_MODEL_VERSION = 'snapshot-response-model-v1.0';
export const COPY_VERSION = 'copy-3.0';

export const areaNoun: Record<Area, string> = {
  detect: 'detection',
  escalate: 'escalation',
  decide: 'decision authority',
  intervene: 'intervention',
};

/**
 * Restates what the visitor described. Deliberately not rankable.
 *
 * Every headline opens with "You describe", "You expect" or "You are
 * not certain", so the visitor is always the grammatical subject and
 * the source of the claim. copy-2.0 briefly broke this: eight headlines
 * read "Someone can stop it, on paper" and similar, which states a fact
 * about the organisation and hedges only its evidential basis. A page
 * that asserts capability is making an assessment, which is the one
 * thing this instrument must never do.
 *
 * A test enforces the opener. Do not add a headline that fails it.
 */
const headlines: Record<Area, Record<ConfidenceBasis, string>> = {
  detect: {
    tested: 'You describe detection you have measured.',
    documented: 'You describe detection you have not measured.',
    assumed: 'You expect you would know quickly.',
    unknown: 'You are not certain you would know.',
  },
  escalate: {
    tested: 'You describe an escalation path you have exercised.',
    documented: 'You describe an escalation path you have not exercised.',
    assumed: 'You expect the alert reaches someone who can act.',
    unknown: 'You are not certain where the alert lands.',
  },
  decide: {
    tested: 'You describe halt authority that has been used.',
    documented: 'You describe halt authority that has never been used.',
    assumed: 'You expect someone can stop it.',
    unknown: 'You are not certain who can stop it.',
  },
  intervene: {
    tested: 'You describe intervention you have tested in production.',
    documented: 'You describe intervention you have not tested.',
    assumed: 'You expect you can act on the system.',
    unknown: 'You are not certain what you could do to it.',
  },
};

const hypotheses: Record<Area, Record<ConfidenceBasis, string>> = {
  detect: {
    tested:
      'You have timed detection. That timing was almost certainly taken on an ordinary day. How long the same signal takes to surface while three other things are going wrong is a different number, and nobody has it.',
    documented:
      'You described monitoring, then said the interval between a system going wrong and someone noticing has not been measured recently. The number you would give a regulator is an estimate wearing the clothes of a control.',
    assumed:
      'You are relying on monitoring you have not measured. If the alerting changes on the vendor side, the first sign will be an incident that surfaced later than you expected.',
    unknown:
      'Nobody currently owns the question of how quickly this system would be seen to misbehave. That is answerable in an afternoon, and until someone answers it the rest is guesswork.',
  },
  escalate: {
    tested:
      'The path has been exercised. Whether it holds on a bank holiday, during a change freeze, or when the primary contact is on a flight is a separate question from whether it works.',
    documented:
      'You described a route to someone who can act, then said the alternates have never been exercised. A path that has only been drawn is a hypothesis about human availability.',
    assumed:
      'The question is not whether policy names someone. It is whether the second and third names on that list have ever been called at 2am.',
    unknown:
      'You do not know where a Sunday night alert lands. Raise one, without warning the rota, and record where it goes. One test, one afternoon.',
  },
  decide: {
    tested:
      'The authority has been used, in conditions everyone knew were an exercise. What that does not establish is whether the same person commits when stopping costs real money and a colleague with a revenue target is arguing the other way.',
    documented:
      'You named a role with the authority to act, and said it has never been used. Whether that authority holds at 2am, against commercial pressure, is not established by the fact that it is written down.',
    assumed:
      'Where authority is understood rather than written, an intervention stalls without anyone refusing it. It stalls in the time each person takes to confirm it is not their call.',
    unknown:
      'If it is not immediately obvious to you who can stop this system, it will not be obvious to whoever is on duty when it matters.',
  },
  intervene: {
    tested:
      'You have stopped it on purpose and recorded the result. Whether the same action completes while the system is saturated, or when the rollback itself causes harm, has not been established.',
    documented:
      'You described what you could do, then said it has never been done in production. What exists is a runbook and an intention, not evidence that the action completes in time.',
    assumed:
      'The ability to stop this system belongs to a vendor. The number that matters is the gap between raising a ticket and the system actually stopping, and whether that fits the window you have.',
    unknown:
      'Nobody has established what can be done to this system without a code release. That answer sets the ceiling on everything else you could do in an incident.',
  },
};

const confidenceCommentary: Record<ConfidenceBasis, string> = {
  tested:
    'Exercised, with evidence kept. That is the strongest footing a self-report can have, and it is still a self-report.',
  documented:
    'Documentation establishes intent and ownership. It does not establish timing, and timing decides whether intervention completes.',
  assumed: 'That describes what should happen. It does not establish what does.',
  unknown:
    'More useful than an optimistic guess, and the one finding here you can resolve without involving anyone else.',
};

const boardQuestions: Record<Area, string> = {
  detect: 'How long would this run wrong before we knew, and when did we last measure that rather than estimate it?',
  escalate: 'If this happened at 2am on a Sunday, who gets woken, and who is the second name?',
  decide: 'Who can stop this without asking anyone, and when did they last do it?',
  intervene: 'When did we last stop this on purpose, and what did it cost us to find out?',
};

const practicalTests: Record<Area, string> = {
  detect:
    'Take your last three incidents. For each, find the timestamp of the first abnormal behaviour and the timestamp of the first human acknowledgement. That gap is your real detection time. Compare it to the number you would have quoted.',
  escalate:
    'Pick a Sunday. Have someone raise a genuine priority alert without warning the rota. Record who it reached, how long until an authorised decision maker was on it, and whether anyone was reached at all.',
  decide:
    'Ask three people independently, in writing, who can authorise stopping this without further approval. Do not prompt them. Three different answers is the finding.',
  intervene:
    'Book a window. Stop it on purpose, in production or something equivalent, and time it from decision to effect. Record what broke that you did not expect.',
};

export const contrastBlock = [
  'Everything above is your own answer. Nothing here has been checked.',
  'AGDA™ collects the evidence instead of accepting the claim, tests each claim against it, and returns the same verdict whoever runs it. This asks whether intervention might work. AGDA™ establishes what the evidence actually shows.',
];

export const disclaimer =
  'Indicative only, from ten self-reported answers. Not an AGDA™ assessment, an assurance opinion or a certification. Nothing you entered has been tested against evidence.';

export interface PrototypeResult {
  leastConfidentArea: Area;
  mostConfidentArea: Area;
  mostConfidentText: string;
  confidenceBasis: ConfidenceBasis;
  headline: string;
  priorityHypothesis: string;
  confidenceCommentary: string;
  boardQuestion: string;
  practicalTest: string;
  contrastBlock: string[];
  disclaimer: string;
  responseModelVersion: string;
  copyVersion: string;
}

function isArea(value: string): value is Area {
  return (AREAS as string[]).includes(value);
}

function isBasis(value: string): value is ConfidenceBasis {
  return (BASES as string[]).includes(value);
}

/**
 * Resolves a preview result from an explicit `?preview=area-basis`
 * parameter, for example `?preview=decide-documented`. Anything
 * unrecognised falls back to the review default.
 *
 * This reads a query parameter. It does not read the visitor's answers.
 */
export function resolvePrototypeResult(preview: string | null): PrototypeResult {
  let area: Area = 'decide';
  let basis: ConfidenceBasis = 'documented';

  if (preview) {
    const [rawArea, rawBasis] = preview.split('-');
    if (rawArea && isArea(rawArea)) area = rawArea;
    if (rawBasis && isBasis(rawBasis)) basis = rawBasis;
  }

  // Restored in copy-3.0. Naming one area the visitor described with
  // more confidence, before naming the one they described with least,
  // is what makes the result read as fair rather than as an attack.
  // It reports their confidence, not their capability, so it is not
  // praise and not a score.
  const mostConfidentArea = AREAS[(AREAS.indexOf(area) + 2) % AREAS.length];

  return {
    leastConfidentArea: area,
    mostConfidentArea,
    mostConfidentText: `You were most confident about ${areaNoun[mostConfidentArea]}.`,
    confidenceBasis: basis,
    headline: headlines[area][basis],
    priorityHypothesis: hypotheses[area][basis],
    confidenceCommentary: confidenceCommentary[basis],
    boardQuestion: boardQuestions[area],
    practicalTest: practicalTests[area],
    contrastBlock,
    disclaimer,
    responseModelVersion: RESPONSE_MODEL_VERSION,
    copyVersion: COPY_VERSION,
  };
}

/** Every `?preview=` value, for the review checklist and tests. */
export const allPreviewKeys = AREAS.flatMap((a) => BASES.map((b) => `${a}-${b}`));
