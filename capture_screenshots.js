const { chromium } = require('@playwright/test');
const path = require('path');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const outputDir = path.join(__dirname, 'docs', 'screenshots');

  console.log('Capturing screenshots from http://localhost:3000 to', outputDir);

  // 1. Dashboard Desktop (1440x900)
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const pageDesk = await contextDesktop.newPage();

  console.log('Navigating to /dashboard...');
  await pageDesk.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'dashboard-desktop.png'),
    fullPage: false,
  });
  console.log('Saved dashboard-desktop.png');

  // 2. Create Plan Desktop (1440x900)
  console.log('Navigating to /create...');
  await pageDesk.goto('http://localhost:3000/create', { waitUntil: 'networkidle' });
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'create-plan-desktop.png'),
    fullPage: false,
  });
  console.log('Saved create-plan-desktop.png');

  // 3. Plan Detail Desktop (1440x900)
  console.log('Navigating to /plan/0...');
  await pageDesk.goto('http://localhost:3000/plan/0', { waitUntil: 'networkidle' });
  await pageDesk.waitForTimeout(1000);
  await pageDesk.screenshot({
    path: path.join(outputDir, 'plan-detail-desktop.png'),
    fullPage: false,
  });
  console.log('Saved plan-detail-desktop.png');

  // 4. Trove Modal on Plan Detail Desktop
  console.log('Opening Trove Modal on /plan/0...');
  const routeBtn = pageDesk.locator('button:has-text("Route Stacked BTC to My Trove")');
  if (await routeBtn.count() > 0 && !(await routeBtn.isDisabled())) {
    await routeBtn.click();
    await pageDesk.waitForSelector('[role="dialog"]', { state: 'visible' });
    await pageDesk.waitForTimeout(500);
    await pageDesk.screenshot({
      path: path.join(outputDir, 'trove-modal.png'),
      fullPage: false,
    });
    console.log('Saved trove-modal.png');
  } else {
    console.log('Button not clickable or not found, inspecting alternative...');
  }

  // 5. Mobile Responsive (390x844)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const pageMobile = await contextMobile.newPage();
  console.log('Navigating to /dashboard on mobile...');
  await pageMobile.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);
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
