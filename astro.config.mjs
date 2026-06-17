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
      filter: (page) =>
        !page.includes('/style-guide/') &&
        !page.includes('/method/') &&
        !page.includes('/legal/'),
    }),
  ],
});
