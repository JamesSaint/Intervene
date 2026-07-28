/**
 * PHASE 1 ONLY. DELETE IN PHASE 2.
 *
 * The static prototype needs a result to render so the copy and design
 * can be reviewed before any backend exists. This file holds that copy
 * and a `?preview=` selector for reaching all sixteen combinations.
 *
 * What this file must never contain, in this phase or any other:
 *   - ordinal values for any answer
 *   - area values, thresholds, bands or tie-breaking rules
 *   - any logic that selects a result from a visitor's answers
 *
 * Selection here is by explicit query parameter, never computed from
 * the answers. In Phase 2 the Worker returns the result and this file
 * is deleted along with `resolvePrototypeResult`.
 *
 * The copy itself is visitor-facing and therefore not confidential. It
 * moves to the private Worker repository in Phase 2 so that the copy
 * and the selection logic stay together.
 */

export type Area = 'detect' | 'escalate' | 'decide' | 'intervene';
export type ConfidenceBasis = 'tested' | 'documented' | 'assumed' | 'unknown';

export const AREAS: Area[] = ['detect', 'escalate', 'decide', 'intervene'];
export const BASES: ConfidenceBasis[] = ['tested', 'documented', 'assumed', 'unknown'];

export const RESPONSE_MODEL_VERSION = 'snapshot-response-model-v1.0';
export const COPY_VERSION = 'copy-1.0';

export const areaNoun: Record<Area, string> = {
  detect: 'detection',
  escalate: 'escalation',
  decide: 'decision authority',
  intervene: 'intervention',
};

/** Restates what the visitor described. Deliberately not rankable. */
const headlines: Record<Area, Record<ConfidenceBasis, string>> = {
  detect: {
    tested: 'Your answers describe detection that has been measured and evidenced.',
    documented:
      'Your answers describe detection that is written down but has not been measured.',
    assumed:
      'Your answers describe detection that rests on design intent rather than measurement.',
    unknown: 'Your answers describe detection you are not certain about.',
  },
  escalate: {
    tested: 'Your answers describe an escalation path that has been exercised.',
    documented:
      'Your answers describe an escalation path that is written down but has not been exercised.',
    assumed:
      'Your answers describe an escalation path that rests on policy rather than practice.',
    unknown: 'Your answers describe an escalation path you are not certain about.',
  },
  decide: {
    tested:
      'Your answers describe halt authority that has been exercised under realistic conditions.',
    documented:
      'Your answers describe halt authority that is written down but has not been exercised.',
    assumed: 'Your answers describe halt authority that rests on policy rather than practice.',
    unknown: 'Your answers describe halt authority you are not certain about.',
  },
  intervene: {
    tested: 'Your answers describe intervention that has been tested in production.',
    documented:
      'Your answers describe intervention that is documented but has not been tested.',
    assumed:
      'Your answers describe intervention that rests on vendor or design assurance rather than testing.',
    unknown: 'Your answers describe intervention you are not certain about.',
  },
};

const hypotheses: Record<Area, Record<ConfidenceBasis, string>> = {
  detect: {
    tested:
      'One hypothesis worth testing is that detection is measured under conditions that resemble a normal day rather than a bad one. You have described monitoring that has been timed. What a measurement taken during ordinary operation does not establish is how long the same signal takes to surface when several things are going wrong at once.',
    documented:
      'One hypothesis worth testing is that the detection time you would quote to a regulator has never been observed. You have described monitoring that exists and is written down. You have also indicated the interval between a system going wrong and someone noticing has not been measured recently. Until it is timed, that interval is an estimate presented as a control.',
    assumed:
      'One hypothesis worth testing is that detection is inherited from a vendor rather than owned. You have described monitoring you rely on but have not measured. If the alerting behaviour changes on the vendor side, the first indication would be an incident that took longer to surface than expected.',
    unknown:
      'One hypothesis worth testing is that nobody currently owns the question of how quickly this system would be seen to misbehave. You have indicated you are not certain how detection works today. That uncertainty is itself the finding, and it is answerable in an afternoon.',
  },
  escalate: {
    tested:
      'One hypothesis worth testing is that the escalation path holds on a weekday and thins at the edges. You have described a path that has been exercised. Whether the alternates hold on a bank holiday, during a change freeze, or when the primary contact is on a flight is a different question from whether the path works.',
    documented:
      'One hypothesis worth testing is that the escalation path exists on a diagram and has never been walked. You have described a defined route to an authorised decision maker. You have also indicated the alternates have not been exercised. A path that has only been drawn is a hypothesis about human availability, not a control.',
    assumed:
      'One hypothesis worth testing is that escalation depends on one person answering their phone. You have described a route that rests on policy rather than practice. The question is not whether the policy names someone. It is whether the second and third names on that list have ever been called.',
    unknown:
      'One hypothesis worth testing is that no one has established who a 2am alert actually reaches. You have indicated you are not certain. That is answerable without a project: raise one alert out of hours and record where it lands.',
  },
  decide: {
    tested:
      'One hypothesis worth testing is that halt authority has been exercised under conditions that were known to be an exercise. You have described authority that has been used. What a planned simulation does not establish is whether the same person commits when the cost of stopping is real, contested, and being argued against by a colleague with a revenue target.',
    documented:
      'One hypothesis worth testing is that halt authority exists on paper but has never been exercised. You have described a named role with the authority to act. You have also indicated it has not been used in a live event or a full simulation. Whether that authority holds under commercial pressure at 2am is not established by the fact that it is written down.',
    assumed:
      'One hypothesis worth testing is that the authority to stop this system is assumed by several people and held by none. You have described authority that rests on policy rather than practice. Where authority is implied rather than documented, an intervention can stall without anyone refusing it, in the time it takes for each person to confirm it is not their call.',
    unknown:
      'One hypothesis worth testing is that the organisation does not currently know who can stop this system without asking permission. You have indicated you are not certain. If the answer is not immediately obvious to you, it will not be obvious to whoever is on duty when it matters.',
  },
  intervene: {
    tested:
      'One hypothesis worth testing is that intervention has been tested in isolation rather than under load. You have described a capability that has been exercised and recorded. Whether the same action completes when the system is saturated, when a dependency is degraded, or when the rollback itself causes harm is a separate question.',
    documented:
      'One hypothesis worth testing is that the ability to stop this system has been designed but never demonstrated. You have described intervention capability that is documented. Until it has been executed against production or a production-equivalent environment, what exists is a design intent and a runbook, not evidence that the action completes in time.',
    assumed:
      'One hypothesis worth testing is that the ability to stop this system belongs to a vendor. You have described intervention that rests on assurance rather than testing. The practical question is what happens between raising a support ticket and the system actually stopping, and whether that interval fits inside the window you have.',
    unknown:
      'One hypothesis worth testing is that nobody has established what can actually be done to this system without a code release. You have indicated you are not certain. That is the single cheapest thing on this page to find out, and the answer sets the ceiling on everything else you could do in an incident.',
  },
};

