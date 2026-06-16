// Single source of truth for the Intervention Readiness defined-term set.
// BaseLayout builds the DefinedTerm JSON-LD from this; the glossary page
// renders from the same list. One vocabulary, no drift between schema,
// copy and llms.txt.
//
// Canonical definitions are verbatim. Do not reword them anywhere they
// appear (copy, metadata, JSON-LD, FAQ answers, glossary, llms.txt).

export interface Term {
  slug: string;
  name: string;
  definition: string;
  // Page path under the base URL where the term is canonically defined.
  // Hub terms own a dedicated page; the rest live at a glossary anchor.
  path: string;
  hub: boolean;
  // IR and AGDA already have bespoke nodes in BaseLayout; skip schema-gen
  // for them but still render them in the glossary.
  core?: boolean;
}

export const terms: Term[] = [
  {
    slug: 'intervention-readiness',
    name: 'Intervention Readiness',
    definition:
      'The ability of an organisation to detect, escalate, decide and intervene before harm becomes irreversible.',
    path: 'intervention-readiness/',
    hub: false,
    core: true,
  },
  {
    slug: 'agda',
    name: 'AGDA™',
    definition:
      'A deterministic assessment of Intervention Readiness that evaluates whether an organisation can detect, escalate, decide and intervene before harm becomes irreversible.',
    path: 'agda/',
    hub: false,
    core: true,
  },
  {
    slug: 'intervention-chain',
    name: 'Intervention Chain',
    definition:
      'The sequence of detect, escalate, decide and intervene that must complete within the reversibility window.',
    path: 'intervention-readiness/intervention-chain/',
    hub: true,
  },
  {
    slug: 'reversibility-window',
    name: 'Reversibility Window',
    definition:
      'The interval between a deviation and the point at which harm becomes irreversible.',
    path: 'intervention-readiness/reversibility-window/',
    hub: true,
  },
  {
    slug: 'halt-authority',
    name: 'Halt Authority',
    definition:
      'The authority and capability to stop a consequential system, held by someone positioned to act in time.',
    path: 'intervention-readiness/halt-authority/',
    hub: true,
  },
  {
    slug: 'effective-human-oversight',
    name: 'Effective Human Oversight',
    definition:
      'Oversight in which humans are informed, authorised and able to alter or halt outcomes before the harm window closes.',
    path: 'intervention-readiness/human-oversight/',
    hub: true,
  },
  {
    slug: 'point-of-irreversibility',
    name: 'Point of Irreversibility',
    definition:
      'The moment after which intervention can no longer change the outcome.',
    path: 'glossary/',
    hub: false,
  },
  {
    slug: 'evidence-ceiling',
    name: 'Evidence Ceiling',
    definition:
      "The limit a stage's evidence places on the overall verdict; weak evidence caps the result.",
    path: 'glossary/',
    hub: false,
  },
  {
    slug: 'chain-propagation',
    name: 'Chain Propagation',
    definition:
      'The logic by which the weakest stage constrains the assessed capability of the whole chain.',
    path: 'glossary/',
    hub: false,
  },
  {
    slug: 'deterministic-verdict',
    name: 'Deterministic Verdict',
    definition:
      'A result produced by fixed rules applied to evidence, reproducible and independent of assessor opinion.',
    path: 'glossary/',
    hub: false,
  },
  {
    slug: 'intervention-capability-assessment',
    name: 'Intervention Capability Assessment',
    definition:
      'A forward measurement of whether intervention can occur in time; the assessment category AGDA™ defines.',
    path: 'glossary/',
    hub: false,
  },
];

// Stable @id for a term's DefinedTerm node.
export function termId(baseUrl: string, t: Term): string {
  return t.hub ? `${baseUrl}${t.path}#defined-term` : `${baseUrl}glossary/#term-${t.slug}`;
}

// Canonical URL where the term is defined and read by a human.
export function termUrl(baseUrl: string, t: Term): string {
  if (t.core || t.hub) return `${baseUrl}${t.path}`;
  return `${baseUrl}glossary/#${t.slug}`;
}
