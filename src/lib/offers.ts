// Single source of truth for the three current engagements. The homepage,
// /services/, the shared FAQ on /agda/ and /services/, and the Offer nodes
// in BaseLayout all read from here. public/llms.txt mirrors the names,
// ranges and the Review exclusion by hand; tests/unit/offers-parity.test.ts
// checks that the mirror has not drifted.
//
// Prices are indicative, from the 14 September 2026 commercial strategy
// (§15, §16) as restated in the AGDA offer architecture of 5 November 2026
// (Authority Check as the entry offer). They are published with the
// qualifier below by a decision taken on 15 September 2026. They are not
// stable enough for structured data, so the Offer nodes carry names and
// descriptions only.
//
// Claims held for the Authority Check (offer architecture, "The Authority
// Check"): it is not an AGDA verdict, SEDI result or score and carries no
// attestation; the live call-out is one test at one time; no Check fee
// credit against a Review is promised (the rule is not decided); the
// finding is prepared without independent review.
//
// Deliverable wording. The evidence register is a strategy-confirmed
// full-assessment output (§8) and stays in the package. Signed SEDI
// result records are deliberately not in the list: see RECORDS_NOTE.
// The written delivery procedures behind these deliverables are drafted
// in internal/procedures/ and are pending confirmation. Nothing here says
// a deliverable is platform-generated.

export interface Offer {
  slug: 'check' | 'review' | 'assessment';
  name: string;
  /** The one question this engagement answers about the named system. */
  question: string;
  /** Schema.org serviceType. The Check is not an assessment. */
  serviceType: string;
  short: string;
  purpose: string;
  scope: string[];
  /** One line for the "Evidence examined" row on the homepage. */
  examined: string;
  receive: string[];
  exclusion: string;
  /** One line for the homepage card; the full exclusion is on /services/. */
  exclusionShort: string;
  /** The practical decision the engagement supports. */
  decision: string;
  /** What the client keeps if they go no further. */
  retain: string;
  /** When this engagement is the right starting point. */
  suitable: string;
  timing: string;
  price: string;
  priceNote: string;
  schemaDescription: string;
}

export const PRICE_QUALIFIER =
  'Initial pricing remains subject to market validation.';

/* What moves a quoted fee above its starting price. Shown once beneath the three
   sheets on /services/ and mirrored in llms.txt. Additional systems,
   pathways, scenarios and implementation work are separately scoped;
   that boundary lives in each offer's exclusion row, not here. */
export const FEE_BASIS =
  'The final fee reflects the agreed scope and assessment boundary, stakeholder involvement, the evidence position and the depth of investigation required. The proposal confirms the scope, outputs, fee, terms and timetable.';

/* Enquiry-led publication. The site describes the intended offers and
   invites discussion; it does not imply that either engagement is
   immediately available. Shown once beside the offers on / and
   /services/ and mirrored in llms.txt. */
export const AVAILABILITY =
  'Contact us to discuss scope and availability. We confirm delivery arrangements and a start date before accepting an engagement.';

