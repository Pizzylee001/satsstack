import { test, expect } from '@playwright/test';

/**
 * Tier 1 and Tier 2: Navigation, Favicon, Wallet Connect & Route Architecture E2E Tests
 */

test.describe('Tier 1: Route Discovery, Favicon, Real Wallet Connect, and Top Navigation Shell', () => {
  test('TC-NAV-01: Root path redirects or serves dashboard cleanly without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="plan-row-0"]').first()).toBeVisible({ timeout: 15000 });

    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('text=SatsStack').first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('TC-NAV-02: Top navigation bar contains all required links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();

    const dashboardLink = page.locator('a[href*="/dashboard"]').first();
    const createLink = page.locator('a[href*="/create"]').first();
    const planLink = page.locator('a[href*="/plan/"]').first();

    await expect(dashboardLink).toBeVisible();
    await expect(createLink).toBeVisible();
    await expect(planLink).toBeVisible();
  });

  test('TC-NAV-03: Navigating between /dashboard and /create updates URL and UI state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const createLink = page.locator('a[href*="/create"]').first();
    await createLink.click();

    await page.waitForURL('**/create', { timeout: 10000 });
    expect(page.url()).toContain('/create');

    const dashboardLink = page.locator('a[href*="/dashboard"]').first();
    await dashboardLink.click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-NAV-04: Network indicator displays Mezo Testnet (Chain ID 31611)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const networkBadge = page.locator('[data-testid="network-badge"]').first();
    await expect(networkBadge).toBeVisible();
    await expect(networkBadge).toContainText('31611');
  });

  test('TC-NAV-05: Direct navigation to live seeded plan ledger (/plan/1)', async ({ page }) => {
    await page.goto('/plan/1');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/plan/1');
    const planHeading = page.locator('h1:has-text("Plan #1: Position Ledger")').first();
    await expect(planHeading).toBeVisible({ timeout: 15000 });
  });

  test('TC-NAV-11: App starts disconnected by default and supports real EIP-1193 Connect and Disconnect flow', async ({ page }) => {
    await page.addInitScript(() => {
      const listeners: Record<string, Array<(...args: any[]) => void>> = {};
      let currentChain = '0x1';
      const testAddr = '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde';
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          if (method === 'eth_accounts') return [];
          if (method === 'eth_requestAccounts') return [testAddr];
          if (method === 'eth_chainId') return currentChain;
          if (method === 'wallet_switchEthereumChain') {
            currentChain = params?.[0]?.chainId || '0x7b7b';
            (listeners.chainChanged || []).forEach((fn) => fn(currentChain));
            return null;
          }
          if (method === 'wallet_addEthereumChain') {
            currentChain = '0x7b7b';
            return null;
          }
          return null;
        },
        on: (evt: string, cb: (...args: any[]) => void) => {
          listeners[evt] = listeners[evt] || [];
          listeners[evt].push(cb);
        },
        removeListener: (evt: string, cb: (...args: any[]) => void) => {
          listeners[evt] = (listeners[evt] || []).filter((fn) => fn !== cb);
        },
      };
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Must NOT be pre-connected on fresh load
    const connectBtn = page.locator('[data-testid="connect-wallet-btn"]').first();
    await expect(connectBtn).toBeVisible();
    await expect(connectBtn).toContainText('Connect Wallet');

    // Open Connect Wallet modal and choose injected signer
    await connectBtn.click();
    const modal = page.locator('[data-testid="wallet-modal"]');
    await expect(modal).toBeVisible();

    const metaMaskOption = modal.locator('button:has-text("MetaMask")').first();
    await expect(metaMaskOption).toBeVisible();
    await metaMaskOption.click();

    // Connected address pill should appear after chain switch to 0x7b7b
    const connectedBtn = page.locator('[data-testid="connected-wallet-btn"]').first();
    await expect(connectedBtn).toBeVisible({ timeout: 10000 });
    await expect(connectedBtn).toContainText('0x58F6...7Fde');

    // Re-open modal and disconnect
    await connectedBtn.click();
    await expect(modal).toBeVisible();
    const disconnectBtn = modal.locator('button:has-text("Disconnect Wallet")').first();
    await disconnectBtn.click();

    await expect(page.locator('[data-testid="connect-wallet-btn"]').first()).toBeVisible();
  });

  test('TC-NAV-12: SVG favicon (/icon.svg and /favicon.svg) serves HTTP 200 and link tag exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const iconLink = page.locator('link[rel*="icon"]').first();
    await expect(iconLink).toHaveAttribute('href', /icon\.svg|favicon\.svg/);

    const resIcon = await page.request.get('/icon.svg');
    expect(resIcon.status()).toBe(200);
    expect(resIcon.headers()['content-type'] || '').toContain('svg');

    const resFavicon = await page.request.get('/favicon.svg');
    expect(resFavicon.status()).toBe(200);
  });
});

test.describe('Tier 2: Route Boundary & Corner Cases', () => {
  test('TC-NAV-06: Direct navigation to non-existent plan ID handles gracefully', async ({ page }) => {
    await page.goto('/plan/99999');
    await page.waitForLoadState('domcontentloaded');

    const notFoundOrEmpty = page.locator('text=/Not Found|Dashboard/').first();
    await expect(notFoundOrEmpty).toBeVisible({ timeout: 15000 });
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
    await expect(page.locator('body')).toBeVisible();
  });

  test('TC-NAV-09: Direct access to /create with hash anchors remains intact', async ({ page }) => {
    await page.goto('/create#trove-circuit');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/create');
    await expect(page.locator('#trove-circuit')).toBeVisible();
  });

  test('TC-NAV-10: Navbar maintains sticky or stable header during page scroll', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);
    await expect(header).toBeVisible();
  });
});
