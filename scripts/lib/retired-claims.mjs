/**
 * Retired offers and unsupported claims, sitewide.
 *
 * The 14 September 2026 commercial strategy replaced the pilot and
 * software-licence ladder with two engagements, and the product
 * definition draws the line between repeatable computation and
 * Intervene's judgement. This list keeps the withdrawn material from
 * returning through a copy edit. It is exact strings and narrow
 * patterns, not word bans: "signed", "bundle" and "deterministic" stay
 * legal because /verify/ and /methodology/ use them correctly.
 *
 * Two lists. RETIRED_LABELS are offer names and artefacts that no longer
 * exist. UNSUPPORTED_CLAIMS are shapes of sentence that assert something
 * the evidence does not support; each is written so that an explicit
 * statement of absence passes ("no outcome-validation evidence",
 * "not validated against real-world outcomes").
 *
 * Exported for the unit test in tests/unit/retired-claims.test.ts.
 */

export const RETIRED_SCOPES = [
  'src/pages',
  'src/components',
  'src/layouts',
  'src/lib',
  'public/llms.txt',
];

/** Paths (relative, prefix match) exempt from the retired-claims scan. */
export const RETIRED_EXEMPT = [
  'src/pages/insights/',          // narrative evidence notes
  'src/pages/readiness-snapshot/', // withdrawn; covered by the Snapshot rules
  'src/components/snapshot/',
  'src/lib/snapshot/',
];

export const RETIRED_LABELS = [
  'Short pilot',
  'Structured pilot',
  'Annual subscription',
  'Enterprise master',
  'Intervention Simulator',
  'Operator enablement',
  're-run rights',
  'engine-hash pinning',
  'Failure Exposure Report',
  'close-out memo',
  'regulator bundle',
  'Levels of assurance',
  'Global mandates',
  '108k',
  'disclosure threshold',
  'EXPOSED',
  '/ 5',
];

