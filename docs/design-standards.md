# Design standards: text flow and content width

Mandatory for every page, component and content change on the site. Arbitrary text wrapping, unnecessary width restrictions and unused available content space are design defects, not stylistic choices. Any intentional restriction of content width needs a demonstrable layout or readability reason, written beside it.

## The rules

1. **Text fills its column.** Headings, paragraphs, ledes, list items and captions take the full width their layout gives them. The prose measures `--measure-body` and `--measure-lede` in `src/styles/tokens.css` are `100%`; there is no second, character-count cap.
2. **The page frame is the only outer limit.** `.wrap`, `.wrap-narrow` and `.wrap-reading` share one rule in `src/styles/global.css`: `max-width: var(--max)` (1360px) with the site gutters. Do not add narrower containers for text.
3. **Columns are a layout decision, not a measure.** A multi-column grid (heading beside copy, cards in a row, a label column) is legitimate when each column holds content. A grid track, `max-width` or `width` that only narrows text, leaving the space beside it empty, is not. This includes tracks sized in `ch`, in `rem` or from a type token (`calc(var(--type-support) * 37)`).
4. **No balanced or "pretty" wrapping.** Do not use `text-wrap: balance` or `text-wrap: pretty`. Text breaks where the column ends.
5. **No manual line breaks in copy.** No `<br>` in headings, paragraphs or supporting copy, and no spans or `display: block` used to force a break, except as listed under exceptions.
6. **One left edge.** A section's heading, its paragraphs, its actions and its diagram start on the same left edge unless a deliberate two-column composition places them side by side. Do not centre a narrow text block under a full-width heading.
7. **No horizontal overflow** at any width from 320px up.
8. **Change shared rules, not pages.** Fix width and flow in `global.css`, `typography.css` or the shared component. A page-level override is a last resort and needs the same justification as any other restriction.

## Writing an exception

An exception goes on the same line as the declaration or tag, with its reason:

```css
.wd-caption { max-width: 17ch; } /* text-flow-exception: caption sits inside the dial's circular centre and must clear its ring */
```

```astro
<span>Intervention<br />not reached</span>{/* text-flow-exception: diagram terminal label */}
```

`npm run check-text-flow` rejects any restriction without one.

## Current exceptions

| Where | What | Why |
|---|---|---|
| `WindowDial.astro` `.wd-face` | `max-width: 640px` / `608px` | The dial is a drawn instrument with a largest size. |
| `WindowDial.astro` `.wd-caption` | `max-width: 17ch` | The caption sits inside the dial's circular centre and must clear the ring. |
| `WindowDial.astro` `.wd-readout` (721 to 1099px) | `max-width: 640px`, centred | The readout is the dial's key and aligns to the dial face directly above it. |
| `MethodLayers.astro` `svg` | `max-width: 340px` | A drawing, not text. |
| `SeriesCircuit.astro` end label | `<br>` | A diagram terminal label, set `nowrap` and pinned to the end of the circuit. |
| `ChainPosition.astro` `.cp-window .cp-name` (below 560px) | `max-width: 6ch` | A diagram label in a narrow chain cell; two short lines keep it clear of the stage name beside it. |
| `about/index.astro` `.portrait` | `max-width: 360px` | A photograph, not text. |
| Two-tone headings (`em { display: block }` on the homepage, `OfferIntro`, `OfferCompare`, `EvidenceTrace`) | The quieter second clause starts its own line | The site's one typographic flourish: two clauses, two tones. The heading is as wide as its longest clause. |
| `.wrap` frame | `max-width: var(--max)` | The page frame every page aligns to. |

## Checks

- `npm run check-text-flow` (`scripts/check-text-flow.mjs`): static scan of `src/**/*.{astro,css}` for balanced or pretty wrapping, `ch` widths, fixed `max-width`, text measures built from grid tracks and `<br>`, each unless annotated. Runs in the pull-request and deploy workflows. `tests/unit/text-flow.test.ts` covers the scanner.
- `tests/e2e/text-flow.spec.ts`: on every built page, at 320, 390, 768, 1024, 1280, 1440 and 1920px, in light and dark appearance, asserts no horizontal overflow, no computed balanced or pretty wrapping, and that every wrapping text block with nothing beside it fills the width its parent gives it. Run it with `npx playwright test tests/e2e/text-flow.spec.ts --project=desktop`.
- `tests/e2e/site-wide-refinement.spec.ts` separately checks that no element is clipped outside the viewport.

## Visual acceptance

Automated checks passing is not enough. Any change to layout, typography or copy is accepted only after rendered screenshots have been inspected at 320, 390, 768, 1024, 1280, 1440 and 1920px in light and dark appearance for:

- text that wraps early while space beside it is empty;
- awkward breaks and isolated words in headings and short blocks;
- headings, copy, actions and diagrams that do not share a left edge;
- horizontal overflow or clipping.

A short final line in body copy is normal reflow. Do not fix it with balancing, manual breaks or narrower containers; rewrite the copy if a heading reads badly at a common width.
