# Intervene

![Status](https://img.shields.io/badge/status-active-111111?style=flat-square)
![Identity](https://img.shields.io/badge/identity-Intervene_v2_2026-111111?style=flat-square)
![Stack](https://img.shields.io/badge/stack-Astro_+_Inter-111111?style=flat-square)
![Hosting](https://img.shields.io/badge/hosting-GitHub_Pages-111111?style=flat-square)

## Overview

Intervene Limited defines and measures **Intervention Readiness** for consequential AI and automated systems. The practice answers a question most governance frameworks leave untested: **can your organisation detect, escalate, decide, and intervene before harm becomes irreversible?**

The site is the public face of the practice. Methodology, services, sample report, and contact path. Built as a static-output Astro site to match the editorial restraint of the Intervene brand: monochrome, typographic, instrument-grade.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Astro](https://astro.build) 4.x, `output: 'static'`, `trailingSlash: 'always'` |
| Type | Inter (sans, 400 / 500), JetBrains Mono (sparingly) |
| Colour | Strict monochrome. Ink `#111`, paper `#fff`, hairline `#e6e6e6`, muted `#6b6b6b`. Signal red `#c8322a` reserved for the sample report |
| Forms | [Formspree](https://formspree.io) for the contact form |
| Hosting | GitHub Pages via GitHub Actions, served at `https://jamessaint.github.io/Intervene/` |

## Site map

```
/                       Home. Hero rotator, chain diagram, window timeline, services, CTA
/method/                AGDA™ methodology. Chain, eight dimensions, evidence cap, ceiling, attestation
/services/              Five tiers, four engagement shapes, commercial frame
/sample-report/         Redacted Failure Exposure Report, 13 sections, cover with attestation envelope
/about/                 Founder, why this exists, four commitments, sectors, what we are not
/contact/               Confidential discussion form. Posts to Formspree
/legal/terms/           Terms and conditions
/legal/privacy/         Privacy policy
/legal/gdpr/            UK GDPR statement
/style-guide/           Internal style guide. Noindex
```

All routes use trailing slashes. All pages currently carry `noindex, nofollow` while the redesign is in preview.

## Source layout

```
.
├── astro.config.mjs            site, base, trailingSlash, output
├── package.json
├── tsconfig.json
├── public/                     Static assets copied verbatim to the build root
│   ├── assets/                 Favicons, OG image, founder portrait
│   └── robots.txt
├── src/
│   ├── pages/                  File-based routing
│   │   ├── index.astro
│   │   ├── method/index.astro
│   │   ├── services/index.astro
│   │   ├── sample-report/index.astro
│   │   ├── about/index.astro
│   │   ├── contact/index.astro
│   │   ├── style-guide/index.astro
│   │   └── legal/{terms,privacy,gdpr}.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro    Wraps every page. Head, Header, TakeoverMenu, Footer
│   │   └── LegalLayout.astro   Reading column for legal pages
│   ├── components/
│   │   ├── Header.astro        Sticky, logo + animated hamburger
│   │   ├── TakeoverMenu.astro  Full-screen nav, focus trap, Esc, inert
│   │   ├── MenuIcon.astro      Three-line icon that morphs to X
│   │   ├── Footer.astro
│   │   ├── Logo.astro          Two-panel mark + Inter wordmark
│   │   ├── ChainFlow.astro     Animated four-stage chain rail
│   │   ├── ChainCeiling.astro  Bar chart, ghost claim + capped actual
│   │   ├── EvidenceCap.astro   Stepped bar diagram with axis ticks
│   │   └── ScopeBar.astro      Three patterns: focused, recurring, continuous
│   ├── lib/
│   │   ├── reveal.ts           IntersectionObserver scroll-reveal
│   │   ├── hero-rotator.ts     Crossfade hero, 7s interval, pauses on hidden tab
│   │   └── contact.ts          Contact form submission to Formspree
│   └── styles/
│       ├── tokens.css          CSS custom properties
│       ├── fonts.css           Inter + JetBrains Mono via Google Fonts
│       ├── reset.css
│       ├── typography.css      Type utilities (.h1, .h2, .lede, .body, .mono)
│       └── global.css          Layout primitives, reveal, buttons
├── .github/
│   └── workflows/
│       └── deploy.yml          npm ci, npm run build, deploy-pages
└── internal/                   Gitignored. Private corporate documents
```

## Brand discipline

The Intervene identity is strict by design.

- **One italic accent per headline.** No more, no less.
- **No kickers or numbering scaffolds.** No `§ 01`, no `D · 01`, no "Volume 01" meta rows.
- **No decorative imagery.** The founder portrait is the only photograph.
- **No mailto links.** All inbound routes through the contact form at `/contact/`.
- **No em dashes in prose.** Periods, semicolons, commas, or full stops do the work.

Voice is board-grade. Calm, authoritative, concrete. Specificity over abstraction. Consequence over reassurance.

## Local development

```bash
git clone https://github.com/JamesSaint/Intervene.git
cd Intervene
npm install
npm run dev
```

Dev server runs at `http://localhost:4321/Intervene/` (the base path matches the deployed URL).

```bash
npm run build       # builds to ./dist
npm run preview     # serves ./dist locally
```

## Deployment

Push to `main`. GitHub Actions runs `.github/workflows/deploy.yml` which builds the static site and deploys to GitHub Pages. ~45 seconds from push to live.

Repo settings required:
- **Settings → Pages → Source:** GitHub Actions
- **Settings → Pages → Custom domain:** none (served from `jamessaint.github.io/Intervene/`)

## Forms

The contact form at `/contact/` posts JSON to `https://formspree.io/f/xvzwdyob`. The endpoint is referenced in `src/pages/contact/index.astro` as `FORMSPREE_ENDPOINT`. To rotate, change the constant and push.

## License

All content is proprietary to **Intervene Limited**. AGDA™ is a trademark of Intervene Limited. Viewing is permitted. Reuse, reproduction, or redistribution is not permitted without explicit written consent.
