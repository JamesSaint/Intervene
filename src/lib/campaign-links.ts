/**
 * Short campaign links: /r/<slug> forwards to a card on /insights/ or to a PDF.
 *
 * GitHub Pages cannot send a 302, so each link is a static stub that forwards
 * in the browser, as /method/ does. It is not an HTTP redirect. The stub
 * carries the query string across (`?src=li&c=wave1`), placed before any
 * fragment. Without JavaScript the meta refresh still forwards, but the query
 * string is dropped; the body link is the last fallback.
 *
 * Each slug is built twice, as /r/<slug>.html and /r/<slug>/index.html, so
 * the link resolves with or without a trailing slash.
 *
 * Routing is not attribution. The query string reaches the browser's address
 * bar only: Analytics.astro removes it before Google Analytics loads, so no
 * campaign parameter is measured. See docs/analytics-events.md.
 *
 * Once a slug has gone out in an email it must keep resolving.
 */
import { downloadGroups, PDF_BASE } from './insight-downloads';

export const campaignLinks: Record<string, string> = {
  ...Object.fromEntries(
    downloadGroups.flatMap((g) => g.items).map((d) => [d.id, `/insights/#${d.id}`]),
  ),
  // The version without prices, sent to cold contacts. Hosted, not listed.
  'agda-overview': `${PDF_BASE}intervene-agda-overview.pdf`,
};

export const campaignPaths = () => Object.keys(campaignLinks).map((slug) => ({ params: { slug } }));

export function campaignStub(slug: string): Response {
  const target = campaignLinks[slug];
  const [path, fragment = ''] = target.split('#');
  const hash = fragment ? `#${fragment}` : '';
  const html = `<!DOCTYPE html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Intervene</title>
    <meta name="robots" content="noindex, follow" />
    <script>window.location.replace(${JSON.stringify(path)} + window.location.search + ${JSON.stringify(hash)});</script>
    <meta http-equiv="refresh" content="0; url=${target}" />
  </head>
  <body>
    <p>This link forwards to <a href="${target}">intervene.uk${target}</a>.</p>
  </body>
</html>
`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
