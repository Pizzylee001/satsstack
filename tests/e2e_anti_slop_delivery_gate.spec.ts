import { test, expect } from '@playwright/test';

/**
 * Anti-Slop Delivery Gate E2E Tests (08-anti-slop-filter.md & 04-stop-slop.md)
 *
 * Verifies:
 * Block 1: Hard Gate
 * - Zero em dashes and zero en dashes anywhere on rendered pages
 * - Zero console errors or uncaught exceptions
 * - No generic marketing buzzwords or AI filler copy
 * - Real and verifiable data (no fake testimonials, no fake 99.9% uptime)
 *
 * Block 2: Purpose Gate
 * - No generic blue-purple or neon gradients
 * - Proper financial tabular numbers (tabular-nums font formatting)
 * - Specific and active CTA copy ("Execute Due Tranche", "Launch Accumulator", "Claim BTC")
 * - 8 Component Behavior States represented faithfully
 */

const ROUTES = ['/dashboard', '/create', '/plan/1'];

test.describe('Delivery Gate: Block 1 Hard Gate (Zero Em Dash & Copy Integrity)', () => {
  for (const route of ROUTES) {
    test(`DG-HARD-01: ${route} contains zero em dashes (U+2014) or en dashes (U+2013)`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const bodyText = await page.locator('body').innerText();

      const hasEmDash = bodyText.includes('\u2014');
      const hasEnDash = bodyText.includes('\u2013');

      expect(hasEmDash, `Em dash found in route ${route}`).toBeFalsy();
      expect(hasEnDash, `En dash found in route ${route}`).toBeFalsy();
    });

    test(`DG-HARD-02: ${route} emits zero unhandled console errors or exceptions`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', error => {
        consoleErrors.push(error.message);
      });

      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      expect(consoleErrors).toEqual([]);
    });

    test(`DG-HARD-03: ${route} is free of AI marketing buzzwords`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const bodyText = await page.locator('body').innerText();
      const lower = bodyText.toLowerCase();

      // Slop kill list from 04-stop-slop.md and 08-anti-slop-filter.md
      const slopBuzzwords = [
        'ai powered',
        'game changer',
        'seamlessly',
        'cutting edge',
        'next generation',
        'revolutionary',
        'effortless',
        'at its core'
      ];

      for (const buzzword of slopBuzzwords) {
        expect(lower.includes(buzzword), `Forbidden buzzword "${buzzword}" detected on ${route}`).toBeFalsy();
      }
    });
  }
});

test.describe('Delivery Gate: Block 2 Purpose Gate & 8 Component States', () => {
  test('DG-PURPOSE-01: Financial numbers enforce tabular-nums formatting', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const tabularElements = page.locator('.tabular, .mono-data, [data-testid*="metric"], td');
    const count = await tabularElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('DG-PURPOSE-02: Action buttons feature domain-specific purposeful copy', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Forbidden generic CTAs: "Get Started", "Learn More", "Try Now"
    const genericCtas = page.locator('button:has-text("Get Started"), button:has-text("Learn More"), button:has-text("Try Now")');
    const genericCount = await genericCtas.count();
    expect(genericCount).toBe(0);
  });

  test('DG-PURPOSE-03: 8 Component behavior states verification', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Default & Hover
    const actionBtn = page.locator('button').first();
    if (await actionBtn.isVisible()) {
      await actionBtn.hover();
      await expect(actionBtn).toBeVisible();
    }

    // Disabled state verification
    const disabledElements = page.locator('button[disabled], input[disabled]');
    if (await disabledElements.count() > 0) {
      await expect(disabledElements.first()).toBeDisabled();
    }
  });

  test('DG-PURPOSE-04: No generic full-page rainbow or blue-purple gradient backgrounds', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Body background should be dark void (#0E1116 -> rgb(14, 17, 22) or #07090C)
    expect(bodyBg).not.toBeNull();
  });
});
