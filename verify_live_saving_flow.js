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
  console.log("Logging in...");
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 2. Clear out any old test data in localStorage so we test fresh save
  await page.evaluate(() => {
    const userStr = localStorage.getItem('reeldash_user');
    const user = userStr ? JSON.parse(userStr) : { id: 'usr-123' };
    localStorage.removeItem(`reeldash_reels_${user.id}`);
  });

  // 3. Go to /creator/lifeof.romana
  console.log("Navigating to creator page /creator/lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  // 4. Click the "Save" button on the first reel tile
  console.log("Clicking Save on discovered item tile...");
  const saveButtons = await page.$$('button');
  let clicked = false;
  for (const btn of saveButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.trim() === 'Save') {
      await btn.click();
      clicked = true;
      console.log("Clicked Save button!");
      break;
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  // 5. Navigate to /reels (Library)
  console.log("Navigating to /reels library to verify saved card...");
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  // Capture screenshot of library
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_saved_card_real_thumbnail_and_dp.png') });

  // 6. Click on the saved card to open playback modal
  console.log("Opening playback modal...");
  const card = await page.$('div.group.relative.flex.flex-col');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_saved_modal_real_thumbnail_and_dp.png') });
  }

  await browser.close();
  console.log("All save flow verification screenshots captured!");
}

run().catch(console.error);
