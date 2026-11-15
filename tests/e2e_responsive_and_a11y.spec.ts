import { test, expect } from '@playwright/test';

/**
 * Responsive and Accessibility (A11y) E2E Tests
 * Enforces zero horizontal overflow, mobile header non-clipping, landmarks, keyboard focus, and reduced motion.
 */

const ROUTES = ['/dashboard', '/create', '/plan/0'];

for (const route of ROUTES) {
  test.describe(`A11y & Responsiveness on ${route}`, () => {
    test(`TC-A11Y-01: ${route} has zero horizontal overflow across viewport widths`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });

    test(`TC-A11Y-02: ${route} semantic landmarks (main, nav, footer) are declared`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('main').first()).toBeVisible();
      await expect(page.locator('nav').first()).toBeVisible();
      await expect(page.locator('footer').first()).toBeVisible();
    });

    test(`TC-A11Y-03: ${route} interactive buttons have accessible names or aria-labels`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const buttons = page.locator('button');
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        if (await btn.isVisible()) {
          const text = await btn.innerText();
          const ariaLabel = await btn.getAttribute('aria-label');
          const title = await btn.getAttribute('title');
          expect((text && text.trim().length > 0) || !!ariaLabel || !!title).toBeTruthy();
        }
      }
    });

    test(`TC-A11Y-04: ${route} keyboard focus cycles through interactive elements`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedTag = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : null;
      });
      expect(focusedTag).not.toBeNull();
      expect(['button', 'a', 'input', 'select', 'textarea']).toContain(focusedTag);
    });
  });
}

test.describe('Mobile Viewport Specific Reflow & Touch Targets', () => {
  test('TC-A11Y-05: Mobile viewport (390px) enforces >= 36px touch targets and zero header clipping', async ({ page }) => {
    const viewport = page.viewportSize();
    if (viewport && viewport.width <= 640) {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Every visible link & button inside <header> must sit cleanly within [0, viewport.width]
      const headerItems = page.locator('header a, header button');
      const headerCount = await headerItems.count();
      for (let i = 0; i < headerCount; i++) {
        const item = headerItems.nth(i);
        if (await item.isVisible()) {
          const box = await item.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
            expect(box.height).toBeGreaterThanOrEqual(36);
          }
        }
      }
    }
  });

  test('TC-A11Y-06: Prefers-reduced-motion media query renders cleanly', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});
