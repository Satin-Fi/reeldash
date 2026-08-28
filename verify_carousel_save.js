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

  // 2. Clear out localStorage
  await page.evaluate(() => {
    const userStr = localStorage.getItem('reeldash_user');
    const user = userStr ? JSON.parse(userStr) : { id: 'usr-123' };
    localStorage.removeItem(`reeldash_reels_${user.id}`);
  });

  // 3. Go to /creator/lifeof.romana
  console.log("Navigating to creator page...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  // 4. Click the "Posts" tab
  console.log("Clicking Posts tab...");
  const tabButtons = await page.$$('button');
  for (const btn of tabButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Posts & Carousels')) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  // 5. Click Save on the first carousel post (lantern)
  console.log("Clicking Save on first carousel post...");
  const saveButtons = await page.$$('button');
  for (const btn of saveButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.trim() === 'Save') {
      await btn.click();
      console.log("Saved carousel post!");
      break;
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  // 6. Go to /reels (Library)
  console.log("Navigating to /reels library...");
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_carousel_saved_correct_lantern_cover.png') });

  // 7. Click the card to open playback modal and verify carousel slides
  const card = await page.$('div.group.relative.flex.flex-col');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_carousel_playback_modal_slides.png') });
  }

  await browser.close();
  console.log("All carousel save verification screenshots captured!");
}

run().catch(console.error);
