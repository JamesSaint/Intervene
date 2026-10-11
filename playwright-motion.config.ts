import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

// Run the rendered-motion regressions in each browser engine. Keep the
// same built preview and server behaviour as the complete site suite.
export default defineConfig({
  ...baseConfig,
  testMatch: ['motion-reliability.spec.ts', 'motion-language.spec.ts', 'motion-enhancements.spec.ts'],
  workers: 3,
  use: {
    ...baseConfig.use,
    contextOptions: { ...baseConfig.use?.contextOptions, reducedMotion: 'no-preference' },
  },
  projects: (['chromium', 'webkit', 'firefox'] as const).flatMap(browserName =>
    [390, 1440].map(width => ({
      name: `${browserName}-${width}`,
      use: {
        browserName,
        viewport: { width, height: width === 390 ? 844 : 1000 },
        hasTouch: width === 390,
        // A narrow desktop viewport does not reproduce mobile Safari's
        // viewport behaviour. Firefox does not support mobile emulation.
        isMobile: width === 390 && browserName !== 'firefox',
        deviceScaleFactor: width === 390 ? 3 : 1,
      },
    }))
  ),
});
