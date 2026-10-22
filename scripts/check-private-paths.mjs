/**
 * Fails when a tracked path looks private.
 *
 * This repository is public and a push to `main` publishes it, so one
 * mistaken commit under `internal/` or `security-audit/`, or of a key or
 * environment file, is a disclosure. `.gitignore` is the first guard; this
 * is the second, because `git add -f` and a stale index both bypass the
 * first. It reads `git ls-files`, which includes force-added paths.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PRIVATE_PATTERNS = [
  /^internal\//,
  /^security-audit\//,
  /(^|\/)\.env(\.(?!example$)[^/]+)?$/,
  /\.(pem|key|p12|pfx|keystore)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/,
  /\.map$/,
  /\.(tar|tgz|zip)$/i,
  /\.tar\.(gz|bz2|xz)$/i,
  /^\.claude\//,
];

export function privatePaths(paths) {
  return paths.filter((p) => PRIVATE_PATTERNS.some((re) => re.test(p)));
}

function tracked() {
  const out = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\0').filter(Boolean);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hits = privatePaths(tracked());
  if (hits.length) {
    console.error('check-private-paths: tracked paths that look private:');
    for (const hit of hits) console.error(`  ${hit}`);
    process.exit(1);
  }
  console.log('check-private-paths: clean');
}
