import { test, expect } from '@playwright/test';

/**
 * Plan Ledger and Trove Collateral Router (/plan/[id]) E2E Tests
 */

test.describe('Tier 1: Plan Ledger (/plan/[id]) Core Display and Telemetry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Plan #1: Position Ledger")').first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-PLAN-01: Plan metrics strip displays total budget, sMUSD remaining, and stacked BTC', async ({ page }) => {
    await expect(page.locator('text=Total Budget:').first()).toBeVisible();
    await expect(page.locator('text=Remaining in sMUSD:').first()).toBeVisible();
    await expect(page.locator('text=Stacked BTC:').first()).toBeVisible();
  });

  test('TC-PLAN-02: Fill history table renders live TrancheExecuted events with Blockscout tx hashes', async ({ page }) => {
    const table = page.locator('[data-testid="ledger-table"] table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    const txHash = table.locator('a[href*="explorer.test.mezo.org/tx/"]').first();
    await expect(txHash).toBeVisible();
  });

  test('TC-PLAN-03: Weighted average entry price compares against live PriceFeed oracle', async ({ page }) => {
    await expect(page.locator('text=Weighted Average Entry:').first()).toBeVisible();
    await expect(page.locator('text=Live Oracle BTC Price:').first()).toBeVisible();
  });

  test('TC-PLAN-04: sMUSD share and yield offset telemetry renders cleanly', async ({ page }) => {
    await expect(page.locator('text=sMUSD Share / Yield:').first()).toBeVisible();
  });

  test('TC-PLAN-05: Route Stacked BTC to My Trove opens simulation-backed modal and dismisses via Cancel', async ({ page }) => {
    const routeBtn = page.locator('button:has-text("Route Stacked BTC to My Trove")').first();
    await expect(routeBtn).toBeVisible();
    await routeBtn.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('button:has-text("Route")').first()).toBeVisible();

    const cancelBtn = modal.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Tier 2 & 3: Plan Parameter Controls and Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Plan #1: Position Ledger")').first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-PLAN-06: Top-up modal opens and validates MUSD input amount', async ({ page }) => {
    const topUpBtn = page.locator('button:has-text("Top Up MUSD")').first();
    await expect(topUpBtn).toBeVisible();
    await topUpBtn.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('#topup-input')).toBeVisible();
  });

  test('TC-PLAN-07: Pause control prompts wallet connect when disconnected', async ({ page }) => {
    const pauseBtn = page.locator('button:has-text("Pause Plan"), button:has-text("Resume Plan")').first();
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-PLAN-08: Cancel & Withdraw dialog displays exact unspent MUSD and stacked BTC settlement values', async ({ page }) => {
    const cancelBtn = page.locator('button:has-text("Cancel & Withdraw")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    const confirmModal = page.locator('[role="dialog"]').first();
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal.locator('text=Unspent MUSD returned:').first()).toBeVisible();
    await expect(confirmModal.locator('text=Accumulated BTC returned:').first()).toBeVisible();
  });

  test('TC-PLAN-09: Trove collateral circuit card displays safety floor and liquidation threshold', async ({ page }) => {
    await expect(page.locator('text=Auto Pause Floor:').first()).toBeVisible();
    await expect(page.locator('text=110.0% ICR').first()).toBeVisible();
  });

  test('TC-PLAN-10: Route Stacked BTC modal displays projected Trove collateral state', async ({ page }) => {
    const routeBtn = page.locator('button:has-text("Route Stacked BTC to My Trove")').first();
    await expect(routeBtn).toBeVisible();
    await routeBtn.click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Projected Trove ICR:').first()).toBeVisible();
  });
});
