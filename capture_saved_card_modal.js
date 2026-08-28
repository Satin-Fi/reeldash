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

  // Go to creator romana
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  // Click Save button on first discovered reel
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Save')) {
      await b.click();
      console.log("Clicked Save button!");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 4000));

  // Screenshot creator page with SAVED IN YOUR LIBRARY card
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_saved_card_final.png') });

  // Click the saved card to open playback modal
  const savedCards = await page.$$('div.group.relative.flex.flex-col');
  if (savedCards.length > 0) {
    await savedCards[0].click();
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_playback_modal_final.png') });
  }

  await browser.close();
  console.log("Captured saved card and playback modal screenshots!");
}

run().catch(console.error);
