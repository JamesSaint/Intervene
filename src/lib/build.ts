/**
 * Build identity, read once at build time and written into every page
 * as <meta name="intervene-build">. The value is the short commit the
 * build was made from, with "-dirty" when tracked site sources differed
 * from that commit. It lets a reviewer confirm which version a running
 * preview serves. Empty when git is unavailable.
 */
import { execSync } from 'node:child_process';

function read(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

const commit = read('git rev-parse --short HEAD');
const dirty = commit && read('git status --porcelain -- src public astro.config.mjs package.json') ? '-dirty' : '';

export const buildId = commit ? `${commit}${dirty}` : '';
