import { describe, it, expect } from 'vitest';
import {
  evaluatePage, evaluateRedirect, evaluateCertificate, evaluateSecurityTxt, evaluateDns,
  evaluateDeploy, evaluateFormAction, evaluateExposure, parseBuild, EXPECTED_FORM_ACTION,
} from '../../scripts/monitor-site.mjs';

const NOW = Date.parse('2026-10-23T00:00:00Z');
const day = (n: number) => new Date(NOW + n * 86_400_000).toUTCString();
const page = `<html><head><meta http-equiv="Content-Security-Policy" content="x"><meta name="intervene-build" content="8e481fa"><title>Intervene</title></head></html>`;

describe('site monitor evaluators', () => {
  it('accepts a healthy page and rejects outage, missing CSP and missing build id', () => {
    expect(evaluatePage('home', 200, page, { build: true }).ok).toBe(true);
    expect(evaluatePage('home', 503, page).ok).toBe(false);
    expect(evaluatePage('home', 404, '').detail).toBe('HTTP 404');
    expect(evaluatePage('home', 200, page.replace('Content-Security-Policy', 'x')).ok).toBe(false);
    expect(evaluatePage('home', 200, page.replace(/<meta name="intervene-build"[^>]*>/, ''), { build: true }).ok).toBe(false);
    expect(evaluatePage('home', 200, '<html>no title</html>').ok).toBe(false);
  });

  it('extracts the build id', () => {
    expect(parseBuild(page)).toBe('8e481fa');
    expect(parseBuild('<html></html>')).toBeNull();
  });

  it('requires a permanent redirect to the https origin', () => {
    expect(evaluateRedirect(301, 'https://intervene.uk/').ok).toBe(true);
    expect(evaluateRedirect(200, null).ok).toBe(false);
    expect(evaluateRedirect(301, 'https://evil.example/').ok).toBe(false);
    expect(evaluateRedirect(302, 'https://intervene.uk/').ok).toBe(false);
  });

  it('flags a certificate that is expired, expiring soon or for the wrong name', () => {
    expect(evaluateCertificate(day(80), NOW).ok).toBe(true);
    expect(evaluateCertificate(day(13), NOW).ok).toBe(false);
    expect(evaluateCertificate(day(14), NOW).ok).toBe(true);
    expect(evaluateCertificate(day(-1), NOW).detail).toMatch(/expired/);
    expect(evaluateCertificate(day(80), NOW, false).ok).toBe(false);
    expect(evaluateCertificate('not a date', NOW).ok).toBe(false);
  });

  it('flags security.txt that is missing, malformed or about to expire', () => {
    const file = (expires: string) => `Contact: https://intervene.uk/contact/\nExpires: ${expires}\n`;
    expect(evaluateSecurityTxt(200, file(new Date(NOW + 300 * 86_400_000).toISOString()), NOW).ok).toBe(true);
    expect(evaluateSecurityTxt(404, '', NOW).ok).toBe(false);
    expect(evaluateSecurityTxt(200, file(new Date(NOW + 10 * 86_400_000).toISOString()), NOW).ok).toBe(false);
    expect(evaluateSecurityTxt(200, file(new Date(NOW - 86_400_000).toISOString()), NOW).detail).toMatch(/expired/);
    expect(evaluateSecurityTxt(200, 'Expires: 2030-01-01T00:00:00Z', NOW).ok).toBe(false);
    expect(evaluateSecurityTxt(200, 'Contact: x', NOW).ok).toBe(false);
  });

  it('flags DNS drift: foreign apex address, broken www, missing MX or SPF', () => {
    const good = { a: ['185.199.108.153', '185.199.111.153'], wwwCname: ['jamessaint.github.io.'], mx: [{}], txt: ['v=spf1 include:secureserver.net -all'] };
    expect(evaluateDns(good).ok).toBe(true);
    expect(evaluateDns({ ...good, a: ['203.0.113.9'] }).detail).toMatch(/outside GitHub Pages/);
    expect(evaluateDns({ ...good, a: [] }).ok).toBe(false);
    expect(evaluateDns({ ...good, wwwCname: ['attacker.example.'] }).ok).toBe(false);
    expect(evaluateDns({ ...good, mx: [] }).ok).toBe(false);
    expect(evaluateDns({ ...good, txt: ['google-site-verification=x'] }).ok).toBe(false);
  });

  it('detects a failed deploy and a live site that is not the last successful deploy', () => {
    const sha = '8e481fa5f8e7c116944ce9ce47d90d0e3f4d5aca';
    expect(evaluateDeploy({ status: 'completed', conclusion: 'success', headSha: sha, url: 'u' }, '8e481fa').ok).toBe(true);
    expect(evaluateDeploy({ status: 'completed', conclusion: 'failure', headSha: sha, url: 'u' }, '8e481fa').ok).toBe(false);
    expect(evaluateDeploy({ status: 'completed', conclusion: 'success', headSha: sha, url: 'u' }, '1111111').detail).toMatch(/differs/);
    expect(evaluateDeploy({ status: 'in_progress', conclusion: null, headSha: sha, url: 'u' }, '1111111').ok).toBe(true);
    expect(evaluateDeploy(null, '8e481fa').ok).toBe(false);
    expect(evaluateDeploy({ status: 'completed', conclusion: 'success', headSha: sha, url: 'u' }, null).ok).toBe(false);
  });

  it('detects a changed contact-form destination', () => {
    const form = (action: string) => `<form class="form" data-contact action="${action}" method="POST">`;
    expect(evaluateFormAction(form(EXPECTED_FORM_ACTION)).ok).toBe(true);
    expect(evaluateFormAction(form('https://evil.example/collect')).ok).toBe(false);
    expect(evaluateFormAction('<p>no form</p>').ok).toBe(false);
  });

  it('fails if any private path is served', () => {
    expect(evaluateExposure([{ path: '/.env', status: 404 }, { path: '/src/', status: 404 }]).ok).toBe(true);
    const bad = evaluateExposure([{ path: '/.env', status: 200 }, { path: '/src/', status: 404 }]);
    expect(bad.ok).toBe(false);
    expect(bad.detail).toContain('/.env');
  });
});
