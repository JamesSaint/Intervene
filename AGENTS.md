# Agents

## Intervene / AGDA perspective

James approaches Intervene / AGDA® from a practical engineering mindset. Judge systems by whether they work in reality, not by the amount of process, meetings, documentation or governance activity around them. Distinguish governance activity from operational capability. Avoid compliance-theatre framing. Core principle: “Governance is an input. Intervention capability is the outcome.” Founding question: “Does it actually work when it matters?”

## AGDA® brand treatment

When AGDA is displayed as a branded product name, use `AGDA®`. The registered trade mark symbol `®` is rendered in Intervene's established bronze/gold brand colour (`--accent` in `src/styles/tokens.css`), using the same treatment historically used for the `™` symbol. The letters `AGDA` retain the typography and colour appropriate to their context. Do not make the entire AGDA word bronze merely because the registration symbol is bronze.

On the site, never hand-type the markup or style the symbol inline: use `<Agda />` in templates and `markAgda()` for copy held in strings (both in `src/lib/marks.ts` / `src/components/Agda.astro`; the style is `.agda-reg` in `global.css`). Plain-text contexts (titles, meta descriptions, JSON-LD, aria-labels, `llms.txt`) use `AGDA®` without styling. Apply the same rule to other assets: the OG cards follow it via `scripts/generate-og-card.mjs`.

## Editorial standards

The editorial-standards skill and its fallback rules load from `~/Projects/_core/core.md` (Codex: `~/.codex/AGENTS.md`). Repo-specific addition: treat the approved Intervene statement as voice evidence, not facts to import into unrelated content.
