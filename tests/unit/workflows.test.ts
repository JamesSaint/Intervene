import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '..', '..', '.github', 'workflows');
const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
const read = (f: string) => readFileSync(join(dir, f), 'utf8');
const deploy = read('deploy.yml');

describe('GitHub workflow safety', () => {
  it('has workflows to check', () => expect(files.length).toBeGreaterThan(0));

  it.each(files)('%s: every action is pinned to a full commit SHA', (f) => {
    const uses = [...read(f).matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u, `${f}: ${u}`).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
  });

  it.each(files)('%s: no privileged pull-request trigger and no expression injection', (f) => {
    const text = read(f);
    expect(text).not.toMatch(/pull_request_target|workflow_run/);
    const runBlocks = text.split('\n').filter((l) => /^\s+run:/.test(l) || /\$\{\{/.test(l));
    for (const l of runBlocks) expect(l, `${f}: ${l.trim()}`).not.toMatch(/\$\{\{\s*(github\.(event|head_ref)|inputs|env)\b/);
  });

  it.each(files)('%s: default token is read-only and checkout does not persist credentials', (f) => {
    const text = read(f);
    expect(text).toMatch(/^permissions:\n  contents: read\n/m);
    for (const block of text.split(/uses: actions\/checkout@/).slice(1)) {
      expect(block.slice(0, 200)).toMatch(/persist-credentials: false/);
    }
    expect(text).not.toMatch(/secrets\./);
  });

  it.each(files)('%s: dependencies install without lifecycle scripts', (f) => {
    const text = read(f);
    expect(text).not.toMatch(/npm ci(?! --ignore-scripts)/);
    expect(text).toMatch(/npm ci --ignore-scripts/);
  });

  it('only the deploy job can write Pages or mint an OIDC token', () => {
    const [top, build, deployJob] = [
      deploy.slice(0, deploy.indexOf('\njobs:')),
      deploy.slice(deploy.indexOf('\n  build:'), deploy.indexOf('\n  deploy:')),
      deploy.slice(deploy.indexOf('\n  deploy:')),
    ];
    expect(top).not.toMatch(/pages: write|id-token: write/);
    expect(build).not.toMatch(/pages: write|id-token: write|permissions:/);
    expect(deployJob).toMatch(/permissions:\n\s+pages: write\n\s+id-token: write/);
  });

  it('publishes hidden files so /.well-known/security.txt is deployed', () => {
    expect(deploy).toMatch(/include-hidden-files: true/);
  });

  it('runs the private-path guard before anything is built or published', () => {
    expect(deploy.indexOf('check-private-paths')).toBeGreaterThan(-1);
    expect(deploy.indexOf('check-private-paths')).toBeLessThan(deploy.indexOf('npm run build'));
  });
});
