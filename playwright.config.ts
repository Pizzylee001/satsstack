import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for SatsStack
 *
 * Strict Quality Gates:
 * 1. Viewports:
 *    - Mobile: 390x844 (iPhone 12 / 13 / 14 / 15 baseline)
 *    - Tablet: 768x1024 (iPad Portrait baseline)
 *    - Laptop: 1024x768 (Compact Desktop baseline)
 *    - Desktop: 1440x960 (Primary Desktop baseline)
 * 2. Strict checks:
 *    - Zero uncaught console errors or exceptions
 *    - WCAG AA contrast (minimum 4.5:1 for body text, 3:1 for large display)
 *    - Visible focus rings (:focus-visible)
 *    - Tabular numbers on numerical columns (font-variant-numeric: tabular-nums)
 *    - Zero em dashes and zero en dashes anywhere
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/e2e-report.json' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: {
        viewport: { width: 1440, height: 960 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SatsStackE2E/Desktop',
      },
    },
    {
      name: 'laptop-1024',
      use: {
        viewport: { width: 1024, height: 768 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SatsStackE2E/Laptop',
      },
    },
    {
      name: 'tablet-768',
      use: {
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 SatsStackE2E/Tablet',
      },
    },
    {
      name: 'mobile-390',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 SatsStackE2E/Mobile',
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
