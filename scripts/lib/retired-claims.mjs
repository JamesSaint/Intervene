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
  // Operating model (reconciliation r2). Named delivery roles and the
  // review-before-issue process are the target model, not evidenced
  // capability; they are not described as operational in public copy.
  { name: 'role structure presented as operational', re: /Intervene appoints an? (Assessment|Technical Assessment) Lead/i },
  { name: 'review process presented as operational', re: /reviewed for compliance with the AGDA™ methodology before authorised issuance/i },
  { name: 'approved assessor presented as operational', re: /performed by an approved assessor/i },
  // Output access is undecided: distribution of records, verifier and
  // trust material is set in the engagement terms, not promised here.
  { name: 'distribution promised', re: /(ships?|shipped|delivered) with (the verifier|an engagement)/i },
  { name: 'distribution promised', re: /take the (bundle|record) from the supervised entity/i },
];

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
  'An assessment is not issued on the assessor\'s own approval.',
  'A signed record is not by itself an issued assessment.',
  'Which artefacts are supplied, to whom and under what arrangement is set in the engagement terms.',
  'Intervene retains Assessment Authority',
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
