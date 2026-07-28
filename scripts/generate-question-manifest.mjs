/**
 * Generates public/question-manifest.json from the question set.
 *
 * This is the contract between the two repositories. The site is the
 * source of truth; the Worker vendors a copy of this file per supported
 * question set version and validates incoming answers against it. The
 * Worker's CI compares its copy against the published one.
 *
 * The manifest carries ids and allowed option values only. It must
 * never carry ordinals, thresholds, bands or copy. Anything in here is
 * public by definition, so anything private must not be in the question
 * set in the first place.
 *
 * Runs automatically via `npm run prebuild`.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'src/lib/snapshot/questions.ts');
const target = join(root, 'public/question-manifest.json');

const raw = readFileSync(source, 'utf8');

const versionMatch = raw.match(/QUESTION_SET_VERSION\s*=\s*'([^']+)'/);
if (!versionMatch) {
  console.error('generate-question-manifest: QUESTION_SET_VERSION not found.');
  process.exit(1);
}
const questionSetVersion = versionMatch[1];

// Parse the question objects without executing TypeScript. Each entry
// starts at an `id:` and runs to the end of its `options` array.
const questions = [];
const idPattern = /id:\s*'([^']+)'/g;
let match;

while ((match = idPattern.exec(raw)) !== null) {
  const id = match[1];
  const rest = raw.slice(match.index);
  const optionsStart = rest.indexOf('options:');
  if (optionsStart === -1) continue;

  // Take the balanced bracket span for this question's options array.
  const fromOptions = rest.slice(optionsStart);
  const open = fromOptions.indexOf('[');
  let depth = 0;
  let end = -1;
  for (let i = open; i < fromOptions.length; i += 1) {
    if (fromOptions[i] === '[') depth += 1;
    if (fromOptions[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) continue;

  const optionsBlock = fromOptions.slice(open, end + 1);
  const values = [...optionsBlock.matchAll(/value:\s*'([^']+)'/g)].map((m) => m[1]);
  if (values.length > 0) questions.push({ id, options: values });
}

if (questions.length === 0) {
  console.error('generate-question-manifest: no questions parsed. Refusing to write.');
  process.exit(1);
}

const manifest = {
  question_set_version: questionSetVersion,
  generated_at: new Date().toISOString().slice(0, 10),
  question_count: questions.length,
  questions,
};

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(
  `generate-question-manifest: wrote ${questions.length} questions for ${questionSetVersion}.`,
);
