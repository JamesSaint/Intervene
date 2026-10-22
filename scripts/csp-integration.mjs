import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectCsp } from './lib/csp.mjs';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return entry.endsWith('.html') ? [full] : [];
  });
}

/** Adds the meta CSP to every built HTML page once the build has finished. */
export default function cspIntegration() {
  return {
    name: 'intervene-meta-csp',
    hooks: {
      'astro:build:done': ({ dir }) => {
        for (const file of htmlFiles(fileURLToPath(dir))) {
          const html = readFileSync(file, 'utf8');
          const next = injectCsp(html);
          if (next !== html) writeFileSync(file, next);
        }
      },
    },
  };
}
