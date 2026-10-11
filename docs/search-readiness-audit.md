# Search visibility and commercial readiness audit

11 October 2026. Implemented and verified locally against approved release `33dae4f7c67d7631bde844e216e0567d0184a848`. No commit, push, deployment, account mutation or live enquiry submission was made.

## Baseline and priorities

The initial working tree was clean on `main`, matching `origin/main`. Direct production HTML reported build `33dae4f`; all 29 inspected production pages reported that build. GitHub's repository API reports `JamesSaint/Intervene` as public. Its visibility was left unchanged. This document contains technical findings and proposals, not private client or pipeline information.

| Priority | Finding | Disposition |
| --- | --- | --- |
| P0 | GA4 loaded and sent a collection request before consent and again on a rejected return visit, contradicting the privacy notice | Basic consent implemented and network-tested locally. Production correction awaits explicit deployment approval. |
| P1 | Primary commercial interactions were unmeasured; immediate navigation could discard a newly added CTA event | Consent-gated events implemented, including a single-use CTA hand-off. See `analytics-events.md`. |
| P2 | Both offers pointed to the AGDA® DefinedTerm, conflating Review and full Assessment services | Distinct persistent Service identifiers now link each Offer to its actual service and provider. |
| P2 | Existing JSON-LD used unsupported DefinedTerm `hasPart` and `creator`, and Article-only `breadcrumb`; the network page duplicated its WebPage node with a different description | Removed the redundant relationship; used supported `owner`; typed articles as both Article and WebPage; removed the duplicate network node. Public copy and James's article authorship are preserved. |
| P2 | Error-document canonical pointed to `/404/`; generated legal breadcrumbs referred to the non-existent `/legal/` page | Corrected error canonical and breadcrumb normalisation; omitted the legal namespace parent. |
| P2 | A favicon integration snippet was shipped as a public HTML document | Moved it to `docs/favicon-meta-tags.html`; deployed icon assets and references remain intact. |
| P2 | The contact form disabled native validation and had no concurrent-submit guard | Restored native validation as progressive enhancement and blocked concurrent JavaScript submissions. |
| P3 | New search copy, training-crawler policy changes and IndexNow have unproven incremental value | Deferred for editorial or policy approval. No new public editorial content was added. |

## Technical SEO and hosting

The existing Astro static architecture is appropriate for GitHub Pages. All 26 sitemap pages returned HTTP 200 in production. The homepage, services, AGDA®, methodology, sample verdict, contact, explanatory category pages and insights render their substantive text without JavaScript. Local tests inspect all 33 generated routes and their metadata, images, breadcrumbs and sitemap membership.

The 26 canonical public pages have unique titles and descriptions. Canonicals, Open Graph URLs and social metadata agree. Preview images resolve. Production inspection found one main H1 and no heading-level skips on every inspected page, with dimensions on all inspected images. All internal file links resolve in the local build; inspected same-page fragment links resolve. Rendered main-page text matches production on all 29 compared pages. No CSS, approved pricing, methodology, technical claims or regulatory claims were edited.

The sitemap index and child XML parse successfully, contain absolute production URLs without duplicates, and contain exactly the indexable page set. Legal pages, style guide, withdrawn Snapshot, redirect stub and error document are excluded. No modification dates were fabricated. Robots advertises the sitemap and preserves the intentional style-guide restriction. Legal and withdrawn pages retain their existing noindex directives. The blocked style guide's noindex cannot be relied upon if a crawler cannot fetch it; account-level URL inspection is required before claiming it is absent from an index.

Production `/services` redirects with HTTP 301 to `/services/`. `/services/index.html` returns 200 with the same canonical, a static-hosting alias. The old `/method/` route is an HTTP 200 HTML redirect to `/methodology/`, with noindex and the destination canonical. It is not an HTTP 301. An unknown production path returned 404. No additional redirect infrastructure was introduced.

Fonts are local WOFF2 assets, with swap and existing preload/fallback treatment. There is no Google Fonts CDN request in the current implementation. Responsive layout, keyboard access, reduced motion and serious accessibility violations are covered by the existing browser suite. Field Core Web Vitals and real-user INP were unavailable; no performance score or field pass is asserted. The architecture review did not establish a performance defect warranting design changes.

## Google Search Console and Bing

