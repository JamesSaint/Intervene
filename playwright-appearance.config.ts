import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testMatch: 'appearance.spec.ts',
  workers: 3,
  projects: (['chromium', 'firefox', 'webkit'] as const).flatMap(browserName =>
    [390, 768, 1440].map(width => ({
      name: `${browserName}-${width}`,
      use: { browserName, viewport: { width, height: width === 390 ? 844 : 1000 }, hasTouch: width === 390 },
    }))),
});
