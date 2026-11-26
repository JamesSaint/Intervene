/**
 * The PDFs offered on /insights/. Files live in public/insights/pdf/.
 *
 * A published file name never changes: links to these files go out in
 * emails. Each `id` is the card's anchor on /insights/ and the target of a
 * short campaign link (see campaign-links.ts), so it is as fixed as the file.
 */
export interface InsightDownload {
  id: string;
  label: string;
  title: string;
  description: string;
  pages: number;
  file: string;
}

export interface InsightDownloadGroup { heading: string; items: InsightDownload[] }

export const PDF_BASE = '/insights/pdf/';
export const downloadHref = (d: InsightDownload) => `${PDF_BASE}${d.file}`;

export const downloadGroups: InsightDownloadGroup[] = [
  {
    heading: 'Start here',
    items: [
      {
        id: 'agda-one-pager',
        label: 'Overview · AGDA®',
        title: 'Your AI system starts to go wrong. Can you intervene in time?',
        description: 'AGDA® on one page: the four-step chain, Detect, Escalate, Decide, Intervene, and what an assessment gives you.',
        pages: 1,
        file: 'intervene-agda-one-pager.pdf',
      },
      {
        id: 'agda-fraud-one-pager',
        label: 'Overview · AGDA® FRAUD',
        title: 'You spot a scam payment. Can you stop it in time?',
        description: 'AGDA® FRAUD on one page: a proposed assessment of one payment pathway, from alert to hold. In research and development.',
        pages: 1,
        file: 'intervene-agda-fraud-overview.pdf',
      },
    ],
  },
  {
    heading: 'White papers',
    items: [
      {
        id: 'cro-paper',
        label: 'White paper · For Chief Risk Officers',
        title: 'You are accountable. Show us the evidence.',
        description: 'Under SM&CR, accountability for AI sits with the senior managers who already hold it. How to show that someone with authority could stop one named system in time.',
        pages: 6,
        file: 'intervene-agda-cro-white-paper.pdf',
      },
      {
        id: 'ciso-paper',
        label: 'White paper · For CISOs',
        title: 'You hold the off switch. Show us it works in time.',
        description: 'Incident response measures time to detect and time to contain. It rarely records who may switch off an AI system, or whether that takes effect in time.',
        pages: 4,
        file: 'intervene-agda-ciso-white-paper.pdf',
      },
      {
        id: 'fraud-paper',
        label: 'White paper · For fraud and risk leaders at banks and building societies',
        title: 'You spot a scam payment. Can you stop it in time?',
        description: 'A firm may hold a suspect outbound payment for up to four business days. Whether it can use that window depends on who receives the alert and who can authorise the hold.',
        pages: 4,
        file: 'intervene-agda-fraud-white-paper.pdf',
      },
    ],
  },
  {
    heading: 'Reference',
    items: [
      {
        id: 'obligation-map',
        label: 'Obligation map',
        title: 'Where the intervention question sits in your obligations',
        description: 'SM&CR, PRA SS1/23, operational resilience, Consumer Duty, the EU AI Act, DORA and APP fraud reimbursement, each set against one question: can you act in time?',
        pages: 2,
        file: 'intervene-agda-obligation-map.pdf',
      },
      {
        id: 'sample-verdict',
        label: 'Sample verdict · Constructed example',
        title: 'Retail credit. Cannot stop in time.',
        description: 'What an AGDA® finding looks like, shown on a constructed example. Not a client report.',
        pages: 2,
        file: 'intervene-agda-sample-verdict.pdf',
      },
    ],
  },
];
