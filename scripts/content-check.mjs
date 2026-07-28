/**
 * Content checks for the Snapshot.
 *
 * SCOPE MATTERS. A repository-wide prohibition on these words is
 * unusable: the site legitimately and extensively uses `chain` (the
 * intervention chain is a canonical DefinedTerm, two component names and
 * published copy on the methodology page) and `score` appears in AGDA
 * content that is not going anywhere. Checking everything would fail on
 * the first run and the check would be switched off within a week.
 *
 * So this runs against the three Snapshot directories only:
 *   src/pages/readiness-snapshot/**
 *   src/components/snapshot/**
 *   src/lib/snapshot/**
 *
 * Two vocabulary categories are enforced there, plus the repo-wide
 * em dash rule from the README, which applies to those directories too.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCOPES = [
  'src/pages/readiness-snapshot',
  'src/components/snapshot',
  'src/lib/snapshot',
];

/** Words that would present the Snapshot as an assessment or a grade. */
const ASSESSMENT_TERMS = [
  'pass', 'fail', 'not ready', 'score', 'rating', 'grade', 'maturity',
  'certified', 'assured', 'compliant', 'agda found', 'agda assessed',
  'we assess', 'your organisation is', 'your organisation cannot',
];

/** Words that would assert an independently determined deficiency. */
const DEFICIENCY_TERMS = [
  'weak', 'weakest', 'weakest link', 'weakness', 'deficiency', 'failing',
  'shortfall', 'inadequate', 'insufficient', 'lacking', 'you lack',
  'missing capability',
];

/** Unevidenced frequency claims. Intervene has no data for these yet. */
const FREQUENCY_TERMS = [
  'most organisations', 'typically', 'usually', 'in our experience',
  'most companies', 'the majority of organisations',
];

/**
 * Words that are legitimate in code but not in visitor-facing copy.
 * Checked only inside quoted strings and markup text, never against
 * identifiers, imports or comments.
 */
const ALL_COPY_TERMS = [...ASSESSMENT_TERMS, ...DEFICIENCY_TERMS, ...FREQUENCY_TERMS];

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(astro|ts|js|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Strips comments and import statements so the checks see copy rather
 * than code. Deliberately conservative: it is better to check a little
 * too much than to let a phrase through inside a template literal.
 */
function stripNonCopy(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/^\s*import\s[^;]+;/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');
}

const findings = [];

for (const scope of SCOPES) {
  for (const file of walk(join(root, scope))) {
    const rel = relative(root, file);
    const original = readFileSync(file, 'utf8');
    const copy = stripNonCopy(original);
    const lines = copy.split('\n');

    lines.forEach((line, index) => {
      const lower = line.toLowerCase();

      for (const term of ALL_COPY_TERMS) {
        // Word-boundary match so `passed` does not trip on `pass`
        // and `assured` does not trip inside `reassured`.
        const pattern = new RegExp(`\\b${term.replace(/ /g, '\\s+')}\\b`, 'i');
        if (pattern.test(lower)) {
          findings.push({
            file: rel,
            line: index + 1,
            term,
            text: line.trim().slice(0, 120),
          });
        }
      }

      if (/[—–]/.test(line)) {
        findings.push({
          file: rel,
          line: index + 1,
          term: 'em or en dash',
          text: line.trim().slice(0, 120),
        });
      }
    });
  }
}

if (findings.length > 0) {
  console.error(`\ncontent-check: ${findings.length} finding(s).\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  "${f.term}"`);
    console.error(`    ${f.text}\n`);
  }
  console.error(
    'Snapshot copy must restate what the visitor reported. It must not assert\n' +
      'an assessment, a grade, an independently determined deficiency, or a\n' +
      'frequency claim Intervene cannot yet evidence.\n',
  );
  process.exit(1);
}

console.log('content-check: clean across', SCOPES.join(', '));
