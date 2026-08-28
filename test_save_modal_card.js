const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Piyush\\.gemini\\antigravity\\brain\\4edee984-3a2a-4850-bac5-a8b8c19f522c';

async function testSaveModalAndLibraryCard() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Click "+ Save Reel"
  await page.click('button[class*="bg-brand-500"]');
  await new Promise(r => setTimeout(r, 1000));

  // Type Instagram URL into modal
  await page.type('input[placeholder*="instagram.com"]', 'https://www.instagram.com/p/DcgK_-KkgYR/');
  await new Promise(r => setTimeout(r, 500));

  // Click Save in modal
  const modalButtons = await page.$$('div[role="dialog"] button, div.fixed button');
  for (const b of modalButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Save') || text.includes('Add')) {
      await b.click();
      console.log("Clicked modal Save button!");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 3000));

  // Screenshot dashboard / library
  await page.goto('https://reeldash-nine.vercel.app/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_dashboard_saved_card.png') });

  await browser.close();
  console.log("Saved card capture complete!");
}

testSaveModalAndLibraryCard().catch(console.error);
