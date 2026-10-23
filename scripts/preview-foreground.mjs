/**
 * Runs `astro preview` for the Playwright web server.
 *
 * Astro 7 starts the preview as a detached background process and returns at
 * once, which Playwright reads as the web server exiting early. This wrapper
 * starts the preview, stays alive so Playwright can supervise it, and stops
 * the preview when Playwright terminates it. Arguments pass straight through.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const astro = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const args = process.argv.slice(2);

function run(subArgs) {
  return spawnSync(process.execPath, [astro, 'preview', ...subArgs], { cwd: root, stdio: 'inherit' });
}

// A stale preview from an earlier run would hold the lock and the port.
run(['stop']);
const started = run(args);
if (started.status !== 0) process.exit(started.status ?? 1);

const stop = () => {
  run(['stop']);
  process.exit(0);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
process.on('SIGHUP', stop);
setInterval(() => {}, 1 << 30);
