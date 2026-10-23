/**
 * Availability and integrity monitor for https://intervene.uk.
 *
 * Read-only: GET requests, one TLS handshake and DNS lookups. It never submits
 * a form. No dependencies, so it runs on a bare Node install. Exit status 1
 * means at least one check failed; `--json` prints the results for the alerting
 * step in .github/workflows/monitor.yml.
 *
 * The evaluate* functions are pure so tests can feed them synthetic evidence.
 */

import tls from 'node:tls';
import dns from 'node:dns/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://intervene.uk';
export const HOST = 'intervene.uk';
export const PAGES_ADDRESSES = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
export const CERT_WARN_DAYS = 14;
export const SECURITY_TXT_WARN_DAYS = 30;
export const EXPECTED_FORM_ACTION = 'https://formspree.io/f/xaqrkrpo';
const DAY = 86_400_000;

/** @typedef {{ name: string, ok: boolean, detail: string }} Result */
const result = (name, ok, detail) => ({ name, ok, detail });

export function evaluatePage(name, status, html, { build = false } = {}) {
  if (status !== 200) return result(name, false, `HTTP ${status}`);
  if (!/<title>[^<]+<\/title>/i.test(html)) return result(name, false, 'no <title>');
  if (!/http-equiv="Content-Security-Policy"/i.test(html)) return result(name, false, 'CSP meta missing');
  if (build && !/name="intervene-build" content="[0-9a-f]{7,40}"/.test(html)) return result(name, false, 'build id meta missing');
  return result(name, true, 'HTTP 200');
}

export function parseBuild(html) {
  return /name="intervene-build" content="([0-9a-f]{7,40})"/.exec(html)?.[1] ?? null;
}

export function evaluateRedirect(status, location) {
  const ok = [301, 308].includes(status) && /^https:\/\/intervene\.uk\/?$/.test(location ?? '');
  return result('http redirects to https', ok, ok ? `${status} to ${location}` : `status ${status}, location ${location}`);
}

export function evaluateCertificate(validTo, now = Date.now(), nameMatches = true) {
  const days = Math.floor((new Date(validTo).getTime() - now) / DAY);
  if (Number.isNaN(days)) return result('tls certificate', false, 'unreadable expiry');
  if (!nameMatches) return result('tls certificate', false, 'name does not match');
  if (days < 0) return result('tls certificate', false, `expired ${-days} days ago`);
  if (days < CERT_WARN_DAYS) return result('tls certificate', false, `expires in ${days} days (renewal overdue)`);
  return result('tls certificate', true, `valid for ${days} more days`);
}

export function evaluateSecurityTxt(status, text, now = Date.now()) {
  if (status !== 200) return result('security.txt', false, `HTTP ${status}`);
  const expires = /^Expires:\s*(\S+)/im.exec(text)?.[1];
  const contact = /^Contact:\s*(\S+)/im.exec(text)?.[1];
  if (!contact) return result('security.txt', false, 'no Contact field');
  const days = Math.floor((new Date(expires ?? NaN).getTime() - now) / DAY);
  if (Number.isNaN(days)) return result('security.txt', false, 'no valid Expires field');
  if (days < SECURITY_TXT_WARN_DAYS) return result('security.txt', false, days < 0 ? `expired ${-days} days ago` : `expires in ${days} days; renew it`);
  return result('security.txt', true, `valid for ${days} more days`);
}

export function evaluateDns({ a, wwwCname, mx, txt }) {
  const problems = [];
  const stray = a.filter((x) => !PAGES_ADDRESSES.includes(x));
  if (!a.length) problems.push('apex has no A records');
  if (stray.length) problems.push(`apex resolves outside GitHub Pages: ${stray.join(', ')}`);
  if (!wwwCname.some((c) => /\.github\.io\.?$/i.test(c))) problems.push(`www CNAME is ${wwwCname.join(',') || 'missing'}`);
  if (!mx.length) problems.push('no MX records (inbound email would fail)');
  if (!txt.some((t) => /^v=spf1\b/i.test(t))) problems.push('SPF record missing');
  return result('dns', problems.length === 0, problems.join('; ') || `${a.length} A, www CNAME, ${mx.length} MX, SPF present`);
}

