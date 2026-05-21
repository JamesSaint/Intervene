import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jamessaint.github.io',
  base: '/Intervene',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
