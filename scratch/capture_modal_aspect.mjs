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

  // Navigate to login
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'load' });
  await page.type('input[type="email"]', 'creator@reeldash.app');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Navigate to /reels
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));

  // Click on the first card
  const cards = await page.$$('.aspect-reel');
  if (cards.length > 0) {
    await cards[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }

  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/reel_modal_open_success.png' });
  console.log('Reel modal open success captured!');

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
