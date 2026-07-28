/**
 * Fails the site build if the question set version it is about to
 * publish is not already supported by the Worker.
 *
 * This exists to break a circular dependency. If the site deployed
 * first, it would send a question_set_version the live Worker rejects,
 * and every submission would fail until the Worker caught up. So the
 * dependency runs one way: the Worker must support a version before the
 * site may publish it.
 *
 * Release order for a question set change:
 *   1. Add the manifest and ordering map to the Worker
 *   2. Deploy the Worker. Both versions now supported
 *   3. Deploy the site. This check passes because step 2 happened
 *   4. Confirm traffic has moved
 *   5. Remove the old version no earlier than seven days later
 *
 * PHASE 1: there is no Worker yet. The check reports and exits 0 when
 * SNAPSHOT_API_ORIGIN is unset. It becomes blocking in Phase 2 when the
 * origin is configured in CI.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.SNAPSHOT_API_ORIGIN;

const manifest = JSON.parse(
  readFileSync(join(root, 'public/question-manifest.json'), 'utf8'),
);
const version = manifest.question_set_version;

if (!origin) {
  console.log(
    `check-version-supported: SNAPSHOT_API_ORIGIN unset. Skipping (Phase 1).\n` +
      `  Site question set: ${version}`,
  );
  process.exit(0);
}

const url = `${origin.replace(/\/$/, '')}/v1/meta`;

let response;
try {
  response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
} catch (error) {
  console.error(`check-version-supported: could not reach ${url}`);
  console.error(`  ${error.message}`);
  console.error('  Refusing to publish a question set the Worker may not support.');
  process.exit(1);
}

if (!response.ok) {
  console.error(`check-version-supported: ${url} returned ${response.status}.`);
  process.exit(1);
}

const meta = await response.json();
const supported = meta.supported_question_set_versions ?? [];

if (!supported.includes(version)) {
  console.error(
    `check-version-supported: the Worker does not support ${version}.\n` +
      `  Supported: ${supported.join(', ') || 'none reported'}\n` +
      `  Deploy the Worker with the new manifest first, then the site.`,
  );
  process.exit(1);
}

console.log(`check-version-supported: ${version} is supported by ${origin}.`);