export const offers: Offer[] = [
  {
    slug: 'check',
    name: 'Authority Check',
    question: 'Can anyone stop this system?',
    serviceType: 'Intervention authority check',
    short: 'A one-page finding on who can halt one named system, whether they can decide alone, how they are reached out of hours and where the halt takes effect.',
    purpose:
      'A narrow entry engagement that answers one question about one named system: can anyone stop it? It is not an AGDA® verdict, SEDI result or score, and it carries no attestation.',
    scope: [
      'One named system.',
      'Who may halt it, and under which delegation.',
      'Whether they can decide alone or need a quorum.',
      'How they are reached out of hours, tested once with a live call-out run under a protocol agreed with you beforehand.',
      'Where the halt takes effect: in the running system, or through another team or a vendor.',
    ],
    examined: 'The delegation, the quorum rule, the out-of-hours route and the halt mechanism, tested once with a live call-out.',
    receive: [
      'A one-page finding on authority, reachability and the halt mechanism.',
      'The gaps found.',
      'When the live call-out was run and what it showed, stated as one test at one time.',
    ],
    exclusion:
      'The Authority Check is not an AGDA® verdict, SEDI result or score, and carries no attestation. The finding is prepared without independent review. The live call-out is one test at one time and does not show that anyone can be reached on any other occasion. A finding about one system is not a finding about the organisation. It is a distinct, narrower engagement, not a discounted Review.',
    exclusionShort: 'Not an AGDA® verdict, SEDI result or score, and no attestation. Prepared without independent review.',
    decision: 'Whether anyone can stop this system, who that is, and where the gaps lie in their authority, their reachability and the halt mechanism.',
    retain: 'The one-page finding stands on its own: who may halt the system, whether they can decide alone, how they were reached and where the halt takes effect, with the gaps found. It is a finding about this system only.',
    suitable: 'You want a bounded answer on whether anyone can stop one named system before looking at the evidence behind every step of its intervention chain.',
    timing: 'Scope, access and timing are agreed in the proposal. The live call-out is run once, at a time agreed in the protocol.',
    price: '£12,500 fixed + VAT',
    priceNote: 'Indicative fee',
    schemaDescription:
      'A narrow check of one named system that establishes who may halt it, whether they can decide alone, how they are reached out of hours and where the halt takes effect. Not an AGDA® verdict, SEDI result or score, and carries no attestation.',
  },
  {
    slug: 'review',
    name: 'Intervention Readiness Review',
    question: 'Could you prove it?',
    serviceType: 'Intervention Readiness assessment',
    short: 'A documented executive view of what you could evidence for each step of the intervention chain on one system, the timings in your own records and whether a full assessment is warranted.',
    purpose:
      'A preliminary engagement for one named system. It includes everything in the Authority Check and adds evidence for all four steps of the intervention chain, a review of your own records for real timings, and the inputs needed to set the intervention window. It establishes whether a full AGDA® Assessment is warranted.',
    scope: [
      'Everything in the Authority Check.',
      'Evidence for Detect, Escalate, Decide and Intervene, each graded by the strongest evidence held: Assumed, Policy, Drill, Production or Stress-tested.',
      'Review of your own records for real timings.',
      'Identification of the inputs needed to set the intervention window.',
      'Limited stakeholder access.',
    ],
    examined: 'Evidence for all four steps, graded, and your own records reviewed for real timings.',
    receive: [
      'The Authority Check finding.',
      'A gap register: the evidence held for each step, graded, and what is missing.',
      'A recommendation on whether a full AGDA® Assessment is warranted, and the proposed scope if it is.',
    ],
    exclusion: 'The Review does not include the AGDA® verdict, the window set from your records, the end-to-end timing result or signed SEDI result records. It is not a discounted AGDA® Assessment.',
    exclusionShort: 'The Review does not include the AGDA® verdict. It is not a discounted AGDA® Assessment.',
    decision: 'Whether you could prove that this system can be stopped, step by step, and whether a full AGDA® Assessment is warranted.',
    retain: 'The gap register and recommendation stand on their own: what you can evidence for each step today, what the records show about real timings and where the gaps are. They support prioritisation and budget decisions whether or not a full Assessment follows.',
    suitable: 'You need to know what you could evidence for one system, not only who could stop it, or you need a documented basis for deciding whether it warrants a full Assessment. If the system, pathway and scenario are already defined and evidence access is available, discuss a full Assessment directly.',
    timing: 'Scope, access and timing are agreed in the proposal.',
    price: 'From £25,000 + VAT',
    priceNote: 'Indicative fee',
    schemaDescription:
      'A preliminary review of one named system that includes the Authority Check and adds graded evidence for all four steps of the intervention chain, a review of the client\'s own records for real timings and the inputs needed to set the intervention window. Does not include the AGDA® verdict.',
  },
  {
    slug: 'assessment',
    name: 'AGDA® Assessment',
    question: 'Can you stop it in time?',
    serviceType: 'Intervention Readiness assessment',
    short: 'A formal assessment of one consequential AI-enabled system through a defined decision or action pathway and a specified intervention scenario.',
    purpose:
      'A formal assessment of Intervention Readiness for one named consequential AI-enabled system, examined through a defined decision or action pathway and a specified intervention scenario. It includes everything in the Review and sets the intervention window from your own records.',
    scope: [
      'Everything in the Review.',
      'One named AI-enabled system and its operating version.',
      'One defined consequential decision or action pathway.',
      'One specified intervention scenario and trigger.',
      'Relevant business, risk and technology stakeholders.',
      'Structured interviews, walkthroughs and review of relevant evidence.',
    ],
    examined: 'Structured interviews, walkthroughs and the relevant evidence, against a window set from your own records.',
    receive: [
      'The defined scope: system, pathway, scenario, boundaries, dates and material assumptions.',
      'The intervention window, set from your own records, with its basis.',
      'An evidence register with provenance and material gaps.',
      'Best and worst-case timings for each step and the end-to-end result against the window.',
      'A sensitivity test with the window 25% shorter and 25% longer.',
      'SEDI findings and an analysis of the intervention chain, naming the weak link.',
      'An Intervention Readiness verdict (Before impact, At risk or After impact), its confidence basis and material limitations.',
      'Remediation priorities, and a report written for the board and, if you choose, your supervisor.',
    ],
    exclusion:
      'Additional systems, pathways or scenarios, enterprise-wide inventory, governance redesign, legal opinion, full regulatory compliance assessment, model validation, penetration or cybersecurity testing, software development, implementation and remediation delivery are separately scoped. It is not regulatory certification.',
    exclusionShort: 'Connected systems, additional scenarios and implementation work are scoped separately. It is not regulatory certification.',
    decision: 'Whether the agreed pathway can continue operating under its present intervention arrangements, and what has to change before the organisation relies on it.',
    retain: 'The full package: scope record, evidence register, SEDI findings, the verdict with its confidence basis and limitations, executive interpretation and remediation priorities.',
    suitable: 'The system, pathway and scenario are defined, the stakeholders and evidence are accessible, and the decision cannot wait for a preliminary review.',
    timing: 'Once an engagement begins, a standard assessment is estimated to run over approximately four weeks, subject to scope, stakeholder access and evidence readiness. The proposal sets the detailed timetable.',
    price: 'From £75,000 + VAT',
    priceNote: 'Indicative initial fee',
    schemaDescription:
      'A formal assessment of Intervention Readiness for one named consequential AI-enabled system, examined through a defined decision or action pathway and a specified intervention scenario. Produces an Intervention Readiness verdict with its evidence basis.',
  },
];

