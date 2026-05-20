import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://intervene.group',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
