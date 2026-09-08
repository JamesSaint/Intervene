import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://intervene.uk',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
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
        !page.includes('/method/') &&
        !page.includes('/legal/') &&
        !page.includes('/readiness-snapshot/'),
    }),
  ],
});