const confidenceCommentary: Record<ConfidenceBasis, string> = {
  tested:
    'Your answers rest on capability that has been exercised under realistic conditions, with evidence retained. That is the strongest basis a self-report can have. It is still a self-report: independent evidence would be needed to determine whether the retained evidence supports the claim.',
  documented:
    'Your answers rest on capability that is written down but has not been realistically tested. Documentation establishes intent and ownership. It does not establish timing, and timing is what decides whether intervention completes before the window closes.',
  assumed:
    'Your answers rest on policy, design intent or vendor assurance rather than realistic testing. That describes what should happen. Independent evidence would be needed to determine what does.',
  unknown:
    'Your answers indicate you are not certain what the current position is. That is a more useful answer than an optimistic guess, and it is the one finding on this page that can be resolved without anyone else being involved.',
};

const boardQuestions: Record<Area, string> = {
  detect:
    'How long would this system run wrong before we knew, and when did we last measure that rather than estimate it?',
  escalate:
    'If this happened at 2am on a Sunday, who would be woken, and who is the second name if the first does not answer?',
  decide:
    'Who can stop this system without asking anyone, and when did they last do it?',
  intervene:
    'When did we last stop this system on purpose, and what did it cost us to find out?',
};

const practicalTests: Record<Area, string> = {
  detect:
    'Take the last three incidents on any system, not necessarily this one. For each, find the timestamp of the first abnormal behaviour and the timestamp of the first human acknowledgement. The gap between them is your real detection time. Compare it to the number you would have quoted.',
  escalate:
    'Pick a Sunday. Have someone raise a genuine priority alert on that system without warning the rota. Record who received it, how long until an authorised decision maker was reached, and whether anyone was reached at all. That is the honest state of your escalation path.',
  decide:
    'Ask three people independently, in writing, who can authorise stopping this system without further approval. Do not prompt them. If you receive three different answers, or three answers that each name a different committee, you have found the gap.',
  intervene:
    'Book a window. Stop the system on purpose, in production or a production-equivalent environment, and time it from decision to effect. Record what broke that you did not expect. That interval, measured rather than estimated, is the number your board is implicitly relying on.',
};

export const contrastBlock = [
  'Everything above rests on your own answers. That is the limit of this instrument, and it is the reason AGDA™ exists.',
  'AGDA™ does three things a Snapshot structurally cannot. It collects the evidence rather than accepting the claim. It tests each claim against that evidence and constrains the result where the evidence does not support it. And it returns the same verdict from the same inputs, regardless of who conducts the assessment.',
  'The Snapshot asks whether intervention might work. AGDA™ establishes what the evidence actually shows.',
];

export const disclaimer =
  'Indicative response pattern only. Snapshot Response Model v1.0, question set 1.0. Based on fifteen self reported answers. This is not an AGDA™ assessment, an assurance opinion, a certification or a verification. No submitted claim has been tested against evidence. AGDA™ methodology is proprietary and is not reproduced here.';

export interface PrototypeResult {
  leastConfidentArea: Area;
  mostConfidentArea: Area;
  confidenceBasis: ConfidenceBasis;
  headline: string;
  mostConfidentText: string;
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
 * This reads a query parameter. It does not read the visitor's answers,
 * and must not be extended to do so.
 */
export function resolvePrototypeResult(preview: string | null): PrototypeResult {
  let area: Area = 'decide';
  let basis: ConfidenceBasis = 'documented';

  if (preview) {
    const [rawArea, rawBasis] = preview.split('-');
    if (rawArea && isArea(rawArea)) area = rawArea;
    if (rawBasis && isBasis(rawBasis)) basis = rawBasis;
  }

  // The most confidently described area is shown as prose only. For the
  // prototype it is the next area along, purely so the sentence renders.
  const mostConfidentArea = AREAS[(AREAS.indexOf(area) + 2) % AREAS.length];

  return {
    leastConfidentArea: area,
    mostConfidentArea,
    confidenceBasis: basis,
    headline: headlines[area][basis],
    mostConfidentText: `Your answers expressed the most confidence about ${areaNoun[mostConfidentArea]}.`,
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
