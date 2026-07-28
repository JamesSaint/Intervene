# Intervene

![Status](https://img.shields.io/badge/status-active-111111?style=flat-square)
![Identity](https://img.shields.io/badge/identity-Intervene_AGDA-111111?style=flat-square)
![Stack](https://img.shields.io/badge/stack-Astro_4-111111?style=flat-square)
![Hosting](https://img.shields.io/badge/hosting-GitHub_Pages-111111?style=flat-square)

## Overview

Intervene Limited defines and measures **Intervention Readiness**: the ability of an organisation to detect, escalate, decide and intervene before harm becomes irreversible.

The public site introduces the category, explains **AGDA™** as the deterministic assessment instrument, publishes the core vocabulary, and provides sample evidence for a formal SEDI verdict and signed regulator-bundle verification path.

Canonical site: `https://intervene.uk/`

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Astro](https://astro.build) 4.x, `output: 'static'`, `trailingSlash: 'always'` |
| Runtime | Node.js 22 in GitHub Actions |
| Type | Montserrat for interface and editorial copy, JetBrains Mono for proof marks and technical fragments |
| Theme | Dark advisory surface, warm text hierarchy, muted gold accent, restrained verdict colours |
| Forms | [Formspree](https://formspree.io) contact endpoint |
| Hosting | GitHub Pages via GitHub Actions |

## Public Information Architecture

```text
/                                   Home
/intervention-readiness/             Category definition and core concept
/intervention-readiness/intervention-chain/
/intervention-readiness/reversibility-window/
/intervention-readiness/halt-authority/
/intervention-readiness/human-oversight/
/intervention-readiness/category-map/
/intervention-readiness/vs-ai-governance/
/intervention-readiness/vs-compliance/
/intervention-readiness/vs-audit/
/intervention-readiness/vs-risk-management/
/intervention-readiness/vs-operational-resilience/
/agda/                              AGDA™ instrument page
/methodology/                       How AGDA™ measures Intervention Readiness
/sample-report/                     Redacted sample AGDA™ verdict
/services/                          Levels of assurance and engagement shape
/sectors/                           Where Intervention Readiness matters
/insights/                          Evidence notes index
/insights/accountability-theatre/
/insights/coincidence-is-not-a-margin/
/insights/the-thirty-six-hour-window/
/glossary/                          Defined terms
/verify/                            Verdict verification model
/about/                             Founder and practice rationale
/contact/                           Confidential discussion form
/legal/terms/                       Terms and conditions
/legal/privacy/                     Privacy policy
/legal/gdpr/                        UK GDPR statement
/style-guide/                       Internal style guide, noindex
```

`/method/` is retained as a noindex redirect stub to `/methodology/`.

## Search And Schema

- Routes default to `index, follow`; pages opt out with the `noindex` prop.
- `public/robots.txt` allows the site and disallows `/style-guide/`.
- `@astrojs/sitemap` excludes the style guide, legal pages, and the legacy `/method/` redirect.
- `BaseLayout.astro` emits JSON-LD for the organisation, founder, website, breadcrumb trail, AGDA™, Intervention Readiness, and the defined-term set.
- `public/llms.txt` mirrors the canonical category definitions and page relationships for LLM and crawler consumption.

## Source Layout

```text
.
├── astro.config.mjs               Site URL, sitemap filters, static output
├── package.json
├── package-lock.json
├── public/
│   ├── assets/                    Favicons, Open Graph image, founder portrait
│   ├── CNAME                      GitHub Pages custom domain
│   ├── llms.txt                   LLM-readable canonical summary
│   └── robots.txt
├── src/
│   ├── components/                Header, menu, logo, proof marks, diagrams, cards
│   ├── layouts/                   Base, legal, hub, insight, comparison layouts
│   ├── lib/                       Terms, AGDA mark rendering, reveal, contact form
│   ├── pages/                     File-based routes listed above
│   └── styles/                    Tokens, fonts, reset, typography, global rules
├── .github/workflows/deploy.yml   Build and deploy to GitHub Pages
├── internal/                      Private source material, not public site copy
└── skills/                        Local project skills and supporting scripts
```

## Brand Discipline

The Intervene site is intentionally restrained.

- Use one italic accent per major headline when the local page pattern calls for it.
- Keep copy board-grade: calm, concrete, and specific.
- Avoid decorative imagery. The founder portrait and Open Graph artwork are the only current bitmap brand assets.
- Do not add mailto links. Inbound contact routes through `/contact/`.
- Preserve the intervention vocabulary exactly where it is canonical: `src/lib/terms.ts`, `public/llms.txt`, glossary copy, metadata, and schema must not drift.
- Avoid em dashes in prose. Use periods, semicolons, commas, or full stops.

## Local Development

```bash
git clone https://github.com/JamesSaint/Intervene.git
cd Intervene
npm ci
npm run dev
```

The dev server runs at `http://localhost:4321/`. Production is served from the custom domain root.

```bash
npm run build          # builds the static site to ./dist
npm run preview        # serves the built site locally
npm test               # unit tests (vitest)
npm run test:e2e       # browser tests (playwright)
npm run content-check  # Snapshot copy and vocabulary checks
npm run typecheck      # astro check. Advisory only, see below
```

`npm run build` runs `prebuild` first, which regenerates `public/question-manifest.json` from the Snapshot question set. Commit the regenerated manifest when the question set changes.

`npm run typecheck` reports 59 pre-existing errors in `TakeoverMenu.astro`, `FilmPlayer.astro`, `ConsentBanner.astro` and `BaseLayout.astro`. They predate the Snapshot work and are not fixed by it, so typecheck runs advisory in CI rather than blocking. Clear them before making it a gate.

## Deployment

Push to `main`, or trigger the workflow manually. GitHub Actions runs `.github/workflows/deploy.yml`:

1. Check out the repo.
2. Install dependencies with `npm ci`.
3. Run `npm run content-check` and `npm test`. Either failing blocks the deploy.
4. Build with `npm run build`, which regenerates the question manifest first.
5. Upload `./dist`.
6. Deploy to GitHub Pages.

`.github/workflows/content-checks.yml` runs the same checks on pull requests, plus a staleness check on the question manifest.

Repo settings required:

- **Settings -> Pages -> Source:** GitHub Actions
- **Settings -> Pages -> Custom domain:** `intervene.uk`

## Forms

The contact form at `/contact/` posts JSON to `https://formspree.io/f/xvzwdyob`. The endpoint is declared as `FORMSPREE_ENDPOINT` in `src/pages/contact/index.astro`.

Field, choice, error and status styles live in `src/styles/forms.css` and are shared by the contact form and the Snapshot. Do not re-declare them in a page. `tests/e2e/contact-parity.spec.ts` guards the contact form against regressions from that extraction.

## Intervention Readiness Snapshot

`/readiness-snapshot/` is a self-reported triage instrument. It is **not** an AGDA™ assessment and no copy may imply that it is.

**Current state: Phase 1 of 4.** The route is `noindex`, excluded from the sitemap, and unlinked from any navigation. There is no backend, no network call and no data collection of any kind. The result is rendered server side; reviewers reach any of the sixteen combinations with `?preview=<area>-<basis>`, for example `/readiness-snapshot/?preview=decide-documented`.

Two rules govern the code:

1. **No part of the Snapshot Response Model may enter this repository.** No ordinal values, thresholds, weights, bands or tie-breaking rules. Those live only in the private Worker repository. `tests/unit/prototype-result.test.ts` asserts this and the e2e suite asserts it against the built bundle.
2. **No figure is shown to the visitor.** No score, percentage, grade, rating, maturity level or per-area value. Permitted numerals are the question counter, the model version and the generation date.

Phase 1 files marked `PHASE 1 ONLY` are deleted in Phase 2: `src/lib/snapshot/prototype-result.ts` and `src/lib/snapshot/prototype-preview.ts`.

Phases 2 to 4 add a Cloudflare Worker at `api.intervene.uk`, transactional email, the Index contribution path and the public launch. They need accounts and secrets that do not exist yet. The full plan governs sequencing and gates.

## License

All content is proprietary to **Intervene Limited**. AGDA™ is a trademark of Intervene Limited. Viewing is permitted. Reuse, reproduction, or redistribution is not permitted without explicit written consent.
