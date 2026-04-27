# Intervene

![Status](https://img.shields.io/badge/status-active-111111?style=flat-square)
![Identity](https://img.shields.io/badge/identity-Intervene_v2026-111111?style=flat-square)
![Stack](https://img.shields.io/badge/stack-HTML_+_CSS_+_vanilla_JS-111111?style=flat-square)
![Hosting](https://img.shields.io/badge/hosting-static-111111?style=flat-square)

## Overview

Intervene Group Ltd is an independent advisory practice for high-stakes decisions on consequential AI and operational systems. The practice answers a question most governance frameworks leave untested: **can your organisation detect, escalate, decide, and intervene before failure becomes irreversible?**

The site is the public face of the practice — methodology, services, sample report, and contact path. It is built as a single static HTML/CSS bundle to match the editorial restraint of the Intervene brand: monochrome, typographic, instrument-grade.

## Site Architecture

```
/
├── index.html                   Home — positioning, services, authority chain
├── method.html                  AGDA methodology — chain, dimensions, capping, attestation
├── services.html                Five tiers, four engagement shapes, MSA frame
├── sample-report.html           Redacted Failure Exposure Report — full 13 sections
├── about.html                   Founder, stance, sectors, what we are not
├── contact.html                 Confidential discussion form
├── terms.html                   Terms & conditions
├── privacy.html                 Privacy policy
├── gdpr.html                    UK GDPR statement
├── intervene-brand-sheet.html   Internal brand reference (noindex)
├── intervene-logo.html          Logo construction reference (noindex)
├── intervene.css                Master design system
├── intervene.js                 Nav, reveals, contact form
├── robots.txt
├── sitemap.xml
└── assets/
    ├── images/
    │   ├── favicons/            Favicon set + webmanifest
    │   ├── logo/                Legacy HIA logo variants (kept for reference)
    │   ├── linkedin/            Social-format brand assets
    │   └── james-saint.jpg      Founder portrait
    └── og/
        └── og-home.png          Open Graph image (1200×630)
```

## Brand & Design

The Intervene identity is strict by design.

| Token | Value |
| --- | --- |
| Ink | `#111111` |
| Paper | `#FFFFFF` |
| Paper Soft | `#FAFAFA` |
| Hairline | `#E6E6E6` |
| Muted | `#6B6B6B` |
| Warn (rare) | `#C8322A` |
| Sans | Inter (400 / 500) |
| Mono | JetBrains Mono (400 / 500) |
| Container | 1280px max · 64px gutter |

- **Logo** — A two-panel mark (mirrored trapezoidal panels with an 18% diagonal cut, top and bottom) sitting left of an `intervene` wordmark in Inter Medium with -0.055em tracking. Both render in CSS — no image assets required.
- **Voice** — Board-grade. No em-dashes, no exclamation marks. Calm, authoritative, concrete. One italic accent per headline.
- **Discipline** — No tints, no gradients, no decorative imagery. Restraint is the brand.

Full token reference: `intervene-brand-sheet.html`. Logo construction: `intervene-logo.html`.

## SEO & Metadata

Every public page includes:

- Unique `<title>` and meta description
- Canonical URL pointed at `intervene.group`
- `index, follow` on public pages; `noindex, nofollow` on legal and brand reference pages
- Full Open Graph and Twitter card tags
- JSON-LD structured data (Organization, WebSite) on the home page
- Favicon set and webmanifest

OG images live in `assets/og/` and should be 1200×630 PNG.

## Local Development

```bash
git clone https://github.com/JamesSaint/Intervene.git
cd Intervene
```

Open any HTML file directly in a browser — there is no build step. For live reload during development, any static server works:

```bash
npx serve .
```

## Deployment

Push to `main`. Site publishes automatically via GitHub Pages. When the custom domain `intervene.group` is configured, no further URL changes are required — canonical, OG, and sitemap URLs are already pointed at it.

## License

All content is proprietary to **Intervene Group Ltd**. AGDA™ a trademark of Intervene Group Ltd. Viewing is permitted. Reuse, reproduction, or redistribution is not permitted without explicit written consent.
