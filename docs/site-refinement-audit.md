# Site refinement audit

## Baseline

Audited 10 October 2026 against the supplied website-wide refinement brief.

The site is an Astro static build with 33 generated routes, five shared layouts, locally hosted brand fonts and approved SVG artwork. The Git working tree was clean before this pass. Baseline type and content checks pass, as do 114 unit tests and 264 Chromium desktop/mobile browser tests, with two intentional mobile skips.

The public product demonstration is a constructed retail-credit sample. No approved issued client assessment was found in the website assets. The presentation must keep its illustrative status, separate timing facts, unassessed fourth stage and lack of signature visible. It must not become a client result or a new assessment.

## Findings and implementation boundaries

- The homepage combines method and output, hides the finding and repeats its final invitation. Recompose it into question, problem, method, evidence, engagement and decision.
- The four SEDI capabilities have a small, static treatment. Explain their existing public questions, evidence and failure consequences using native disclosures. Publish no new rubric or criteria.
- Engagement content is shared with the full offer sheets, but the homepage comparison does not state the buyer's decision as directly as it could. Reuse the canonical commercial data; preserve fees, scope, exclusions and availability.
- Reference and comparison pages often loop back to the category rather than lead towards assessment output. Improve onward navigation and preserve related technical reading.
- Articles and policies use the full content width without a reading structure. Allocate desktop space to section navigation and prose; keep natural wrapping inside the allocated column.
- Mobile on-page navigation consumes several rows before the content. Make the navigation compact and reachable without hiding destinations.
- Three metadata descriptions exceed the brand's 155-character target. Shorten framing without changing claims. Preserve canonical URLs, schema, OG assets, robots and sitemap exclusions.
- Existing standing independence wording requires care under brand kit v3.0. Avoid an unconditional product-independence claim; preserve the commercial firewall and contractual conditions.
- Retain the sentence-case headings, natural wrapping and transparent secondary-button hover authorised in this session. These more specific preferences take precedence over conflicting older kit defaults. Fonts, marks, palette and claim boundaries remain authoritative.

## Route review

The intended readers and next steps are UX decisions for this pass, not claims about observed demand.

| Route | Intended reader | Purpose | Appropriate next step |
|---|---|---|---|
| `/404.html` | A visitor following an unavailable link | Recover from an unavailable page. | Return home or inspect assessment options. |
| `/about/` | A sponsor or diligence reader | Explain the founder perspective and operating commitments. | Inspect the assessment or discuss a system. |
| `/agda/` | A prospective buyer and technical reviewer | Explain what the full assessment examines and returns. | Inspect the sample, then discuss scope. |
| `/contact/` | A system owner or sponsor making an enquiry | Make a confidential enquiry with minimal friction. | Send an enquiry or use the existing email contact. |
| `/glossary/` | A reader looking for a precise definition | Find a canonical definition and its detailed explanation. | Read the term page or assessment. |
| `/` | An accountable sponsor or system owner | Explain the category, show the assessment and help a buyer choose a next step. | Discuss a system or inspect AGDA® and the sample. |
| `/insights/accountability-theatre/` | An accountable executive or control owner | Explain an intervention failure pattern for accountable readers. | Inspect assessment output or the related category component. |
| `/insights/coincidence-is-not-a-margin/` | A risk or assurance reader interpreting a quiet history | Explain an intervention failure pattern for accountable readers. | Inspect assessment output or the related category component. |
| `/insights/` | An accountable reader exploring failure patterns | Explain an intervention failure pattern for accountable readers. | Inspect assessment output or the related category component. |
| `/insights/the-thirty-six-hour-window/` | A board or operational reader examining escalation delay | Explain an intervention failure pattern for accountable readers. | Inspect assessment output or the related category component. |
| `/intervention-readiness/category-map/` | A risk or assurance reader comparing disciplines | Define the category or one of its components precisely. | Read a related component or inspect the assessment. |
| `/intervention-readiness/halt-authority/` | A system or control owner locating authority | Define the category or one of its components precisely. | Read a related component or inspect the assessment. |
| `/intervention-readiness/human-oversight/` | An oversight or control owner | Define the category or one of its components precisely. | Read a related component or inspect the assessment. |
| `/intervention-readiness/` | A reader learning the category | Define the category or one of its components precisely. | Read a related component or inspect the assessment. |
| `/intervention-readiness/intervention-chain/` | An operational or technical reader | Define the category or one of its components precisely. | Read a related component or inspect the assessment. |
| `/intervention-readiness/reversibility-window/` | A reader examining timing and reversibility | Define the category or one of its components precisely. | Read a related component or inspect the assessment. |
| `/intervention-readiness/vs-ai-governance/` | A risk or assurance reader comparing disciplines | Distinguish the category from the named adjacent discipline. | Inspect how AGDA® assesses it and the sample. |
| `/intervention-readiness/vs-audit/` | A risk or assurance reader comparing disciplines | Distinguish the category from the named adjacent discipline. | Inspect how AGDA® assesses it and the sample. |
| `/intervention-readiness/vs-compliance/` | A risk or assurance reader comparing disciplines | Distinguish the category from the named adjacent discipline. | Inspect how AGDA® assesses it and the sample. |
| `/intervention-readiness/vs-operational-resilience/` | A risk or assurance reader comparing disciplines | Distinguish the category from the named adjacent discipline. | Inspect how AGDA® assesses it and the sample. |
| `/intervention-readiness/vs-risk-management/` | A risk or assurance reader comparing disciplines | Distinguish the category from the named adjacent discipline. | Inspect how AGDA® assesses it and the sample. |
| `/legal/gdpr/` | A data subject or enquiry sender | Explain the existing policy or terms without changing their meaning. | Find a section or contact Intervene. |
| `/legal/privacy/` | A visitor or enquiry sender | Explain the existing policy or terms without changing their meaning. | Find a section or contact Intervene. |
| `/legal/terms/` | A visitor or prospective client | Explain the existing policy or terms without changing their meaning. | Find a section or contact Intervene. |
| `/method/` | A reader following an existing method link | Explain the public methodology, evidence constraints and documented limits. | Inspect the constructed sample; /method/ remains a redirect. |
| `/methodology/` | An engineering, risk or diligence reader | Explain the public methodology, evidence constraints and documented limits. | Inspect the constructed sample; /method/ remains a redirect. |
| `/network/` | An experienced practitioner | Explain practitioner participation and its commercial boundaries. | Start the existing direct conversation. |
| `/readiness-snapshot/` | A visitor with an existing demonstration link | Retain the withdrawn worked-example functionality and privacy boundaries. | Remain unpromoted and noindex; no new conversion path. |
| `/sample-report/` | A buyer or technical reader inspecting the output | Inspect the existing constructed retail-credit illustration and its limits. | Read the methodology or discuss a system. |
| `/sectors/` | A sponsor considering sector applicability | Explain the initial financial-services focus and relevant sector contexts. | Discuss a system or inspect the sample. |
| `/services/` | A buyer comparing engagements | Compare scope, outputs, decisions and indicative fees. | Discuss one system and evidence access. |
| `/style-guide/` | A site maintainer | Document and exercise the shared presentation system. | Remain internal and noindex. |
| `/verify/` | An audit or technical reader checking integrity | Explain what signatures establish and exclude. | Inspect the sample or discuss record access. |

