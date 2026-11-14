import { defineConfig, devices } from '@playwright/test';

// Firefox and WebKit pass over the homepage and the treated pages. The main suite runs on Chromium
// only, to need one browser download; this config is for a release check and
// expects a production preview to be running already (PW_PORT, default 4173).
const PORT = Number(process.env.PW_PORT ?? 4173);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['homepage-instruments.spec.ts', 'site-pages.spec.ts', 'refinement.spec.ts', 'offers.spec.ts'],
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-phone', use: { ...devices['iPhone 13'] } },
  ],
});