export function evaluateDeploy(run, liveBuild) {
  if (!run) return result('deployment', false, 'no deploy run found');
  if (run.status !== 'completed') return result('deployment', true, `run in progress (${run.status})`);
  if (run.conclusion !== 'success') return result('deployment', false, `latest deploy run ${run.conclusion}: ${run.url}`);
  if (!liveBuild) return result('deployment', false, 'live site reports no build id');
  const drift = !run.headSha.startsWith(liveBuild) && !liveBuild.startsWith(run.headSha.slice(0, liveBuild.length));
  return result('deployment', !drift, drift ? `live build ${liveBuild} differs from last successful deploy ${run.headSha.slice(0, 7)}` : `live build ${liveBuild} matches the last deploy`);
}

export function evaluateFormAction(html) {
  const action = /<form[^>]*data-contact[^>]*action="([^"]+)"|<form[^>]*action="([^"]+)"[^>]*data-contact/.exec(html);
  const found = action?.[1] ?? action?.[2];
  return result('contact form destination', found === EXPECTED_FORM_ACTION, found ? `action ${found}` : 'form not found');
}

export function evaluateExposure(probes) {
  const open = probes.filter((p) => p.status === 200).map((p) => p.path);
  return result('private paths not served', open.length === 0, open.length ? `served: ${open.join(', ')}` : `${probes.length} probes returned non-200`);
}

async function get(path, init = {}) {
  const res = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(15_000), ...init });
  return { status: res.status, text: await res.text(), headers: res.headers };
}

function certificate() {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: HOST, port: 443, servername: HOST, timeout: 15_000 }, () => {
      const cert = socket.getPeerCertificate();
      const nameMatches = tls.checkServerIdentity(HOST, cert) === undefined && socket.authorized;
      socket.end();
      resolve({ validTo: cert.valid_to, nameMatches });
    });
    socket.on('error', reject);
    socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS timeout')); });
  });
}

function latestDeploy() {
  try {
    const out = execFileSync('gh', ['run', 'list', '--workflow=deploy.yml', '--branch=main', '--limit=1',
      '--json=status,conclusion,headSha,url'], { encoding: 'utf8', timeout: 30_000 });
    return JSON.parse(out)[0] ?? null;
  } catch { return undefined; }
}

async function guarded(name, fn) {
  try { return await fn(); } catch (error) { return result(name, false, `check failed to run: ${error.message}`); }
}

export async function runChecks({ simulateFailure = false } = {}) {
  const results = [];
  let home = { status: 0, text: '' };
  results.push(await guarded('home page', async () => {
    home = await get('/');
    return evaluatePage('home page', home.status, home.text, { build: true });
  }));
  results.push(await guarded('contact page', async () => {
    const r = await get('/contact/');
    const page = evaluatePage('contact page', r.status, r.text);
    return page.ok ? evaluateFormAction(r.text) : page;
  }));
  results.push(await guarded('http redirects to https', async () => {
    const r = await fetch(`http://${HOST}/`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    return evaluateRedirect(r.status, r.headers.get('location'));
  }));
  results.push(await guarded('tls certificate', async () => {
    const c = await certificate();
    return evaluateCertificate(c.validTo, Date.now(), c.nameMatches);
  }));
  results.push(await guarded('security.txt', async () => {
    const r = await get('/.well-known/security.txt');
    return evaluateSecurityTxt(r.status, r.text);
  }));
  results.push(await guarded('dns', async () => {
    const lookups = await Promise.allSettled([
      dns.resolve4(HOST), dns.resolveCname(`www.${HOST}`), dns.resolveMx(HOST), dns.resolveTxt(HOST)]);
    const [a, cname, mx, txt] = lookups.map((l) => (l.status === 'fulfilled' ? l.value : []));
    return evaluateDns({ a, wwwCname: cname, mx, txt: txt.map((t) => t.join('')) });
  }));
  results.push(await guarded('private paths not served', async () => {
    const paths = ['/.env', '/.git/config', '/internal/', '/package.json', '/src/'];
    const probes = await Promise.all(paths.map(async (path) => ({ path, status: (await get(path)).status })));
    return evaluateExposure(probes);
  }));
  results.push(await guarded('deployment', async () => {
    const run = latestDeploy();
    if (run === undefined) return result('deployment', true, 'skipped: GitHub CLI unavailable');
    return evaluateDeploy(run, parseBuild(home.text));
  }));
  if (simulateFailure) results.push(result('simulated failure', false, 'raised on request to test the alert route'));
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = await runChecks({ simulateFailure: process.argv.includes('--simulate-failure') });
  const failed = results.filter((r) => !r.ok);
  if (process.argv.includes('--json')) console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  else for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}: ${r.detail}`);
  process.exit(failed.length ? 1 : 0);
}
