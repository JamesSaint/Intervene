import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const read = (f: string) => readFileSync(join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const nvmrc = read('.nvmrc').trim();

describe('pinned toolchain', () => {
  it('pins one exact Node version that satisfies package.json engines', () => {
    expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/);
    const [major, minor, patch] = nvmrc.split('.').map(Number);
    const min = /^>=(\d+)\.(\d+)\.(\d+) <(\d+)$/.exec(pkg.engines.node);
    expect(min, `engines.node ${pkg.engines.node}`).not.toBeNull();
    const [, a, b, c, ceil] = min!.map(Number);
    expect(major > a || (major === a && (minor > b || (minor === b && patch >= c)))).toBe(true);
    expect(major).toBeLessThan(ceil);
    expect(pkg.engines.npm).toMatch(/^>=11\.\d+\.\d+ <12$/);
  });

  it('fails fast on the wrong Node or npm instead of writing an incompatible lockfile', () => {
    expect(read('.npmrc')).toMatch(/^engine-strict=true$/m);
  });

  it('runs the test suite on the pinned Node', () => {
    expect(process.versions.node).toBe(nvmrc);
  });

  it('meets Astro\'s own Node requirement', () => {
    const astro = JSON.parse(read('node_modules/astro/package.json'));
    const need = /^>=(\d+)\.(\d+)\.(\d+)/.exec(astro.engines.node)!.slice(1).map(Number);
    const have = nvmrc.split('.').map(Number);
    const ok = have[0] > need[0] || (have[0] === need[0] && (have[1] > need[1] || (have[1] === need[1] && have[2] >= need[2])));
    expect(ok, `astro needs ${astro.engines.node}`).toBe(true);
  });
});

describe('lockfile integrity', () => {
  const entries = Object.entries<any>(lock.packages).filter(([k]) => k !== '');

  it('is lockfile version 3 with a hash and a registry source for every package', () => {
    expect(lock.lockfileVersion).toBe(3);
    for (const [name, p] of entries) {
      if (p.link) continue;
      expect(p.integrity, `${name} integrity`).toMatch(/^sha(256|384|512)-/);
      expect(p.resolved, `${name} source`).toMatch(/^https:\/\/registry\.npmjs\.org\//);
    }
  });

  it('declares only the intended direct dependencies, with no git, file or URL specifiers', () => {
    const specs = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, range] of Object.entries<string>(specs)) expect(range, name).toMatch(/^\^?\d+\.\d+\.\d+$/);
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['@astrojs/sitemap', 'astro']);
  });

  it('limits install-script packages to known native tooling', () => {
    const withScripts = entries.filter(([, p]) => p.hasInstallScript).map(([k]) => k.replace(/^.*node_modules\//, ''));
    const allowed = new Set(['esbuild', 'sharp', 'fsevents']);
    for (const name of withScripts) expect(allowed.has(name), `unexpected install script in ${name}`).toBe(true);
  });
});
