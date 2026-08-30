import { createRequire } from 'module';
const require = createRequire('c:/Users/Piyush/Downloads/Reeldash/package.json');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 390, height: 844 }, // Mobile viewport matching user's phone
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

  // Navigate to /reels?type=post on mobile
  await page.goto('https://reeldash-nine.vercel.app/reels?type=post', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));

  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/mobile_empty_state_clean.png' });
  console.log('Mobile empty state screenshot captured!');

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
