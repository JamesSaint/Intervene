import { defineConfig, devices } from '@playwright/test';

// Loopback by numeric address, not "localhost": on this machine the name
// resolves to ::1 first, where an unrelated dev server may be listening.
// PW_PORT lets a run target a preview on another port, for example a
// production build kept up for review on 4399.
const HOST = '127.0.0.1';
const PORT = Number(process.env.PW_PORT ?? 4321);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Pixel 5 rather than an iPhone profile: it runs on Chromium, so the
    // suite needs one browser download rather than two. Add a WebKit
    // project when there is a reason to test Safari specifically.
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host ${HOST} --port ${PORT}`,
    url: `http://${HOST}:${PORT}/readiness-snapshot/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
