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

  // 1. Login
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 2. Open Save Modal
  await page.click('button[class*="bg-brand-500"]');
  await new Promise(r => setTimeout(r, 1000));

  // 3. Type URL
  await page.type('input[placeholder*="instagram.com"]', 'https://www.instagram.com/p/DcgK_-KkgYR/');
  await new Promise(r => setTimeout(r, 1500));

  // 4. Submit form
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  });
  await new Promise(r => setTimeout(r, 3000));

  // 5. Screenshot Reels library page
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_library_card_avatar_verified.png') });

  // 6. Click card to open playback modal
  const card = await page.$('div.group.relative.flex.flex-col');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_playback_modal_avatar_verified.png') });
  }

  await browser.close();
  console.log("Completed!");
}

run().catch(console.error);
