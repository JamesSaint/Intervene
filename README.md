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
npm run build       # builds the static site to ./dist
npm run preview     # serves the built site locally
```

## Deployment

Push to `main`, or trigger the workflow manually. GitHub Actions runs `.github/workflows/deploy.yml`:

1. Check out the repo.
2. Install dependencies with `npm ci`.
3. Build with `npm run build`.
4. Upload `./dist`.
5. Deploy to GitHub Pages.

Repo settings required:

- **Settings -> Pages -> Source:** GitHub Actions
- **Settings -> Pages -> Custom domain:** `intervene.uk`

## Forms

The contact form at `/contact/` posts JSON to `https://formspree.io/f/xvzwdyob`. The endpoint is declared as `FORMSPREE_ENDPOINT` in `src/pages/contact/index.astro`.

## License

All content is proprietary to **Intervene Limited**. AGDA™ is a trademark of Intervene Limited. Viewing is permitted. Reuse, reproduction, or redistribution is not permitted without explicit written consent.
