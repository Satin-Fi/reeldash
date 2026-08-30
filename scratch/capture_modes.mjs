import { createRequire } from 'module';
const require = createRequire('c:/Users/Piyush/Downloads/Reeldash/package.json');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Dark mode dashboard
  console.log('Navigating to dark dashboard...');
  await page.goto('https://reeldash-nine.vercel.app/dashboard', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/vercel_dashboard_dark.png' });
  console.log('Dark dashboard captured!');

  // Toggle to light mode
  console.log('Toggling theme...');
  const themeBtn = await page.$('button[title="Toggle theme"]');
  if (themeBtn) {
    await themeBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/vercel_dashboard_light.png' });
    console.log('Light dashboard captured!');
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