## Protected content and systems

Do not change assessment algorithms, rubrics, evidence evaluation, report semantics, verification mechanisms, cryptography, commercial terms, regulatory interpretations, legal policy text, production configuration or integrations. Keep all routes, the redirect and withdrawn Snapshot functionality. Add no dependencies and do not commit, push or deploy.

## Implemented changes

- Rebuilt the homepage into six sections: question, problem, method, evidence, engagement and decision. The primary invitation is to discuss a system; the secondary hero link leads directly to the assessment.
- Replaced the small SEDI treatment with a shared native stage explorer on the homepage and methodology page, also exercised in the internal style guide. Each disclosure shows the existing public capability question, evidence examples, possible failure and consequence. It works without JavaScript and exposes no protected rubric.
- Made the existing constructed finding visible before interaction. The additional scope and limitations remain in a native disclosure, and closing it leaves the finding visible. Timings remain separate, the fourth stage remains unassessed, and no total response time is computed.
- Expanded the homepage engagement comparison with the canonical buyer decision and evidence scope. The full commercial sheets retain their aligned rows, fees, boundaries, timetable and availability qualifications.
- Added desktop section indexes and a mobile native contents disclosure to articles and policies. Heading targets are generated at build time without changing policy wording. Prose fills its allocated column naturally.
- Made mobile reference navigation a compact, horizontally scrollable list. Added term and sector indexes, report links into evidence, finding, decision and limitations, and clearer assessment/sample destinations from component and comparison pages.
- Clarified the Network's practitioner purpose and retained its participation, commercial and confidentiality boundaries. Removed an unconditional product-independence description while retaining the commercial firewall.
- Aligned the quiet-history article's introductory framing with the existing qualified methodology statement. Its engine and evidence-grading discussion is unchanged.
- Added the approved integrity qualification alongside signing and verification explanations. The more specific existing signature exclusions remain visible.
- Reused supporting type scales, kept sentence-case headings and natural wrapping, removed header blur, and kept the established button, link and focus treatments. Native blue touch highlighting is replaced by the existing bronze pressed and selected states.
- Used the approved full AGDA® wordmark on the narrowest phones where the stacked lockup cannot meet its minimum width. Desktop and larger-phone lockups are retained.
- Shortened the overlength metadata descriptions. Existing titles, canonical URLs, OG artwork, structured data, robots and sitemap behaviour are preserved.

All rendered page types receive the shared refinements, including the recovery page and withdrawn demonstration. `/method/` remains a redirect. No route or functionality was removed.

## Validation

Final checks against the production preview on 10 October 2026:

- `npm run typecheck`: zero errors, warnings or hints across 113 files.
- `npm test`: 118 passing unit tests.
- `npm run content-check`: clean.
- `npm run build`: successful static build of 33 pages.
- Full Chromium desktop/mobile suite: 278 passed, two intentional mobile skips.
- Full desktop Safari, mobile Safari and desktop Firefox suites: 418 passed, two intentional mobile skips.
- All 33 routes checked at 320, 375, 768, 1024, 1440 and 1920 pixels: no document overflow, clipped tested headings or prices, consent-obstructed primary actions, or JavaScript errors.
- WCAG 2 A/AA, 2.1 AA and 2.2 AA tagged axe scans on every route at 375 and 1440 pixels: no reported violations. Sixteen additional scans with the native disclosures expanded at 320, 375, 768 and 1440 pixels also report no violations or document overflow. These are automated results, not a conformance certification.
- Rendered desktop and mobile route inspection, plus detailed checks of expanded SEDI stages, the evidence demonstration, engagement alignment, reading navigation, signature coverage and the narrow-phone logo.
- All fragment destinations and visible images resolve. Page titles, canonical URLs and robots directives match the baseline, and all descriptions are within 155 characters.
- Rendered policy paragraphs and lists match the baseline. The two other article bodies match it; the quiet-history article changes only the intended opening framing and statement, with its technical explanation retained.
- Protected commercial data, canonical definitions, form handlers, Snapshot logic, legal source text, public assets, metadata layout and motion code are unchanged. No dependency or deployment configuration changed; no browser JavaScript or hydration was added for the new interactions.
- `git diff --check`: clean.

Visible homepage paragraph copy falls from 530 to 397 words, approximately 25% less using the same desktop visibility/counting rule. This measures explanatory paragraphs, not total homepage words: the now-visible finding and additional comparison fields deliberately make more product information available.

## Remaining boundaries

The demonstration is still a constructed, unsigned example. No approved issued client artefact was found in the website assets. A real client demonstration needs an approved, sanitised artefact and appropriate publication permission; the refinement does not manufacture one.

Protected methodological, legal and commercial material remains in place. No conversion uplift, production performance uplift or regulatory acceptance is claimed. The form integration is covered by the existing mocked browser checks; no real enquiry was sent.

Changes remain local and uncommitted. No push or production deployment was performed.


## Motion refinement follow-up

This follow-up extends the motion system after the website refinement recorded above.

- Added finite, eight-pixel opening motion to page headings and introductory copy. Headings remain opaque throughout; primary hero actions do not wait for an entrance.
- Added one-time staggered entrances to the homepage problem rows and public SEDI stages, using the existing motion tokens.
- Replaced the disclosure fade with shared 220ms height expansion and collapse for SEDI explanations, homepage scope detail, services detail and mobile reading contents. Repeated input reverses from the visible height. Summary focus remains outside the clipped body; closing content is temporarily inert.
- Made disclosure indicators transition between their open and closed states. Selected SEDI text and reading links use the existing colour transitions.
- Added three-pixel directional feedback to links with explicit arrows and to linked insight rows, restricted to hover-capable pointers or keyboard focus and disabled under reduced motion.
- Made focus reveal every containing entrance group immediately. Disclosure content settles before focus or link activation, on resizing, before printing and when motion preference changes.
- Made live reduced-motion changes reveal all content immediately, without the global short interface transition interpolating hidden sections. Browsers without animation or inert support keep native disclosure behaviour. All disclosures remain usable with JavaScript disabled.
- Retained the existing evidence-diagram timing, numerical labels and qualifications. No animated totals, outcome simulation or repeating decorative effects were added. Brand assets, primary and secondary button treatments, protected assessment logic, commercial terms and integrations remain unchanged.

Implementation is in the shared motion runtime and global stylesheet, with markup and state cues in `SediExplorer`, `ReadingNav`, `InsightCard`, the homepage, services and internal style guide. Browser coverage is in `tests/e2e/motion-enhancements.spec.ts`; existing design-system and reading-navigation checks now verify immediate focus visibility and settled native contents.

Follow-up validation:

- Static build: 33 pages; type checking reports no errors, warnings or hints. All 118 unit tests and the content check pass.
- Complete Chromium desktop/mobile suite: 298 passed, two intentional mobile skips.
- Complete desktop Safari, mobile Safari and desktop Firefox suites: 448 passed, two intentional mobile skips.
- Twenty-four additional expanded-state accessibility and overflow scans across Chromium, Safari and Firefox, on the homepage, methodology, services and terms pages at 320px and 1440px: no reported violations or document overflow after animations settle. Early scans sampled text mid-fade; the completed scans wait for finite animations to finish.
- Browser coverage includes rapid reversal, open/close cleanup, resize, focused contents navigation, live reduced-motion changes, JavaScript-disabled operation and unavailable animation/inert support. Visual checks cover the homepage and expanded SEDI layouts on desktop and narrow mobile screens.
- Protected sources, public assets, dependencies and deployment configuration have no changes in this follow-up. `git diff --check` is clean. Changes remain local and uncommitted; no push or deployment was performed.
