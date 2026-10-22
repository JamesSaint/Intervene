import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { privatePaths } from '../../scripts/check-private-paths.mjs';

describe('private path guard', () => {
  it('flags paths that must never be published', () => {
    const bad = [
      'internal/strategy.md',
      'internal/security-audit/REMEDIATION_RESULTS.md',
      'security-audit/WEBSITE_FINDINGS.md',
      '.env',
      '.env.production',
      'src/.env.local',
      'keys/signing.pem',
      'server.key',
      'id_rsa',
      'dist/app.js.map',
      'intervene-site.tar.gz',
      'backup.zip',
      '.claude/settings.json',
    ];
    expect(privatePaths(bad)).toEqual(bad);
  });

  it('allows ordinary repository files', () => {
    const ok = [
      'src/pages/index.astro',
      'docs/analytics-events.md',
      '.env.example',
      'public/assets/fonts/montserrat-bold.woff2',
      'internal-links.md',
      'src/lib/internal/readme.ts',
    ];
    expect(privatePaths(ok)).toEqual([]);
  });

  it('passes on the current tracked tree', async () => {
    const { execFileSync } = await import('node:child_process');
    const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
    expect(privatePaths(tracked)).toEqual([]);
  });
});

describe('private path guard against a real repository', () => {
  const script = join(__dirname, '..', '..', 'scripts', 'check-private-paths.mjs');

  function repo(): string {
    const dir = mkdtempSync(join(tmpdir(), 'private-paths-'));
    const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    git('init', '-q');
    writeFileSync(join(dir, '.gitignore'), 'internal/\nsecurity-audit/\n');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src', 'index.astro'), 'ok');
    git('add', '.gitignore', 'src');
    return dir;
  }
  const run = (dir: string) => spawnSync('node', [script], { cwd: dir, encoding: 'utf8' });

  it('passes when private directories exist but are ignored', () => {
    const dir = repo();
    mkdirSync(join(dir, 'internal'));
    writeFileSync(join(dir, 'internal', 'note.md'), 'private');
    mkdirSync(join(dir, 'security-audit'));
    writeFileSync(join(dir, 'security-audit', 'report.md'), 'private');
    execFileSync('git', ['add', '-A'], { cwd: dir });
    expect(run(dir).status).toBe(0);
  });

  it.each(['internal/security-audit/report.md', 'security-audit/report.md'])(
    'fails when %s is force-added past .gitignore',
    (path) => {
      const dir = repo();
      mkdirSync(join(dir, path, '..'), { recursive: true });
      writeFileSync(join(dir, path), 'private');
      execFileSync('git', ['add', '-f', path], { cwd: dir });
      const result = run(dir);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(path);
    },
  );
});
