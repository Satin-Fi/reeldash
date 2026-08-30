const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Piyush\\.gemini\\antigravity\\brain\\4edee984-3a2a-4850-bac5-a8b8c19f522c';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });

  // Click "Continue with Google"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Continue with Google')) {
      await btn.click();
      break;
    }
  }

  // Wait for navigation to Google OAuth screen
  await new Promise(r => setTimeout(r, 4000));
  const currentUrl = page.url();
  console.log('Current URL after Google click:', currentUrl);

  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_google_consent_screen.png') });
  await browser.close();
}

run().catch(console.error);
