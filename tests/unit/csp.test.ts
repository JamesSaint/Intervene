import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { inlineScriptHashes, buildCsp, injectCsp } from '../../scripts/lib/csp.mjs';

const sha = (s: string) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const page = (body: string) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>t</title>${body}</head><body></body></html>`;

describe('meta CSP', () => {
  it('hashes inline executable scripts exactly, including whitespace', () => {
    const body = '\n  window.a = 1;\n';
    expect(inlineScriptHashes(page(`<script>${body}</script>`))).toEqual([sha(body)]);
  });

  it('does not hash external, empty or data scripts', () => {
    const html = page(
      '<script src="/a.js"></script><script></script><script type="application/ld+json">{"a":1}</script>',
    );
    expect(inlineScriptHashes(html)).toEqual([]);
  });

  it('hashes inline module scripts', () => {
    expect(inlineScriptHashes(page('<script type="module">import "/x.js"</script>'))).toHaveLength(1);
  });

  it('forbids inline script without a matching hash, eval and foreign origins', () => {
    const csp = buildCsp([sha('x')]);
    const script = csp.split('; ').find((d: string) => d.startsWith('script-src'))!;
    expect(script).not.toMatch(/unsafe-inline|unsafe-eval|\*\s|http:/);
    expect(script).toContain('https://www.googletagmanager.com');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/form-action 'self' https:\/\/formspree\.io/);
  });

  it('injects after the charset meta, before any script, once only', () => {
    const html = page('<script>var z=1</script>');
    const out = injectCsp(html);
    expect(out.indexOf('charset')).toBeLessThan(out.indexOf('Content-Security-Policy'));
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<script>'));
    expect(out).toContain(sha('var z=1'));
    expect(out).toContain('name="referrer"');
    expect(injectCsp(out)).toBe(out);
  });

  it('keeps charset inside the first 1024 bytes', () => {
    expect(injectCsp(page('')).indexOf('charset')).toBeLessThan(1024);
  });

  it('leaves fragments without a head untouched', () => {
    expect(injectCsp('<p>fragment</p>')).toBe('<p>fragment</p>');
  });

  it('recognises end tags with whitespace or capitals and attributes containing ">"', () => {
    const body = 'window.q = 1';
    for (const markup of [
      `<script>${body}</script >`,
      `<script>${body}</SCRIPT>`,
      `<script data-x="a>b">${body}</script\n>`,
      `<SCRIPT type='text/javascript'>${body}</script>`,
    ]) {
      expect(inlineScriptHashes(page(markup)), markup).toEqual([sha(body)]);
    }
  });

  it('does not let one script swallow the next when end tags vary', () => {
    const html = page('<script>var a=1</script ><script>var b=2</script>');
    expect(inlineScriptHashes(html)).toEqual([sha('var a=1'), sha('var b=2')].sort());
  });
});
