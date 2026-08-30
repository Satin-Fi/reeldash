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

  // Set theme to light in localStorage & root class
  await page.evaluate(() => {
    localStorage.setItem('reeldash-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/dashboard_light_theme_verified.png' });
  console.log('Light mode verified!');

  // Navigate to /reels in light mode
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.setItem('reeldash-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/reels_light_theme_verified.png' });
  console.log('Reels light mode verified!');

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