export const UNSUPPORTED_CLAIMS = [
  { name: 'universal signing', re: /every (agda™ )?(sedi )?assessment (ships|includes|returns|carries)/i },
  { name: 'judgement denied', re: /not our opinion/i },
  { name: 'judgement denied', re: /independent of assessor/i },
  { name: 'judgement denied', re: /opinion is not reproducible/i },
  {
    name: 'validation evidence offered',
    re: /(?<!\bno )(?<!\bnor )(?<!\bany )(populated-corpus|outcome-validation) evidence(?! (is|are|remains) (not|unavailable))/i,
  },
  { name: 'positive validation claim', re: /(?<!\bnot )(?<!\bun)(empirically|independently) validated/i },
  { name: 'positive validation claim', re: /calibrated against (outcomes|incidents)/i },
  { name: 'verify without us', re: /verify (it|the verdict) without (contacting )?us/i },
  // Signature verification compares hashes and a signature. It does not
  // establish that the engine ran; saying the output "came from" the
  // engine claims a replay that the verifier does not perform.
  { name: 'verification proves execution', re: /(output|result|verdict) (came|comes) from (a|the) (named|claimed|specific) engine/i },
  { name: 'verification proves execution', re: /bound to a specific engine version/i },
  // The sample's 4 to 96 hour contact interval does not by itself exceed
  // the six-hour window; the quorum delay does.
  { name: 'authority overstated', re: /authority cannot be reached/i },
  // Held for this release: neither a released delivery capability nor an
  // adopted manual procedure yet supports the sentence. Restore when one
  // is confirmed (plan D8b / P2).
  { name: 'timing provenance (held)', re: /records (what|which timings) (is|are) measured/i },
  // Held claims (reconciliation r2/r3). Each is accurate target-state
  // language that would be permitted once the named condition is met.
  // `held` records why it is held now, what would permit it and what to
  // update then. These are not permanent prohibitions.
  {
    name: 'role structure presented as operational',
    re: /Intervene appoints an? (Assessment|Technical Assessment) Lead/i,
    held: {
      why: 'Revised strategy §4 and §5 define roles as the target operating model; no appointment is recorded (§10 authorisation register does not yet exist).',
      permitWhen: 'Recorded appointments exist under the §10 authorisation framework for the roles named.',
      update: 'Remove this entry and its PROHIBITED fixture; add the appointed-role sentence to PERMITTED_FIXTURES.',
    },
  },
  {
    name: 'review process presented as operational',
    re: /reviewed for compliance with the AGDA™ methodology before authorised issuance/i,
    held: {
      why: 'Revised strategy §11: use this as current-tense public copy only when the process and authorised roles are operational. No Authorised Reviewer is appointed; no controlled issuance process is released.',
      permitWhen: 'At least one Authorised Reviewer is appointed under §10, the P3 review rule is adopted, and issuance runs through the controlled AGDA™ process (§5 rule 7, D6) or an explicitly approved transitional arrangement (§9).',
      update: 'Remove this entry and the next; move the preferred description to PERMITTED_FIXTURES; update tests/e2e/claims.spec.ts "authority and issuance" test.',
    },
  },
  {
    name: 'approved assessor presented as operational',
    re: /performed by an approved assessor/i,
    held: {
      why: 'As above (§11). No Approved Assessor appointment is recorded.',
      permitWhen: 'As above.',
      update: 'As above.',
    },
  },
  {
    name: 'founder-independent delivery presented as current',
    re: /delivery does not depend on any named (external )?individual/i,
    held: {
      why: 'Revised strategy §1 and §12 make delivery without James or Jo a target with an operational acceptance test still to be met.',
      permitWhen: 'The §12 acceptance test has been passed: an ordinary assessment sold, delivered, reviewed and issued with both unavailable, using authorised people and documented procedures.',
      update: 'Remove this entry and its PROHIBITED fixture.',
    },
  },
  {
    name: 'self-approval prohibition presented as an operating process',
    re: /assessment is not issued on the assessor'?s own approval/i,
    held: {
      why: 'The prohibition is a strategic issuance requirement (§5 rule 4). Stating it in the present tense as what happens implies an operating review process. The requirement form ("Issuance requires approval separate from the assessor\'s own judgement.") is permitted.',
      permitWhen: 'As for "review process presented as operational".',
      update: 'Remove this entry; keep SELF_APPROVAL in offers.ts or replace with the preferred §11 description.',
    },
  },
  // Output access (OD-1). The strategy §8 does not approve routine
  // disclosure of the bundle. Until an output-access policy is approved,
  // no page promises that records, the verifier or trust material are
  // supplied; engagement terms cannot substitute for the policy.
  {
    name: 'distribution promised',
    re: /(ships?|shipped|delivered) with (the verifier|an engagement)/i,
    held: {
      why: 'Revised strategy §8: output disclosure is a separate, unapproved decision.',
      permitWhen: 'An output-access policy is approved that permits the artefact and recipient class in question.',
      update: 'Narrow or remove this entry to match the approved policy.',
    },
  },
  { name: 'distribution promised', re: /take the (bundle|record) from the supervised entity/i },
  {
    name: 'records promised as a deliverable',
    re: /signed SEDI result records (form part of|are supplied|accompany|are included in) the (agreed )?(outputs|assessment|package)/i,
    held: {
      why: 'A conditional promise of distribution is still a promise; §8 approves no disclosure arrangement.',
      permitWhen: 'An approved output-access policy exists and the engagement-terms template selects an arrangement it permits.',
      update: 'Replace RECORDS_NOTE in offers.ts with the permitted deliverable wording; remove this entry.',
    },
  },
  // Enquiry-led publication: no engagement is described as immediately
  // available; delivery arrangements and a start date are confirmed before
  // acceptance. Held until the relevant procedures are adopted and staffed.
  {
    name: 'immediate availability implied',
    re: /\b(available now|accepted now|immediately available|start immediately|begin immediately)\b/i,
    held: {
      why: 'Neither engagement has confirmed preparation, review, release or staffing arrangements (P1 to P5 unadopted; no appointments).',
      permitWhen: 'The relevant procedures are adopted and the roles they need are appointed for the engagement type in question.',
      update: 'Remove this entry; add the availability sentence then in use to PERMITTED_FIXTURES.',
    },
  },
  {
    name: 'terms substituted for policy',
    re: /(?<!arrangement and )(?<!arrangement, and )(is|are) set in the engagement terms/i,
    held: {
      why: 'Engagement terms select an arrangement within a policy; they do not substitute for the unresolved output-access policy.',
      permitWhen: 'The output-access policy is approved; the sentence may then read "set in the engagement terms".',
      update: 'Remove this entry.',
    },
  },
];

