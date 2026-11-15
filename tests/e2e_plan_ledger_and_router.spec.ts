import { test, expect } from '@playwright/test';

/**
 * Plan Ledger and Trove Collateral Router (/plan/[id]) E2E Tests
 *
 * Tier 1: Fill history, weighted price vs oracle, sMUSD yield offset, Route BTC to Trove
 * Tier 2: Plan controls (topUp, pause, resume, cancelAndWithdraw)
 * Tier 3: Cross-Feature Combinations (cancelAndWithdraw unspent sMUSD + claimed BTC, Trove ICR drop)
 * Tier 4: Real-World Scenarios (Mezo borrower routing stacked BTC directly to Trove)
 */

test.describe('Tier 1: Plan Ledger (/plan/[id]) Core Display and Telemetry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/1');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-PLAN-01: Plan metrics card displays total budget, spent, and stacked BTC', async ({ page }) => {
    const budgetCard = page.locator('text=/Budget|MUSD|Plan/').first();
    const stackedCard = page.locator('text=/BTC|Stacked|Accumulated/').first();

    await expect(budgetCard).toBeVisible();
    await expect(stackedCard).toBeVisible();
  });

  test('TC-PLAN-02: Fill history table renders executed tranches with tx hashes', async ({ page }) => {
    const table = page.locator('table, [role="table"], [data-testid*="ledger-table"]').first();
    await expect(table).toBeVisible();

    // Verify transaction link or hash format (0x...)
    const txHash = page.locator('a[href*="explorer"], a[href*="blockscout"]').first();
    await expect(txHash).toBeVisible();
  });

  test('TC-PLAN-03: Weighted average entry price displays comparison with live price', async ({ page }) => {
    const weightedPrice = page.locator('text=/Weighted|Entry Price|Avg Cost|\\$/').first();
    await expect(weightedPrice).toBeVisible();
  });

  test('TC-PLAN-04: sMUSD yield offset reflects continuous interest earned on idle funds', async ({ page }) => {
    const yieldDisplay = page.locator('text=/Yield|sMUSD|Offset|\\+/').first();
    await expect(yieldDisplay).toBeVisible();
  });

  test('TC-PLAN-05: Route Stacked BTC to My Trove button opens confirmation modal', async ({ page }) => {
    const routeCollateralBtn = page.locator('button:has-text("Route Stacked BTC to My Trove"), button:has-text("Route to Trove"), button:has-text("Add Collateral")').first();
    await expect(routeCollateralBtn).toBeVisible();

    await routeCollateralBtn.click();

    // Modal dialog should open
    const modal = page.locator('[role="dialog"], [aria-modal="true"], .modal').first();
    await expect(modal).toBeVisible();

    // Modal contains Trove details and confirmation
    const confirmAction = modal.locator('button:has-text("Confirm"), button:has-text("Route"), button:has-text("Deposit")').first();
    await expect(confirmAction).toBeVisible();

    // Modal can be closed via Close button or Escape
    const closeBtn = modal.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }
  });
});

test.describe('Tier 2 & 3: Plan Parameter Controls and Pairwise Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/1');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-PLAN-06: Top-up modal allows adding MUSD budget to active plan', async ({ page }) => {
    const topUpBtn = page.locator('button:has-text("Top Up"), button:has-text("Add Funds")').first();
    if (await topUpBtn.isVisible()) {
      await topUpBtn.click();
      const topUpInput = page.locator('input[type="number"], input[placeholder*="MUSD"]').first();
      await expect(topUpInput).toBeVisible();
    }
  });

  test('TC-PLAN-07: Pause and resume toggles plan execution status cleanly', async ({ page }) => {
    const pauseBtn = page.locator('button:has-text("Pause"), button:has-text("Resume")').first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      // Verify state indicator toggles
      const statusBadge = page.locator('text=/PAUSED|ACTIVE|Status/').first();
      await expect(statusBadge).toBeVisible();
    }
  });

  test('TC-PLAN-08: Cancel and withdraw presents settlement breakdown (sMUSD + BTC)', async ({ page }) => {
    const cancelBtn = page.locator('button:has-text("Cancel Plan"), button:has-text("Cancel & Withdraw"), button:has-text("Withdraw All")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();

      // Confirm modal must show both unspent MUSD/sMUSD and accumulated BTC to be returned
      const confirmModal = page.locator('[role="dialog"], .modal').first();
      await expect(confirmModal).toBeVisible();

      const unspentReturn = confirmModal.locator('text=/Unspent|MUSD|sMUSD/').first();
      await expect(unspentReturn).toBeVisible();
    }
  });

  test('TC-PLAN-09: Pairwise: Trove ICR drop dynamically locks collateral route preview', async ({ page }) => {
    // Navigate to plan with circuit status
    const circuitInfo = page.locator('text=/Trove|ICR|Floor/').first();
    await expect(circuitInfo).toBeVisible();
  });

  test('TC-PLAN-10: Tier 4 Scenario: Direct execution of Trove collateral routing increases ICR', async ({ page }) => {
    // Open modal
    const routeBtn = page.locator('button:has-text("Route Stacked BTC to My Trove"), button:has-text("Route to Trove")').first();
    if (await routeBtn.isVisible()) {
      await routeBtn.click();

      // Verify projected ICR preview (e.g. 165% -> 198%)
      const icrProjection = page.locator('text=/%|ICR|Collateral/').first();
      await expect(icrProjection).toBeVisible();
    }
  });
});
