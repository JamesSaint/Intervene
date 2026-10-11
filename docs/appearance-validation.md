# Adaptive appearance validation

Light, Dark and System are implemented across the shared Astro presentation. System is the default. Validation used the production build on 11 October 2026, served at `http://127.0.0.1:4399`.

## Behaviour

A synchronous, dependency-free script in the document head reads `intervene:appearance` from localStorage and resolves the effective appearance before the body is parsed. Missing or invalid values resolve to System. The root carries the effective `data-theme` and the chosen `data-appearance` separately.

System follows live `prefers-color-scheme` changes. Explicit Light and Dark override the operating system. Choices persist across reloads and navigation, synchronise between tabs and refresh on history restoration. Storage exceptions are caught. When storage is blocked, the initial appearance follows System and a manual selection remains usable for the current document.

CSS follows the operating system without JavaScript. Appearance controls are hidden, the navigation has a footer-menu fallback, enquiry forms retain their native POST action and SEDI explanations remain readable. The existing interactive readiness questionnaire still requires JavaScript and retains its existing no-script explanation.

The desktop control uses a monochrome sun or moon and a small three-option disclosure. The same options sit in the mobile takeover menu. Buttons expose `aria-pressed`, a status region announces the preference and the resolved System appearance is visible. Controls are keyboard accessible and at least 44px high.

## Design and brand integrity

The palette follows the approved Intervene / AGDA brand kit v3.0.0, dated 10 October 2026. Source: `~/My Drive/business/intervene/brand/brand/BRAND.md` and `brand.tokens.json`. Existing site typography, spacing and geometry are preserved, including the site heading treatment retained under the kit's decision D14.

Light uses White, Ink, the approved light neutrals and accessible Gold Text. Logo registrations retain AGDA Gold. Light controls and SEDI signals use contrasting approved colours. Dark retains the established site palette. Semantic tokens cover surfaces, text, lines, controls, focus, selected states, fields, validation, evidence, verdicts and SEDI signals.

All six AGDA SVG variants in use match the supplied masters byte for byte: the primary and reverse logos, black and white small wordmarks and ink and white stacked lockups. The Intervene inline SVG path matches the approved master geometry. No logo filters, redraws or generated replacements are used. Existing OG cards and static metadata artwork are preserved.

Appearance transitions use 220ms on bounded colour properties. Reduced-motion appearance changes are immediate. Appearance updates do not reinitialise motion or change layout properties. The head script is 3,291 bytes before compression and 1,119 bytes with gzip. No new dependencies, cookies or server state are introduced.

## Verification

| Check | Result |
|---|---|
| Production build | Passed, 33 generated pages: 32 content pages and the existing `/method/` redirect |
| Astro check | Passed, zero errors, warnings or hints |
| Unit tests | 130 passed across nine files |
| Content check and patch whitespace check | Passed |
| Full Chromium desktop and mobile suite | 429 passed, three device-specific skips |
| Appearance suite | 162 passed across Chromium, Firefox and WebKit at 390px, 768px and 1440px |
| Motion reliability suite | 75 passed across the three engines at 390px and 1440px; three desktop-only touch-test skips |
| WCAG A/AA automated scans | Zero violations on the principal pages, open selectors and mocked enquiry failure states in both appearances |
| Non-text contrast | Control boundaries, hover/focus colours, selected indicators and SEDI signals meet at least 3:1 in both appearances |
| Production-route checks | All 32 content routes checked in both appearances in all nine browser/viewport combinations; no console errors, broken visible images or clipped content |
| Responsive regression | Existing all-route checks passed at 320, 375, 430, 768, 1024, 1440 and 1920px |
| Appearance resolution | Stored Dark observed at body parsing with a Light system setting; paint, favicon and browser theme colour checked |
| Motion preservation | Opening start counts, advancing SEDI timelines, selected outcome and hero geometry checked across theme changes |

The appearance suite also verifies explicit overrides, reload and navigation persistence, return to System, live system changes, invalid values, blocked storage, cross-tab updates, keyboard selection, Escape focus recovery and no-script presentation. Enquiry failure responses are mocked; no live enquiries are sent.

Commands:

```sh
npm run build
npm run typecheck
npm test
npm run content-check
PW_PORT=4399 npx playwright test --workers=3
PW_PORT=4399 npx playwright test --config playwright-appearance.config.ts
PW_PORT=4399 npx playwright test --config playwright-motion.config.ts
git diff --check
```

## Visual review

The comparison gallery is [review.html](../.playwright/appearance-review/review.html). It contains 36 screenshots of the homepage, AGDA page, sample verdict, enquiry page, selector, SEDI diagram and component details in Light and Dark at desktop and mobile sizes.

Rendered screenshots were inspected, including both homepage appearances, navigation controls, SEDI signals, the report cover, enquiry fields and AGDA branding. Component crops move the sticky header out of the way for an unobstructed view. Full-page and selector captures retain the production navigation.

Regenerate with the production preview running:

```sh
npm run preview -- --host 127.0.0.1 --port 4399
node scripts/capture-appearance.mjs
```

Screenshots and browser logs stay in the existing ignored `.playwright/` directory. The capture script and tests are committed so the review can be reproduced.

## Limits

Browser tests use real browser engines with emulated viewports, touch and appearance preferences. Physical-device checks and a manual screen-reader audit were not performed. Automated scans and keyboard checks are evidence of the tested states, not a complete accessibility certification.

A preference cannot persist between documents if the browser blocks localStorage. The interface remains usable and defaults to System on a fresh document in that case.

The existing `/method/` stub redirects to the themed methodology page. It remains a redirect rather than a second presentation route. No push or deployment is part of this work.

## Files changed

- `playwright-appearance.config.ts`
- `public/assets/brand/agda-by-intervene-stacked-ink.svg`
- `public/assets/brand/agda-primary.svg`
- `public/assets/brand/agda-small-black.svg`
- `scripts/capture-appearance.mjs`
- `src/components/AgdaLogo.astro`
- `src/components/AppearanceControl.astro`
- `src/components/ChainCeiling.astro`
- `src/components/EvidenceCap.astro`
- `src/components/FindingChain.astro`
- `src/components/Footer.astro`
- `src/components/Header.astro`
- `src/components/InsightCard.astro`
- `src/components/InterventionWindow.astro`
- `src/components/LinkedInButton.astro`
- `src/components/OfferChoice.astro`
- `src/components/ReadingNav.astro`
- `src/components/SediExplorer.astro`
- `src/components/TakeoverMenu.astro`
- `src/components/VerdictBlock.astro`
- `src/components/XButton.astro`
- `src/components/snapshot/BenchmarkControl.astro`
- `src/components/snapshot/FollowUpForm.astro`
- `src/components/snapshot/SnapshotForm.astro`
- `src/components/snapshot/SnapshotResult.astro`
- `src/layouts/BaseLayout.astro`
- `src/layouts/InsightLayout.astro`
- `src/layouts/LegalLayout.astro`
- `src/lib/appearance.ts`
- `src/lib/marks.ts`
- `src/pages/index.astro`
- `src/pages/intervention-readiness/index.astro`
- `src/pages/network/index.astro`
- `src/pages/services/index.astro`
- `src/pages/style-guide/index.astro`
- `src/styles/forms.css`
- `src/styles/global.css`
- `src/styles/reset.css`
- `src/styles/tokens.css`
- `src/styles/typography.css`
- `tests/e2e/appearance.spec.ts`
- `tests/e2e/contact-parity.spec.ts`
- `tests/e2e/design-system.spec.ts`
- `tests/e2e/interface-polish.spec.ts`
- `docs/appearance-validation.md`
