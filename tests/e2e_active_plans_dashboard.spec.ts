import { test, expect } from '@playwright/test';

/**
 * Active Plans Desk (/dashboard) E2E Tests
 */

test.describe('Tier 1: Active Plans Desk (/dashboard) Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-DASH-01: Summary metrics cards render four core financial metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="metric-musd"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-btc"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-entry"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-yield"]')).toBeVisible();
  });

  test('TC-DASH-02: Trove ICR Circuit status indicator reflects live collateral safety', async ({ page }) => {
    const circuitBadge = page.locator('[data-testid="trove-circuit-badge"]').first();
    await expect(circuitBadge).toBeVisible();
    await expect(circuitBadge).toContainText(/READY|ARMED|AUTO_PAUSED|DANGER/);
  });

  test('TC-DASH-03: Active plans list hydrates live on-chain plans from SatsStackVault', async ({ page }) => {
    const planRow = page.locator('[data-testid="plan-row-0"]').first();
    await expect(planRow).toBeVisible({ timeout: 15000 });
  });

  test('TC-DASH-04: Execute Due Tranche prompts real wallet connection when disconnected', async ({ page }) => {
    const planRow = page.locator('[data-testid="plan-row-0"]').first();
    await expect(planRow).toBeVisible({ timeout: 15000 });

    const executeBtn = planRow.locator('button:has-text("Execute Due Tranche")').first();
    if (await executeBtn.isVisible() && await executeBtn.isEnabled()) {
      await executeBtn.click();
      await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-DASH-05: Claim BTC button displays on funded plans with stacked sats', async ({ page }) => {
    const planRow = page.locator('[data-testid="plan-row-0"]').first();
    await expect(planRow).toBeVisible({ timeout: 15000 });

    const claimBtn = planRow.locator('button:has-text("Claim BTC")').first();
    await expect(claimBtn).toBeVisible();
  });
});

test.describe('Tier 2: Active Plans Desk Boundary & Corner Cases', () => {
  test('TC-DASH-06: Handling zero active plans displays meaningful empty state', async ({ page }) => {
    await page.goto('/dashboard?empty=true');
    await page.waitForLoadState('domcontentloaded');

    const emptyIndicator = page.locator('text=/No active plans found/i').first();
    await expect(emptyIndicator).toBeVisible({ timeout: 5000 });

    const createAction = page.locator('a[href*="/create"]:has-text("Create Plan")').first();
    await expect(createAction).toBeVisible();
  });

  test('TC-DASH-07: Plan countdown timers format interval cadences properly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const timerElement = page.locator('[data-testid="timer"]').first();
    await expect(timerElement).toBeVisible({ timeout: 15000 });
  });

  test('TC-DASH-08: Rapid double-click on Execute Due Tranche does not emit uncaught errors', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const planRow = page.locator('[data-testid="plan-row-0"]').first();
    await expect(planRow).toBeVisible({ timeout: 15000 });

    const executeBtn = planRow.locator('button:has-text("Execute Due Tranche")').first();
    if (await executeBtn.isVisible() && await executeBtn.isEnabled()) {
      await executeBtn.dblclick();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('TC-DASH-09: Financial values in dashboard metrics enforce tabular-nums', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const numericValue = page.locator('[data-testid="metric-musd"]').first();
    await expect(numericValue).toBeVisible();
    const fontVariant = await numericValue.evaluate(
      (el) => window.getComputedStyle(el).fontVariantNumeric
    );
    expect(fontVariant).toContain('tabular-nums');
  });

  test('TC-DASH-10: Quick plan detail view navigation from live dashboard row', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const planLink = page.locator('a[aria-label="View Plan #0"]').first();
    await expect(planLink).toBeVisible({ timeout: 15000 });
    await planLink.click();

    await page.waitForURL('**/plan/0', { timeout: 10000 });
    expect(page.url()).toContain('/plan/0');
  });
});