A public Google site-verification TXT record is present at `intervene.uk`. This confirms a verification mechanism, not an active Search Console property, owner access or indexing. There is no repository Google HTML verification file or meta token. Conditional GA loading should not be used as the ownership-verification mechanism. [Google's ownership-verification methods](https://support.google.com/webmasters/answer/9008080?hl=en).

Exact account steps:

1. Open Search Console and select or add the Domain property `intervene.uk`. Use the existing DNS verification where it corresponds to the authorised account. If a different TXT record is required, obtain that account's exact value and add it at the DNS provider; retain existing verification records.
2. Submit `https://intervene.uk/sitemap-index.xml` in Sitemaps. Confirm processing, not just a successful fetch.
3. Inspect `https://intervene.uk/`, `/services/`, `/agda/`, `/methodology/`, `/contact/` and `/intervention-readiness/`. Compare Google-selected and declared canonicals, live rendering and indexing status. Request indexing only after authorised deployment where useful.
4. Review Page indexing exclusions, crawl failures, Search performance and Core Web Vitals. Record actual indexed pages, queries, impressions and clicks. No account results are supplied in this audit.
5. In Bing Webmaster Tools, add `https://intervene.uk/` or import the authorised Search Console property, then verify and submit the same sitemap. If using XML-file verification, place the exact account-supplied `BingSiteAuth.xml` in `public/` through a separately authorised deployment. No token or file was invented. [Bing's verification methods](https://www2.bing.com/webmasters/help/add-and-verify-site-12184f8b).

Bing account status is unknown; no repository verification artefact was found. IndexNow can work with a root-hosted ownership key and deployment-time submissions, but requires key provisioning and post-deployment reliability. For this 26-page static site, a working sitemap is already available and incremental benefit is unverified. No external service, key or submission was added. [IndexNow documentation](https://www.indexnow.org/documentation).

## AI discovery and entity clarity

The company, AGDA® term, assessment services, founder, website, pages and terminology use persistent identifiers. Distinct Service nodes resolve the offer conflation. Legal name, canonical domain, registered mark, existing logo and public organisation links remain consistent. Existing explanatory HTML covers the definition, four-stage chain, evidence, assessment scope, limitations and engagement route.

The existing wildcard robots policy permits public crawling by Googlebot, Bingbot, OAI-SearchBot and PerplexityBot. It also permits model-training crawlers such as GPTBot; there is no separate training restriction to preserve. No crawler policy was expanded or changed. Search retrieval and training permissions are different policy choices: [OpenAI's crawler roles](https://developers.openai.com/api/docs/bots), [Perplexity's crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).

The existing `llms.txt` was retained as supplementary navigation. Its linked resources are canonical indexable pages. It is not a ranking requirement or proof of citation. Google states that its AI Search features need no special AI text file or special schema. [Google's AI Search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). This audit does not establish search indexing, ranking or an AI citation.

## Enquiries and privacy approval

Browser tests use intercepted Formspree responses. They verify required fields, email validity, labels, keyboard submission, honeypot suppression, pending-button behaviour, concurrent-submit protection, successful-response handling, HTTP failure and network failure. Failed responses retain entered fields and permit retry. The native form remains capable of direct submission without JavaScript. Formspree account configuration, server-side spam controls, notification delivery and intended-inbox receipt remain unverified. No live submission was authorised or sent.

Actual Google network inspection verified all six required consent cases: no decision, acceptance, rejection, accepted return, rejected return and withdrawal. Before consent, after rejection and after withdrawal, no new analytics request was observed locally. Acceptance loads one tag per document, and accepted returns load normally. GA cookies are removed on withdrawal. Already transmitted data is not retrospectively erased. Cross-tab withdrawal, unavailable storage and duplicate acceptance are covered by browser tests.

The privacy notice was not edited. Its core promise about analytics now matches the local implementation, but production still runs the earlier release. The following amendments require editorial/legal approval before publication:

- Remove the Google Fonts CDN reference: current fonts are served locally.
- Qualify the assertion that the choice is never sent anywhere. The preference remains in the browser; after acceptance, the tag sends the analytics consent state to Google. No denied-consent notification is transmitted.
- Describe the new consent-only, single-use session CTA hand-off and immediate deletion, and note that withdrawal reloads the page.
- Review the truncated-IP description against Google's current UK/EU processing explanation. Google says it derives location and then discards the IP address. [Google's UK/EU data explanation](https://support.google.com/analytics/answer/12017362?hl=en).

## Content opportunities and buyer relevance

These are editorial proposals and search-intent hypotheses, not validated keyword volume, demand or an agreed publication plan. Existing pages already cover all seven requested architecture questions: the problem, capability gap, method, evidence, contextual comparisons, engagement options and contact. Further pages are not necessary for the technical release.

1. **Evidence needed to commission an assessment**, within `/services/`. Audience: a model-risk owner or sponsor with a defined system and budget question. Intent: intervention-readiness assessment, AI control-effectiveness assessment and evidence-based assurance. Core question: what evidence and access should we bring, and which engagement answers our decision? Unique contribution: concrete evidence examples tied to the existing Review/Assessment boundary. Evidence: approved offer scope, methodology and constructed sample, with additional examples requiring James's confirmation. Links: methodology, sample verdict and contact. Commercial relevance: reduces uncertainty before an enquiry. Highest buyer relevance by inference.
2. **Human oversight under a specified consequential scenario**, within the existing human-oversight and halt-authority pages. Audience: AI-system owner, risk lead or board sponsor. Intent: human oversight effectiveness, intervention authority, incident escalation and high-risk AI oversight. Core question: what demonstrates that the named person can interrupt this pathway in time? Unique contribution: relate the chain and authority evidence to the scoped question rather than provide a generic AI-governance checklist. Evidence: existing method, assessment limits and [the Commission's Article 14 text](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14). Links: chain, methodology, sample and services. Commercial relevance: connects a specific oversight concern to an assessment conversation. Any regulatory interpretation needs careful scope and editorial approval.
3. **Regulatory context for the intervention question**, preferably as a short sourced addition to the resilience comparison and human-oversight pages. Audience: UK regulated financial-services risk/resilience leads and EU high-risk AI oversight owners. Intent: AI operational resilience, operational-resilience assessment and board assurance. Core question: which expectations are relevant, and what does this assessment leave unanswered? Unique contribution: distinguish service impact tolerances, effective human oversight and AGDA®'s system/pathway/scenario boundary. Evidence: [FCA operational-resilience guidance](https://www.fca.org.uk/firms/operational-resilience) and the Commission's Article 14 text. Links: sectors, category map, services and assessment limitations. Commercial relevance: helps buyers establish fit without promising compliance. A separate regulatory page would be justified only if the approved material cannot be expressed clearly in those existing pages.

Broad AI risk assessment, AI governance assurance and model-risk governance terms can indicate legal, framework or model-validation intent outside the offering. Do not compete for them without confirming a more specific intervention question. The methodology and Intervention Readiness pages already provide the distinctive definitions. Authentic, publishable client evidence could strengthen authority later; none was supplied or invented here.

## Verification and deployment

Baseline: typecheck clean; 118 unit tests passed; production build passed; 316 browser tests passed with two intentional skips. Final verification: typecheck reported zero errors, warnings or hints; all 118 unit tests passed; content checks and the 33-route production build passed; the full desktop/mobile browser suite passed 348 tests with two intentional skips. Rendered-page search checks, actual Google network inspection and complete diff review were included. All 32 JSON-LD documents passed the official-vocabulary checks.

The vocabulary validator checks JSON parsing, known types, supported property domains and typed local-reference ranges across all 32 JSON-LD documents. It does not certify Google rich-result eligibility or validate every textual claim. Reproduce with an official vocabulary snapshot:

```sh
curl -sS https://schema.org/version/latest/schemaorg-current-https.jsonld -o /tmp/intervene-schemaorg.jsonld
npm run build
node scripts/check-structured-data.mjs /tmp/intervene-schemaorg.jsonld
```

The rendered search test validates XML, all 26 sitemap URLs, canonical and social metadata, unique public titles/descriptions, image responses, entity identifiers, service/offer consistency, breadcrumb destinations and `llms.txt` resources. It covers all 33 generated routes with JavaScript disabled; the HTML redirect is parsed without executing its refresh.

The real Google tag generated offering, selection, sample-view, enquiry-start and successful-response events with its collection endpoint intercepted. Test field values were absent from those payloads. A final enhanced-measurement probe exposed automatic site-search query collection despite the canonical override; the readiness-gated loader now removes query strings after functional page modules read them and before the tag loads. The repeated real-tag probe reported zero synthetic query-value leaks, and a consented Snapshot preview retained its selected result. The final CTA hand-off produced a `primary_cta_click` collection request after arrival and left no pending item. No Formspree request left the browser. These checks establish browser behaviour, not GA4 account reporting or inbox delivery.

Changes remain local and uncommitted. A push to `main` triggers the existing GitHub Pages deployment; do not push without explicit approval. Production still serves approved release `33dae4f`. No external account changes, experimental crawler changes, new public content or assessment-engine changes were made.

## Next actions

1. Approve deployment of the verified technical corrections, prioritising the production privacy discrepancy; review the notice amendments separately before publishing them.
2. Authorise one clearly identified live enquiry test and verify Formspree acceptance, notification delivery and actual intended-inbox receipt as separate stages.
3. Open the authorised Google and Bing properties, verify ownership, submit the sitemap and inspect the important commercial URLs after deployment.
4. Confirm GA4 reporting and custom dimensions; distinguish endpoint acceptance from qualified inbox receipt, opportunities and paid work in operational records.
5. Establish the first complete comparable search period, then use actual queries and received enquiries to decide whether any proposed content addition is warranted.
