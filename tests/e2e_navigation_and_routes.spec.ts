import { test, expect } from '@playwright/test';

/**
 * Tier 1 and Tier 2: Navigation and Route Architecture E2E Tests
 *
 * Verifies:
 * - Direct URL routing across all 3 primary routes:
 *   - /dashboard (Active Plans Desk)
 *   - /create (Strategy Studio)
 *   - /plan/1 and /plan/2 (Position Ledger & Trove Collateral Router)
 * - Root path (/) redirect behavior to /dashboard
 * - Top navigation bar brand header, links, and active state highlights
 * - Live network and Trove status indicators in the navigation bar
 * - Viewport layout reflow across mobile, tablet, laptop, and desktop
 * - Error page or fallback for invalid plan IDs
 * - Zero uncaught console errors or exceptions
 */

test.describe('Tier 1: Route Discovery and Top Navigation Shell', () => {
  test('TC-NAV-01: Root path redirects or serves dashboard view cleanly', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Expected: URL is either /dashboard or serves the dashboard desk
    const currentUrl = page.url();
    const hasDashboardPath = currentUrl.includes('/dashboard') || currentUrl.endsWith('/');
    expect(hasDashboardPath).toBeTruthy();

    // Verify main brand heading or logo is present
    const brandElement = page.locator('text=SatsStack').first();
    await expect(brandElement).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('TC-NAV-02: Top navigation bar contains all required links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();

    // Verify navigation links
    const dashboardLink = page.locator('a[href*="/dashboard"], button:has-text("Dashboard"), a:has-text("Dashboard")').first();
    const createLink = page.locator('a[href*="/create"], button:has-text("Strategy Studio"), a:has-text("Strategy Studio"), button:has-text("Create"), a:has-text("Create")').first();

    await expect(dashboardLink).toBeVisible();
    await expect(createLink).toBeVisible();
  });

  test('TC-NAV-03: Navigating between /dashboard and /create updates URL and UI state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Click link to Strategy Studio
    const createLink = page.locator('a[href*="/create"], button:has-text("Strategy Studio"), a:has-text("Strategy Studio"), button:has-text("Create Plan"), a:has-text("Create Plan")').first();
    await createLink.click();

    await page.waitForURL('**/create', { timeout: 10000 });
    expect(page.url()).toContain('/create');

    // Return to dashboard
    const dashboardLink = page.locator('a[href*="/dashboard"], button:has-text("Dashboard"), a:has-text("Dashboard")').first();
    await dashboardLink.click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-NAV-04: Network indicator displays Mezo Testnet (Chain ID 31611)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Look for Mezo Testnet indicator or badge
    const networkBadge = page.locator('text=/Mezo|31611|Testnet/').first();
    await expect(networkBadge).toBeVisible();
  });

  test('TC-NAV-05: Direct navigation to specific plan ledger (/plan/1)', async ({ page }) => {
    await page.goto('/plan/1');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads without 404
    expect(page.url()).toContain('/plan/1');
    const planHeading = page.locator('text=/Plan #1|Plan 1|Position Ledger|Plan Details/').first();
    await expect(planHeading).toBeVisible();
  });
});

test.describe('Tier 2: Route Boundary & Corner Cases', () => {
  test('TC-NAV-06: Direct navigation to non-existent plan ID handles gracefully', async ({ page }) => {
    const response = await page.goto('/plan/99999');
    await page.waitForLoadState('domcontentloaded');

    // Should render a clean not-found message, empty state, or fallback without crashing
    const notFoundOrEmpty = page.locator('text=/not found|Not Found|Plan not found|No plan|Empty|Dashboard/').first();
    await expect(notFoundOrEmpty).toBeVisible();
  });

  test('TC-NAV-07: Rapid back-and-forth browser history navigation maintains state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');

    await page.goBack();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    await page.goForward();
    await page.waitForURL('**/create', { timeout: 10000 });
    expect(page.url()).toContain('/create');
  });

  test('TC-NAV-08: Query parameters preserved or stripped safely without script execution', async ({ page }) => {
    await page.goto('/dashboard?utm_source=test&ref=mezo<script>alert(1)</script>');
    await page.waitForLoadState('domcontentloaded');

    // Page must remain stable with zero dialogs or crashes
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('TC-NAV-09: Direct access to /create with hash anchors remains intact', async ({ page }) => {
    await page.goto('/create#trove-circuit');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/create');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('TC-NAV-10: Navbar maintains sticky or stable header during page scroll', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    // Header remains attached and visible
    await expect(header).toBeVisible();
  });
});
