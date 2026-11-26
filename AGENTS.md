# Agents

## Intervene / AGDA perspective

James approaches Intervene / AGDA® from a practical engineering mindset. Judge systems by whether they work in reality, not by the amount of process, meetings, documentation or governance activity around them. Distinguish governance activity from operational capability. Avoid compliance-theatre framing. Core principle: “Governance is an input. Intervention capability is the outcome.” Founding question: “Does it actually work when it matters?”

## AGDA® brand treatment

Wherever the product name is part of readable text on the site (headings, paragraphs, navigation, the open menu, buttons, links, cards, captions, forms, footer copy), `AGDA` stays plain text in the surrounding typography and only the registered mark is wrapped, with no space before it:

```html
AGDA<span class="agda-reg">®</span>
```

One shared rule in `src/styles/global.css` sets the mark, with the same values at every breakpoint and in both themes:

```css
.agda-reg {
  font-size: 0.4em;
  vertical-align: 1.3em;
  line-height: 0;
}
```

Both measurements are in `em` so the mark scales from body copy to large headings. The lift is relative to the mark's own size, so `1.3em` raises it by 52% of the surrounding font size. The `®` inherits the surrounding colour, font family and weight. Do not add a second rule, a per-component override or a colour. Do not replace the name with a logo image or SVG, do not wrap the whole name, and do not give it a `role` or `aria-label`. It must read and copy as exactly `AGDA®`, with one `®`, and must not change the line spacing around it.

On the site, do not hand-type the markup: use `<Agda />` in templates and `markAgda()` for copy held in strings (`src/components/Agda.astro`, `src/lib/marks.ts`). `markAgda()` returns markup, so render it with `set:html`; it adds a missing `®` and never doubles one. Contexts that cannot hold markup (titles, meta descriptions, JSON-LD, aria-labels, `llms.txt`, the plain-text email signature) use the plain string `AGDA®`. The footer trade mark notice keeps its own wording.

Standalone identity logos are separate and stay as approved artwork: `AgdaLogo.astro` (homepage and AGDA page identity, the footer hallmark), the email signature wordmark (`markAgdaEmail()`), and the OG cards (`scripts/generate-og-card.mjs`). In that artwork the `®` keeps Intervene's bronze/gold brand colour (`--accent` in `src/styles/tokens.css`). Never use a logo to stand in for the name inside a sentence, heading, link or label.

## Text flow and content width

Mandatory for all site work: `docs/design-standards.md`. Text fills its layout column; any width restriction, balanced wrap or manual break needs a written `text-flow-exception: <reason>` and a real layout or readability justification. `npm run check-text-flow` and `tests/e2e/text-flow.spec.ts` enforce it; screenshot review at the seven acceptance widths in both appearances is part of acceptance.

## Editorial standards

The editorial-standards skill and its fallback rules load from `~/Projects/_core/core.md` (Codex: `~/.codex/AGENTS.md`). Repo-specific addition: treat the approved Intervene statement as voice evidence, not facts to import into unrelated content.
