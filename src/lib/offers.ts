// Single source of truth for the two current engagements. The homepage,
// /services/, the shared FAQ on /agda/ and /services/, and the Offer nodes
// in BaseLayout all read from here. public/llms.txt mirrors the names,
// ranges and the Review exclusion by hand; tests/unit/offers-parity.test.ts
// checks that the mirror has not drifted.
//
// Prices are indicative ranges from the 14 September 2026 commercial
// strategy (§15, §16). They are published with the qualifier below by a
// decision taken on 15 September 2026. They are not stable enough for
// structured data, so the Offer nodes carry names and descriptions only.
//
// Deliverable wording. The evidence register is a strategy-confirmed
// full-assessment output (§8) and stays in the package. Signed SEDI
// result records are deliberately not in the list: see RECORDS_NOTE.
// The written delivery procedures behind these deliverables are drafted
// in internal/procedures/ and are pending confirmation. Nothing here says
// a deliverable is platform-generated.

export interface Offer {
  slug: 'review' | 'assessment';
  name: string;
  short: string;
  purpose: string;
  scope: string[];
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
  'Initial pricing remains subject to market validation. The specific fee, deliverables and terms are agreed in the proposal.';

/* Enquiry-led publication. The site describes the intended offers and
   invites discussion; it does not imply that either engagement is
   immediately available. Shown once beside the offers on / and
   /services/ and mirrored in llms.txt. */
export const AVAILABILITY =
  'Contact us to discuss scope and availability. We confirm delivery arrangements and a start date before accepting an engagement.';

export const offers: Offer[] = [
  {
    slug: 'review',
    name: 'Intervention Readiness Review',
    short: 'A documented executive view of where one system could fail to be stopped in time, what evidence you hold and what a full assessment would need to examine.',
    purpose:
      'A focused entry engagement to determine whether a selected system presents a material intervention question and whether a full AGDA™ Assessment is justified.',
    scope: [
      'One proposed system.',
      'Limited stakeholder access.',
      'Preliminary intervention-chain mapping.',
      'Review of the evidence you already hold.',
      'A material hypothesis and an assessment recommendation.',
    ],
    receive: [
      'A concise executive review stating what needs to be assessed and why it matters.',
      'The evidence and access position: what exists, what is missing and who would need to take part.',
      'A recommendation on whether a full AGDA™ Assessment is warranted, and the proposed scope if it is.',
    ],
    exclusion: 'The Review does not include the AGDA™ verdict, the SEDI findings or signed SEDI result records. It is not a discounted AGDA™ Assessment.',
    exclusionShort: 'The Review does not include the AGDA™ verdict. It is not a discounted AGDA™ Assessment.',
    decision: 'Whether the selected system carries a material intervention question, and what you would need to assess, and to have access to, before relying on the answer.',
    retain: 'The executive review stands on its own: a stated intervention question for the system, the preliminary chain, the evidence you hold and the gaps, and a scoped recommendation. It supports prioritisation and budget decisions whether or not a full Assessment follows.',
    suitable: 'Start here when the system is newly identified, the evidence position is unclear, or several systems compete for attention. Where the system, pathway and scenario are already defined and evidence access is available, discuss a full Assessment directly.',
    timing: 'Scope, access and timing are agreed in the proposal.',
    price: '£20,000 to £35,000 + VAT',
    priceNote: 'Indicative fee',
    schemaDescription:
      'A focused review of one proposed system to establish the intervention question, the evidence position and whether a full AGDA™ Assessment is warranted. Does not include the AGDA™ verdict.',
  },
  {
    slug: 'assessment',
    name: 'AGDA™ Assessment',
    short: 'A formal assessment of one consequential AI-enabled system through a defined decision or action pathway and a specified intervention scenario.',
    purpose:
      'A formal assessment of Intervention Readiness for one named consequential AI-enabled system, examined through a defined decision or action pathway and a specified intervention scenario.',
    scope: [
      'One named AI-enabled system and its operating version.',
      'One defined consequential decision or action pathway.',
      'One specified intervention scenario and trigger.',
      'Relevant business, risk and technology stakeholders.',
      'Structured interviews, walkthroughs and review of relevant evidence.',
    ],
    receive: [
      'The defined scope: system, pathway, scenario, boundaries, dates and material assumptions.',
      'An evidence register with provenance and material gaps.',
      'SEDI findings and an analysis of the intervention chain.',
      'An Intervention Readiness verdict, its confidence basis and material limitations.',
      'An executive interpretation, priority findings and practical remediation priorities.',
    ],
    exclusion:
      'Additional systems, pathways or scenarios, enterprise-wide inventory, governance redesign, legal opinion, full regulatory compliance assessment, model validation, penetration or cybersecurity testing, software development, implementation and remediation delivery are separately scoped. It is not regulatory certification.',
    exclusionShort: 'Connected systems, additional scenarios and implementation work are scoped separately. It is not regulatory certification.',
    decision: 'Whether the agreed pathway can continue operating under its present intervention arrangements, and what has to change before the organisation relies on it.',
    retain: 'The full package: scope record, evidence register, SEDI findings, the verdict with its confidence basis and limitations, executive interpretation and remediation priorities.',
    suitable: 'Start here when the system, pathway and scenario are defined, the stakeholders and evidence are accessible, and the decision cannot wait for a preliminary review.',
    timing: 'Once an engagement begins, a standard assessment is estimated to run over approximately four weeks, subject to scope, stakeholder access and evidence readiness. The proposal sets the detailed timetable.',
    price: '£75,000 to £95,000 + VAT',
    priceNote: 'Indicative initial range',
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

export const review = offers[0];
export const assessment = offers[1];

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
    body: 'Analyse Detect, Escalate, Decide and Intervene against the available time, the dependencies between stages and the evidence behind each, using the AGDA™ methodology.',
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
    question: 'Is the Intervention Readiness Review a full AGDA™ Assessment?',
    answer:
      'No. The Review is a standalone executive review of one system: the intervention question, the preliminary chain, the evidence you hold and the gaps, and a scoped recommendation. It supports prioritisation and budget decisions on its own. It does not include the AGDA™ verdict, the SEDI findings or signed SEDI result records.',
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
    question: 'Does AGDA™ monitor a live system?',
    answer:
      'No. AGDA™ is a scoped assessment of one named system, pathway and scenario. Ongoing monitoring, software integration and remediation implementation are outside the standard engagement.',
  },
];

// Who the strategy expects in the buying conversation (§14).
export const buyingGroup = [
  { role: 'A senior risk or control sponsor', example: 'Chief Risk Officer, Chief Compliance Officer, Head of Operational Resilience, Head of Model Risk or Head of Technology Risk.' },
  { role: 'The operational owner of the use case', example: 'Head of Payments, Fraud, Financial Crime, Credit, Lending, Wealth, Trading, Treasury or Customer Operations.' },
  { role: 'A technology, AI or data owner', example: 'AI platform owner, data and AI leadership, engineering, product or architecture leadership.' },
];
