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
 *
 * DETERMINISTIC. THE OUTPUT IS A PURE FUNCTION OF THE QUESTION SET.
 *
 * Nothing here may read the clock, the environment, the filesystem
 * beyond the source, the git state or a random source. Two runs on
 * different days, on different machines, in different time zones, must
 * produce identical bytes.
 *
 * That is what makes the CI check meaningful. `.github/workflows/
 * content-checks.yml` regenerates the manifest and fails on any diff,
 * which asserts that the committed file matches its source. A field
 * that varies on its own turns that assertion into a calendar check:
 * the first pull request opened on a later day fails, having changed
 * nothing.
 *
 * A `generated_at` date lived here until 19 August 2026 and did exactly
 * that. It also said less than it appeared to. It recorded when the
 * generator last ran, not when the manifest last changed, so it read as
 * provenance while being nothing of the kind. `git log
 * public/question-manifest.json` answers the question it was pretending
 * to answer, and answers it correctly.
 *
 * If a timestamp is ever genuinely needed here, derive it from the
 * source rather than from the clock, and expect
 * `tests/unit/question-manifest.test.ts` to stop you otherwise.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const SOURCE = join(root, 'src/lib/snapshot/questions.ts');
export const TARGET = join(root, 'public/question-manifest.json');

/**
 * Builds the manifest object from the question set source.
 *
 * Exported so the determinism tests can call it directly rather than
 * shelling out and writing into `public/`. Throws rather than exiting,
 * so a caller other than the command line below can handle failure.
 */
export function buildManifest(raw) {
  const versionMatch = raw.match(/QUESTION_SET_VERSION\s*=\s*'([^']+)'/);
  if (!versionMatch) {
    throw new Error('QUESTION_SET_VERSION not found.');
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
    throw new Error('no questions parsed. Refusing to write.');
  }

  return {
    question_set_version: questionSetVersion,
    question_count: questions.length,
    questions,
  };
}

/** The exact bytes written to disk. One definition, so the test compares what CI compares. */
export function serialiseManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * The command line. Skipped when this module is imported, so the tests
 * neither write to `public/` nor exit the test runner.
 */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  let manifest;
  try {
    manifest = buildManifest(readFileSync(SOURCE, 'utf8'));
  } catch (error) {
    console.error(`generate-question-manifest: ${error.message}`);
    process.exit(1);
  }

  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, serialiseManifest(manifest), 'utf8');

  console.log(
    `generate-question-manifest: wrote ${manifest.question_count} questions for ${manifest.question_set_version}.`,
  );
}
