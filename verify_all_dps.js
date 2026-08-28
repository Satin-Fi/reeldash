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

  // 2. Go to Creator Romana
  console.log("Navigating to creator/lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_feed_with_dps.png') });

  // 3. Save a reel to see card footer in library
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Save')) {
      await b.click();
      console.log("Clicked Save!");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  // 4. Go to reels library
  console.log("Navigating to /reels...");
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_library_card_avatar.png') });

  // 5. Open Reel detail / playback page
  const card = await page.$('div.group.relative.flex.flex-col');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_playback_modal_avatar.png') });
  }

  await browser.close();
  console.log("All DP screenshots captured successfully!");
}

run().catch(console.error);
