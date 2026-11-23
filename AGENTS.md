# Agents

## Intervene / AGDA perspective

James approaches Intervene / AGDA® from a practical engineering mindset. Judge systems by whether they work in reality, not by the amount of process, meetings, documentation or governance activity around them. Distinguish governance activity from operational capability. Avoid compliance-theatre framing. Core principle: “Governance is an input. Intervention capability is the outcome.” Founding question: “Does it actually work when it matters?”

## AGDA® brand treatment

Wherever the product name is part of readable text on the site (headings, paragraphs, navigation, menus, buttons, links, cards, captions, forms, footer copy), write the literal string `AGDA®`. The whole string, including the `®`, inherits the surrounding font, size, weight, colour and baseline. Do not replace it with a logo image or SVG, do not wrap it in a styled element, and do not colour, shrink or raise the `®`. It must read and copy as `AGDA®`, with exactly one `®` and no `role` or `aria-label` of its own.

On the site, do not hand-type variants: use `<Agda />` in templates and `markAgda()` for copy held in strings (`src/components/Agda.astro`, `src/lib/marks.ts`). `markAgda()` adds a missing `®` and never doubles one. Plain-text contexts (titles, meta descriptions, JSON-LD, aria-labels, `llms.txt`) use `AGDA®` as well.

Standalone identity logos are separate and stay as approved artwork: `AgdaLogo.astro` (homepage and AGDA page identity, the footer hallmark), the email signature wordmark (`markAgdaEmail()`), and the OG cards (`scripts/generate-og-card.mjs`). In that artwork the `®` keeps Intervene's bronze/gold brand colour (`--accent` in `src/styles/tokens.css`). Never use a logo to stand in for the name inside a sentence, heading, link or label.

## Editorial standards

The editorial-standards skill and its fallback rules load from `~/Projects/_core/core.md` (Codex: `~/.codex/AGENTS.md`). Repo-specific addition: treat the approved Intervene statement as voice evidence, not facts to import into unrelated content.
