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

  // 1. Log in
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 2. Click TopBar "+ Save Reel" button
  console.log("Clicking + Save Reel...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.textContent.includes('Save Reel'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 3. Paste URL into input
  const urlInput = await page.$('input[placeholder*="instagram.com"]');
  if (urlInput) {
    console.log("Entering Reel URL...");
    await urlInput.type('https://www.instagram.com/reel/C89tU-_yK7F/', { delay: 20 });
    await new Promise(r => setTimeout(r, 500));
    
    // Click submit in modal
    await page.evaluate(() => {
      const modal = document.querySelector('.fixed');
      if (modal) {
        const btn = modal.querySelector('button[type="submit"]') || Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
        if (btn) btn.click();
      }
    });
    console.log("Saving reel...");
    await new Promise(r => setTimeout(r, 6000));
  }

  // 4. Capture Library
  console.log("Capturing library...");
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_library_card.png') });

  // 5. Open Reel Player Modal
  console.log("Opening reel modal...");
  const card = await page.$('.group');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_modal_player.png') });
  }

  await browser.close();
  console.log("Finished all captures!");
}

run().catch(console.error);