/* Verifiable records are not a standard deliverable. The output-access
   policy (which artefacts may leave Intervene, in what form, to whom) is
   not yet approved; until it is, the site states the condition and
   promises no distribution. Rendered beneath the full-assessment
   deliverables wherever they appear. */
export const RECORDS_NOTE =
  'Signed SEDI result records are not a standard deliverable. They may be supplied only under an approved output-access arrangement, where the engagement terms provide for them and the delivery configuration supports them.';

/* Strategic issuance requirement (revised strategy §5, rule 4). Stated as
   a requirement; the review process that enforces it is not described
   as operational. */
export const SELF_APPROVAL =
  "Issuance requires approval separate from the assessor's own judgement.";

const bySlug = (slug: Offer['slug']): Offer => offers.find((o) => o.slug === slug)!;
export const check = bySlug('check');
export const review = bySlug('review');
export const assessment = bySlug('assessment');

// Four activities of a full assessment, without weeks. The strategy's
// week-by-week structure is recovered only to Week 1; the proposal sets
// the detailed timetable.
export const activities = [
  {
    name: 'Agree scope',
    body: 'Confirm the named system, the consequential pathway, the intervention scenario, system boundaries, stakeholders, evidence requirements and timing assumptions.',
  },
  {
    name: 'Examine evidence',
    body: 'Structured interviews and walkthroughs with the people who run the system, and review of the records, logs, exercises and decisions that bear on each stage.',
  },
  {
    name: 'Assess the intervention chain',
    body: 'Analyse Detect, Escalate, Decide and Intervene against the available time, the dependencies between stages and the evidence behind each, using the AGDA® methodology.',
  },
  {
    name: 'Issue the agreed outputs',
    body: 'Review factual challenges and further evidence, finalise the assessment, for which Intervene retains responsibility, and deliver the outputs listed in the engagement scope, with an executive readout.',
  },
];

