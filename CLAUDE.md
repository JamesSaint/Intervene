# CLAUDE.md

@AGENTS.md

## Text flow and content width (mandatory)

Every page, component and content change follows `docs/design-standards.md`. Text fills the column its layout gives it. Arbitrary wrapping, unnecessary width restrictions and unused content space are defects, not style. No `text-wrap: balance` or `pretty`, no `ch` or fixed-width caps on text, no reading measures built from grid tracks, no `<br>` or forced breaks in copy, one shared left edge per section. Any intentional restriction carries `text-flow-exception: <reason>` on the same line. Fix shared CSS rather than adding page overrides. Before presenting layout or copy changes, run `npm run check-text-flow` and `npx playwright test tests/e2e/text-flow.spec.ts --project=desktop`, then inspect screenshots at 320, 390, 768, 1024, 1280, 1440 and 1920px in light and dark appearance.
