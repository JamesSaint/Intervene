/**
 * Fails when source styles or templates restrict how text flows.
 *
 * Text fills the column its layout gives it. A width cap on prose, a
 * balanced or "pretty" wrap, a character-count measure or a hand-placed
 * line break is a design defect unless it has a layout or readability
 * reason, and that reason must be written beside it:
 *
 *   max-width: 640px; /* text-flow-exception: aligns the readout to the dial face *\/
 *   <span>Two<br />lines</span>{/* text-flow-exception: diagram terminal label *\/}
 *
 * The exception comment goes on the same line as the declaration or tag
 * and must give a reason. Standards: docs/design-standards.md.
 *
 * Scope: src/**\/*.{astro,css}. src/lib/email-signature.ts is out of scope:
 * the email signature is table markup for mail clients, not page layout.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Width values that never narrow text below its column. */
const NEUTRAL_WIDTHS = [
  /^none$/,
  /^100%$/,
  /^auto$/,
  /^(fit|max|min)-content$/,
  // The page frame: the shared outer container every page aligns to.
  /^var\(--max\)$/,
  // The prose measures, which are set to the full column in tokens.css.
  /^var\(--measure-(body|lede)\)$/,
];

const EXCEPTION = /text-flow-exception:\s*\S.{3,}/;

/**
 * Scan one file's source. Returns findings as { line, rule, text }.
 * Pure, so the unit tests can exercise it without the file system.
 */
export function scanTextFlow(source) {
  const findings = [];
  const lines = source.split('\n');
  lines.forEach((text, i) => {
    if (EXCEPTION.test(text)) return;
    const line = i + 1;
    if (/text-wrap(-style)?\s*:\s*(balance|pretty)/.test(text)) {
      findings.push({ line, rule: 'balanced or pretty text-wrap', text: text.trim() });
    }
    // Declarations only: `(max-width: 720px)` in a media query or a
    // <source media> attribute is a breakpoint, not a width.
    for (const m of text.matchAll(/(?<![(\w-])(max-width|max-inline-size|width|inline-size|flex-basis)\s*:\s*([^;}"'\n]+)/g)) {
      const [, prop, raw] = m;
      const value = raw.replace(/!important/, '').trim();
      if (/\d(\.\d+)?ch\b/.test(value)) {
        findings.push({ line, rule: `character-based ${prop}`, text: text.trim() });
      } else if (prop.startsWith('max') && !NEUTRAL_WIDTHS.some((re) => re.test(value))) {
        findings.push({ line, rule: `fixed ${prop} (${value})`, text: text.trim() });
      }
    }
    // A reading measure built from grid tracks is still a measure: a track
    // sized in characters, rems or from a type token caps the text in it.
    if (/grid-template-columns\s*:[^;]*(\d(\.\d+)?(ch|rem)\b|--type-)/.test(text)) {
      findings.push({ line, rule: 'text measure in grid tracks', text: text.trim() });
    }
    if (/<br\s*\/?>/i.test(text)) {
      findings.push({ line, rule: 'manual line break', text: text.trim() });
    }
  });
  return findings;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export function scanRepository(base = root) {
  return walk(join(base, 'src'))
    .filter((path) => /\.(astro|css)$/.test(path))
    .flatMap((path) => scanTextFlow(readFileSync(path, 'utf8')).map((f) => ({ file: relative(base, path), ...f })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = scanRepository();
  if (findings.length) {
    console.error('Text-flow restrictions without a written exception:\n');
    for (const f of findings) console.error(`  ${f.file}:${f.line}  ${f.rule}\n    ${f.text}`);
    console.error('\nRemove the restriction, or add `text-flow-exception: <reason>` on the same line.');
    console.error('See docs/design-standards.md.');
    process.exit(1);
  }
  console.log('Text flow: no unjustified width restrictions, balanced wraps or manual line breaks.');
}