// Shared FAQ. Rendered visibly and emitted as FAQPage JSON-LD on /agda/
// and /services/, so the schema answers are identical to the copy.
export const offerFaqs = [
  {
    question: 'What is the Authority Check?',
    answer:
      'A narrow entry engagement that asks one question of one named system: can anyone stop it? It establishes who may halt the system and under which delegation, whether they can decide alone or need a quorum, how they are reached out of hours, and where the halt takes effect. It delivers a one-page finding and the gaps found.',
  },
  {
    question: 'Is the Authority Check an AGDA® verdict?',
    answer:
      'No. The Authority Check is not an AGDA® verdict, SEDI result or score, and it carries no attestation. The finding is prepared without independent review and applies to the one named system only.',
  },
  {
    question: 'Does the live call-out show the right person can always be reached?',
    answer:
      'No. The live call-out is one test, run once under a protocol agreed with you beforehand. The finding states when it was run and what it showed. It does not establish that anyone can be reached on any other occasion.',
  },
  {
    question: 'Is the Intervention Readiness Review a full AGDA® Assessment?',
    answer:
      'No. The Review includes everything in the Authority Check and adds evidence for all four steps of the intervention chain, a review of your own records for real timings, and the inputs needed to set the intervention window. It delivers a gap register and a recommendation on whether a full Assessment is warranted. It does not include the AGDA® verdict, and it is not a discounted AGDA® Assessment.',
  },
  {
    question: 'Do we need an Authority Check or a Review first?',
    answer:
      'No. Each engagement includes the one before it, and none is a prerequisite. If the system, intervention question and assessment scope are sufficiently clear, and relevant evidence access is available, we can discuss a full AGDA® Assessment directly. The Authority Check and the Review are separate, narrower engagements for organisations that need to establish those foundations.',
  },
  {
    question: 'Can a client challenge the conclusion?',
    answer:
      'Yes. A client can correct facts, challenge interpretation and provide additional evidence. Intervene evaluates those submissions and retains responsibility for the final judgement. The judgement itself is not negotiated.',
  },
  {
    question: 'Does verification prove readiness?',
    answer:
      'No. For signed SEDI result records, verification checks the signature and the integrity of the records covered by the attestation. It does not prove the truth of the underlying evidence, validate the methodology or guarantee future intervention.',
  },
  {
    question: 'Does AGDA® monitor a live system?',
    answer:
      'No. AGDA® is a scoped assessment of one named system, pathway and scenario. Ongoing monitoring, software integration and remediation implementation are outside the standard engagement.',
  },
];

// Who the strategy expects in the buying conversation (§14).
export const buyingGroup = [
  { role: 'A senior risk or control sponsor', example: 'Chief Risk Officer, Chief Compliance Officer, Head of Operational Resilience, Head of Model Risk or Head of Technology Risk.' },
  { role: 'The operational owner of the use case', example: 'Head of Payments, Fraud, Financial Crime, Credit, Lending, Wealth, Trading, Treasury or Customer Operations.' },
  { role: 'A technology, AI or data owner', example: 'AI platform owner, data and AI leadership, engineering, product or architecture leadership.' },
];
