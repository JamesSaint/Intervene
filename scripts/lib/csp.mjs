/**
 * Content Security Policy and referrer policy for the static build.
 *
 * GitHub Pages cannot send response headers, so the policy is delivered as
 * <meta http-equiv>. A meta policy cannot carry `frame-ancestors`,
 * `report-uri` or `sandbox`; clickjacking protection is therefore not
 * provided here and needs a host that sets headers.
 *
 * Inline executable scripts are allowed by SHA-256 hash, computed from the
 * built HTML itself, so the policy cannot drift from the scripts it covers.
 * JSON-LD and other non-JavaScript data blocks are not executed and need no
 * hash. Inline styles stay allowed: Astro emits <style> blocks and a few
 * style attributes, and script injection is the risk this policy addresses.
 */

import { createHash } from 'node:crypto';

// Attributes may contain a quoted ">"; an end tag may carry whitespace (</script >).
const SCRIPT_RE = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;
const EXECUTABLE_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

export const REFERRER_META = '<meta name="referrer" content="strict-origin-when-cross-origin">';

function attr(attrs, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

/** SHA-256 CSP source tokens for every inline script the browser would run. */
export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(SCRIPT_RE)) {
    if (attr(attrs, 'src') !== null) continue;
    const type = (attr(attrs, 'type') ?? '').trim().toLowerCase();
    if (!EXECUTABLE_TYPES.has(type)) continue;
    if (!body.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return [...hashes].sort();
}

export function buildCsp(hashes) {
  const directives = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", ...hashes, 'https://www.googletagmanager.com']],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", 'data:', 'https://*.google-analytics.com', 'https://*.googletagmanager.com']],
    ["font-src", ["'self'"]],
    ["connect-src", [
      "'self'",
      'https://formspree.io',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com',
    ]],
    ["frame-src", ["'self'"]],
    ["form-action", ["'self'", 'https://formspree.io']],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
  ];
  return directives.map(([name, sources]) => `${name} ${sources.join(' ')}`).join('; ');
}

const HEAD_OPEN = /<head\b[^>]*>/i;
const CHARSET_META = /<meta\b[^>]*\bcharset\s*=[^>]*>/i;

/**
 * Inserts the CSP and referrer metas at the top of <head>, ahead of every
 * script but after <meta charset>, which must stay within the first 1024
 * bytes of the document. Returns the HTML unchanged when it has no <head> or already
 * carries a policy, so the step is idempotent.
 */
export function injectCsp(html) {
  if (/http-equiv\s*=\s*["']?Content-Security-Policy/i.test(html)) return html;
  const head = HEAD_OPEN.exec(html);
  if (!head) return html;
  const csp = buildCsp(inlineScriptHashes(html));
  const metas = `<meta http-equiv="Content-Security-Policy" content="${csp}">${REFERRER_META}`;
  const charset = CHARSET_META.exec(html);
  const at = charset && charset.index > head.index
    ? charset.index + charset[0].length
    : head.index + head[0].length;
  return html.slice(0, at) + metas + html.slice(at);
}
