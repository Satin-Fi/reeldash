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

  console.log('Navigating to signup...');
  await page.goto('https://reeldash-nine.vercel.app/signup', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/vercel_new_logo_signup.png' });
  console.log('Signup screenshot captured!');

  console.log('Navigating to dashboard...');
  await page.goto('https://reeldash-nine.vercel.app/dashboard', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/Piyush/.gemini/antigravity/brain/8440ca0a-61da-4c07-a877-85f850d39e18/vercel_new_logo_dashboard.png' });
  console.log('Dashboard screenshot captured!');

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
