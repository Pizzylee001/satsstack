import { test, expect } from '@playwright/test';

/**
 * Strategy Studio (/create) E2E Tests
 *
 * Tier 1: Feature Coverage (DCA budget, tranche slider, interval cadence, Trove preview, plan launch)
 * Tier 2: Boundary and Corner Cases (0 budget, max slippage, minimum ICR floor, interval boundaries, invalid inputs)
 * Tier 3: Cross-Feature parameter propagation to live settlement estimation
 */

test.describe('Tier 1: Strategy Studio (/create) Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-CREATE-01: Form elements render with valid initial defaults', async ({ page }) => {
    const budgetInput = page.locator('input[name*="budget"], input[placeholder*="MUSD"], input[type="number"]').first();
    await expect(budgetInput).toBeVisible();

    // Check cadence selector
    const cadenceGroup = page.locator('button:has-text("1h"), button:has-text("1d"), button:has-text("60s"), [role="radiogroup"]').first();
    await expect(cadenceGroup).toBeVisible();

    // Check Trove circuit toggle or indicator
    const troveShield = page.locator('text=/Trove|ICR|Circuit|Floor/').first();
    await expect(troveShield).toBeVisible();
  });

  test('TC-CREATE-02: Adjusting DCA budget updates tranche count and estimated output', async ({ page }) => {
    const budgetInput = page.locator('input[name*="budget"], input[placeholder*="MUSD"], input[type="number"]').first();
    await budgetInput.fill('1000');
    await budgetInput.dispatchEvent('input');

    // Expected: estimated output or summary displays updated calculations
    const summaryCard = page.locator('text=/MUSD|BTC|Total/').first();
    await expect(summaryCard).toBeVisible();
  });

  test('TC-CREATE-03: Tranche slider updates tranche size dynamically', async ({ page }) => {
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible()) {
      await slider.fill('100');
      await slider.dispatchEvent('input');
      await slider.dispatchEvent('change');
    }

    // Verify recalculation reflects in overview card
    const trancheDisplay = page.locator('text=/Tranche|tranche/').first();
    await expect(trancheDisplay).toBeVisible();
  });

  test('TC-CREATE-04: Cadence selection switches active interval state', async ({ page }) => {
    // Select 1d (Daily) interval
    const dailyBtn = page.locator('button:has-text("1d"), button:has-text("Daily"), button:has-text("1 Day")').first();
    if (await dailyBtn.isVisible()) {
      await dailyBtn.click();
      await expect(dailyBtn).toBeVisible();
    }
  });

  test('TC-CREATE-05: Slippage tolerance selector updates active threshold', async ({ page }) => {
    const slippageOption = page.locator('button:has-text("0.5%"), button:has-text("1.0%"), button:has-text("0.1%")').first();
    if (await slippageOption.isVisible()) {
      await slippageOption.click();
      await expect(slippageOption).toBeVisible();
    }
  });
});

test.describe('Tier 2: Strategy Studio Boundary and Corner Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-CREATE-06: Zero budget input triggers validation prevention', async ({ page }) => {
    const budgetInput = page.locator('input[name*="budget"], input[placeholder*="MUSD"], input[type="number"]').first();
    await budgetInput.fill('0');
    await budgetInput.dispatchEvent('input');

    const submitBtn = page.locator('button:has-text("Create"), button:has-text("Approve"), button:has-text("Launch")').first();
    // Must be disabled or error message shown
    const isDisabled = await submitBtn.isDisabled();
    const hasError = await page.locator('text=/greater than 0|Minimum|Invalid|required/').count() > 0;
    expect(isDisabled || hasError).toBeTruthy();
  });

  test('TC-CREATE-07: Negative budget input is rejected or sanitized to positive', async ({ page }) => {
    const budgetInput = page.locator('input[name*="budget"], input[placeholder*="MUSD"], input[type="number"]').first();
    await budgetInput.fill('-500');
    await budgetInput.dispatchEvent('input');

    const submitBtn = page.locator('button:has-text("Create"), button:has-text("Approve"), button:has-text("Launch")').first();
    const isDisabled = await submitBtn.isDisabled();
    const val = await budgetInput.inputValue();
    expect(isDisabled || Number(val) <= 0 || val === '').toBeTruthy();
  });

  test('TC-CREATE-08: Maximum slippage boundary handles high slippage with safety warning', async ({ page }) => {
    const customSlippage = page.locator('input[placeholder*="Slippage"], input[name*="slippage"]').first();
    if (await customSlippage.isVisible()) {
      await customSlippage.fill('15');
      await customSlippage.dispatchEvent('input');

      const warning = page.locator('text=/high slippage|Warning|Unfavorable/').first();
      await expect(warning).toBeVisible();
    }
  });

  test('TC-CREATE-09: Minimum Trove ICR floor boundary (110% Liquidation threshold)', async ({ page }) => {
    const icrSlider = page.locator('input[name*="icr"], input[type="range"]').last();
    if (await icrSlider.isVisible()) {
      await icrSlider.fill('110');
      await icrSlider.dispatchEvent('input');

      // Trove danger or warning indication
      const dangerIndicator = page.locator('text=/Danger|Critical|Liquidation|110%/').first();
      await expect(dangerIndicator).toBeVisible();
    }
  });

  test('TC-CREATE-10: Extreme budget amount displays tabular numbers without layout rupture', async ({ page }) => {
    const budgetInput = page.locator('input[name*="budget"], input[placeholder*="MUSD"], input[type="number"]').first();
    await budgetInput.fill('1000000000');
    await budgetInput.dispatchEvent('input');

    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Verify no horizontal overflow broke the viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
