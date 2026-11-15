const { chromium } = require('@playwright/test');
const path = require('path');

const DEPLOYER_ADDRESS = '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde';
const MEZO_CHAIN_HEX = '0x7b7b';

function injectDeployerWalletScript(addr, chainHex) {
  return `
    (() => {
      const listeners = {};
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: "${addr}",
        chainId: "${chainHex}",
        request: async ({ method }) => {
          if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
            return ["${addr}"];
          }
          if (method === 'eth_chainId') {
            return "${chainHex}";
          }
          if (method === 'net_version') {
            return '31611';
          }
          if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') {
            return null;
          }
          return null;
        },
        on: (evt, cb) => {
          listeners[evt] = listeners[evt] || [];
          listeners[evt].push(cb);
        },
        removeListener: (evt, cb) => {
          listeners[evt] = (listeners[evt] || []).filter((fn) => fn !== cb);
        },
      };
    })();
  `;
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const outputDir = path.join(__dirname, 'docs', 'screenshots');
  const initScript = injectDeployerWalletScript(DEPLOYER_ADDRESS, MEZO_CHAIN_HEX);

  console.log('Capturing connected deployer screenshots from http://localhost:3000 to', outputDir);

  // 1. Dashboard Desktop (1440x900)
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await contextDesktop.addInitScript(initScript);
  const pageDesk = await contextDesktop.newPage();

  console.log('Navigating to /dashboard...');
  await pageDesk.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await pageDesk.waitForSelector('[data-testid="connected-wallet-btn"]', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForSelector('[data-testid="plan-row-0"]', { state: 'visible', timeout: 20000 });
  await pageDesk.waitForSelector('text=Your Plan', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForSelector('text=Wallet:', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForTimeout(800);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'dashboard-desktop.png'),
    fullPage: false,
  });
  console.log('Saved dashboard-desktop.png');

  // 2. Create Plan Desktop (1440x900)
  console.log('Navigating to /create...');
  await pageDesk.goto('http://localhost:3000/create', { waitUntil: 'domcontentloaded' });
  await pageDesk.waitForSelector('[data-testid="connected-wallet-btn"]', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForSelector('input[name="budget"]', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForSelector('text=MUSD Allowance:', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForTimeout(700);
  await pageDesk.waitForFunction(
    () => {
      const txt = document.body.innerText;
      return (
        !txt.includes('Quoting...') &&
        !txt.includes('Fetching Tigris Router') &&
        /Spot ~\$[\d,]+\s*\/\s*BTC/.test(txt) &&
        /~0\.0\d+\s+BTC/.test(txt)
      );
    },
    null,
    { timeout: 20000 }
  );
  await pageDesk.waitForTimeout(200);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'create-plan-desktop.png'),
    fullPage: false,
  });
  console.log('Saved create-plan-desktop.png');

  // 3. Plan Detail Desktop (1440x900)
  console.log('Navigating to /plan/0...');
  await pageDesk.goto('http://localhost:3000/plan/0', { waitUntil: 'domcontentloaded' });
  await pageDesk.waitForSelector('[data-testid="connected-wallet-btn"]', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForSelector('[data-testid="ledger-table"]', { state: 'visible', timeout: 20000 });
  await pageDesk.waitForSelector('text=Connected Owner', { state: 'visible', timeout: 15000 });
  await pageDesk.waitForTimeout(800);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'plan-detail-desktop.png'),
    fullPage: false,
  });
  console.log('Saved plan-detail-desktop.png');

  // 4. Trove Modal on Plan Detail Desktop
  console.log('Opening Trove Modal on /plan/0...');
  const routeBtn = pageDesk.locator('button:has-text("Route Stacked BTC to My Trove")');
  await routeBtn.waitFor({ state: 'visible', timeout: 10000 });
  await routeBtn.click();
  await pageDesk.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  await pageDesk.waitForSelector('button:has-text("Confirm Route")', { state: 'visible', timeout: 10000 });
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'trove-modal.png'),
    fullPage: false,
  });
  console.log('Saved trove-modal.png');

  // 5. Mobile Responsive (390x844)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  await contextMobile.addInitScript(initScript);
  const pageMobile = await contextMobile.newPage();
  console.log('Navigating to /dashboard on mobile...');
  await pageMobile.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await pageMobile.waitForSelector('[data-testid="connected-wallet-btn"]', { state: 'visible', timeout: 15000 });
  await pageMobile.waitForSelector('[data-testid="plan-row-0"]', { state: 'visible', timeout: 20000 });
  await pageMobile.waitForSelector('text=Wallet:', { state: 'visible', timeout: 15000 });
  await pageMobile.waitForTimeout(800);
  await pageMobile.screenshot({
    path: path.join(outputDir, 'mobile-responsive.png'),
    fullPage: false,
  });
  console.log('Saved mobile-responsive.png');

  await browser.close();
  console.log('All screenshots captured successfully.');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
