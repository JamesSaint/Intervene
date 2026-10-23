import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cspIntegration from './scripts/csp-integration.mjs';

export default defineConfig({
  site: 'https://intervene.uk',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
  // Astro 7 defaults to JSX whitespace rules, which drop the space at line
  // breaks between text and inline elements ("the intervention chain" becomes
  // "theintervention chain"). `true` is the lossless mode that keeps Astro 4 output.
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  integrations: [
    sitemap({
      // Exclude noindex/internal pages and the /method/ redirect stub.
      // /readiness-snapshot/ is withdrawn while its result is a worked
      // example rather than a reading of the visitor's answers. The route
      // stays live and carries a notice; it is simply not advertised.
      filter: (page) =>
        !page.includes('/style-guide/') &&
        !page.includes('/signature/') &&
        !page.includes('/method/') &&
        !page.includes('/legal/') &&
        !page.includes('/readiness-snapshot/'),
    }),
    // Meta CSP and referrer policy, computed from the built pages.
    cspIntegration(),
  ],
});
