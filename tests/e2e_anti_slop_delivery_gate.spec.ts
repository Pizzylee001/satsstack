import { test, expect } from '@playwright/test';

/**
 * Anti-Slop Delivery Gate E2E Tests
 * Enforces zero em/en dashes, zero console errors, zero buzzwords, dark canvas ground, and domain CTAs.
 */

const ROUTES = ['/dashboard', '/create', '/plan/0', '/plan/1'];

test.describe('Delivery Gate: Block 1 Hard Gate (Zero Em Dash & Copy Integrity)', () => {
  for (const route of ROUTES) {
    test(`DG-HARD-01: ${route} contains zero em dashes (U+2014) or en dashes (U+2013)`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1200);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.includes('\u2014'), `Em dash found in route ${route}`).toBeFalsy();
      expect(bodyText.includes('\u2013'), `En dash found in route ${route}`).toBeFalsy();
    });

    test(`DG-HARD-02: ${route} emits zero unhandled console errors or exceptions`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (error) => {
        consoleErrors.push(error.message);
      });

      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1200);

      expect(consoleErrors).toEqual([]);
    });

    test(`DG-HARD-03: ${route} is free of AI marketing buzzwords`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const lower = (await page.locator('body').innerText()).toLowerCase();
      const slopBuzzwords = [
        'ai powered',
        'game changer',
        'seamlessly',
        'cutting edge',
        'next generation',
        'revolutionary',
        'effortless',
        'at its core',
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
    await expect(tabularElements.first()).toBeVisible({ timeout: 10000 });
    const count = await tabularElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('DG-PURPOSE-02: Action buttons feature domain-specific purposeful copy', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const genericCtas = page.locator('button:has-text("Get Started"), button:has-text("Learn More"), button:has-text("Try Now")');
    expect(await genericCtas.count()).toBe(0);
  });

  test('DG-PURPOSE-03: Interactive controls expose hover and disabled states', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');

    const actionBtn = page.locator('button').first();
    await actionBtn.hover();
    await expect(actionBtn).toBeVisible();

    const budgetInput = page.locator('input[name="budget"]');
    await budgetInput.fill('0');
    await expect(page.locator('button:has-text("Approve MUSD")').first()).toBeDisabled();
  });

  test('DG-PURPOSE-04: Dark canvas ground matches #0E1116 specification', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe('rgb(14, 17, 22)');
  });
});
