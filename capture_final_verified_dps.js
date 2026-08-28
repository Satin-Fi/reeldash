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

  // Login
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // Save by typing in "+ Save Reel" modal
  await page.click('button[class*="bg-brand-500"]');
  await new Promise(r => setTimeout(r, 1000));
  await page.type('input[placeholder*="instagram.com"]', 'https://www.instagram.com/reel/DcgK_-KkgYR/');
  await new Promise(r => setTimeout(r, 500));

  // Click Save in modal
  const modalSaveBtn = await page.$('button.bg-brand-500, button.bg-brand-600');
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.trim() === 'Save Reel') {
      await b.click();
      console.log("Clicked Save Reel in modal!");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 4000));

  // Now go to Creator Romana
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_saved_card_final.png') });

  // Go to /reels to see library card
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_library_card_avatar_final.png') });

  // Click card to open playback modal
  const card = await page.$('div.group.relative.flex.flex-col');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_playback_modal_final.png') });
  }

  await browser.close();
  console.log("All verified screenshots saved!");
}

run().catch(console.error);