/** Held claims with their restoration conditions, for the decision sheet. */
export const HELD_CLAIMS = UNSUPPORTED_CLAIMS.filter((c) => c.held);

/**
 * Sentences that must pass. The unit test asserts each of these produces
 * no finding, so a tightening of the patterns above cannot silently ban
 * the truthful statement of absence.
 */
export const PERMITTED_FIXTURES = [
  'There is no populated corpus and no outcome-validation evidence.',
  'AGDA™ is not validated against real-world outcomes.',
  'not validated against real-world outcomes',
  'Signed SEDI result records are supplied where the agreed scope includes them and the delivery configuration supports them.',
  'repeatable computation',
  'Ed25519 signature',
  'append-only registry',
  'agda-verify',
  'outcome-validation evidence is unavailable',
  'match the signed commitments associated with the stated engine version',
  'It does not independently establish that the engine was executed or that its computation was correct.',
  'reaching an authority holder may exceed the assumed six-hour window, and the required quorum takes at least seven days',
  "Issuance requires approval separate from the assessor's own judgement.",
  'A signed record is not by itself an issued assessment.',
  'Signed SEDI result records are not a standard deliverable. They may be supplied only under an approved output-access arrangement, where the engagement terms provide for them and the delivery configuration supports them.',
  'Which artefacts are supplied, to whom and under what arrangement requires an approved output-access arrangement and is set in the engagement terms.',
  'Intervene retains Assessment Authority',
  'Contact us to discuss scope and availability. We confirm delivery arrangements and a start date before accepting an engagement.',
  'Once an engagement begins, a standard assessment is estimated to run over approximately four weeks',
];

/** Sentences that must fail. */
export const PROHIBITED_FIXTURES = [
  'Short pilot: one system, four weeks.',
  'Every assessment ships with a signed regulator bundle.',
  'Every AGDA™ SEDI assessment includes a signed bundle.',
  'Not our opinion. The engine is deterministic.',
  'reproducible and independent of assessor opinion',
  'provided under NDA alongside populated-corpus and outcome-validation evidence',
  'AGDA has been independently validated.',
  'Verify the verdict without us.',
  'Included with the Annual subscription.',
  '~108k over six-hour window',
  'it confirms the output came from a named engine version and a specific set of inputs',
  'authority cannot be reached inside the assumed window',
  'The assessment records what is measured, what is declared and what is assumed.',
  'Intervene appoints an Assessment Lead and a Technical Assessment Lead.',
  'Assessment performed by an approved assessor and reviewed for compliance with the AGDA™ methodology before authorised issuance.',
  'Public keys ship with the verifier package.',
  'Take the record from the supervised entity.',
  'Delivery does not depend on any named individual.',
  'An assessment is not issued on the assessor\'s own approval.',
  'Signed SEDI result records form part of the agreed outputs where the agreed scope includes them.',
  'Which artefacts are supplied, to whom and under what arrangement is set in the engagement terms.',
  'The Intervention Readiness Review is available now.',
];

/**
 * Scan one unit of copy (comments already stripped by the caller).
 * Returns findings as { line, term, text }.
 */
export function scanRetired(copy) {
  const findings = [];
  const lines = copy.split('\n');
  lines.forEach((line, index) => {
    for (const label of RETIRED_LABELS) {
      if (line.toLowerCase().includes(label.toLowerCase())) {
        findings.push({ line: index + 1, term: label, text: line.trim().slice(0, 120) });
      }
    }
    for (const claim of UNSUPPORTED_CLAIMS) {
      if (claim.re.test(line)) {
        findings.push({ line: index + 1, term: claim.name, text: line.trim().slice(0, 120) });
      }
    }
  });
  return findings;
}
